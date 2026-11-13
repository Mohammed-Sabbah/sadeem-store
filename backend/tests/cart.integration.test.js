const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const Cart = require('../models/Cart');
const Variant = require('../models/Variant');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Wallet = require('../models/Wallet');
const OrderGroup = require('../models/OrderGroup.model');
const Order = require('../models/order.model');
const WalletTransaction = require('../models/WalletTransaction');
const cart = require('../services/cart.service');
const orders = require('../services/order.service');
const { validateCartChange, validateCartImport } = require('../schemas/cartSchema');
const dbName = `sadeem_cart_test_${Date.now()}_${process.pid}`;
const userId = new mongoose.Types.ObjectId();
const otherUser = new mongoose.Types.ObjectId();
const variantId = new mongoose.Types.ObjectId();
const productId = new mongoose.Types.ObjectId();
const storeId = new mongoose.Types.ObjectId();
const regionId = new mongoose.Types.ObjectId();
const item = quantity => ({ variantId: String(variantId), quantity, price: 5 });
const change = (revision, action, quantity) => ({ ownerId: String(userId), revision, action, variantId: String(variantId), ...(quantity !== undefined && { quantity }) });

test.before(async () => {
 await mongoose.connect('mongodb://127.0.0.1:27017/?replicaSet=rs0', { dbName, serverSelectionTimeoutMS: 5000 });
 await Promise.all([Cart, Variant, Product, Store, Wallet, OrderGroup, Order, WalletTransaction].map(model => model.init()));
 await Store.collection.insertOne({ _id: storeId, name: 'Test Store', ownerId: otherUser, regionId, address: {city:'Test'}, status:'active', approveStatus:'approved', isDeleted:false });
 await Product.collection.insertOne({ _id: productId, title:'Test Product', storeId, categoryId: new mongoose.Types.ObjectId(), images:['/test.png'], status:'active', approveStatus:'approved', isDeleted:false });
 await Variant.create({ _id:variantId, productId, price:5, stock:100, image:'/test.png', status:'active', approveStatus:'approved' });
 await Wallet.create({ userId, withdrawableBalance:1000 });
});
test.after(async () => {
 if (mongoose.connection.name !== dbName || !/^sadeem_cart_test_\d+_\d+$/.test(dbName)) throw new Error('Refusing test cleanup outside isolated database');
 await mongoose.connection.dropDatabase();
 await mongoose.disconnect();
});

test('imports commit once per original revision and cannot resurrect cleared items', async () => {
 const request = { ownerId:String(userId), revision:0, items:[item(2)] };
 const initial = await cart.writeCart(userId,request,true);
 assert.equal(initial.items[0].quantity,2);
 await assert.rejects(cart.writeCart(userId,request,true),{statusCode:409});
 assert.equal((await cart.getCart(userId)).items[0].quantity,2);
 await cart.writeCart(userId,change(initial.revision,'clear'));
 await assert.rejects(cart.writeCart(userId,request,true),{statusCode:409});
 assert.deepEqual((await cart.getCart(userId)).items,[]);
});

test('parallel repeated import has one winner without receipt persistence', async () => {
 const saved=await cart.getCart(userId);
 const request = {ownerId:String(userId),revision:saved.revision,items:[item(2)]};
 const results = await Promise.allSettled([cart.writeCart(userId,request,true),cart.writeCart(userId,request,true)]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 assert.equal(results.find(result=>result.status==='rejected').reason.statusCode,409);
 assert.equal((await cart.getCart(userId)).items[0].quantity,2);
 assert.equal(await mongoose.connection.collection('cartreceipts').countDocuments(),0);
});

test('parallel stale writes have one winner and do not overwrite each other', async () => {
 const saved=await cart.getCart(userId);
 const results=await Promise.allSettled([cart.writeCart(userId,change(saved.revision,'set',4)),cart.writeCart(userId,change(saved.revision,'set',7))]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 assert.equal(results.find(result=>result.status==='rejected').reason.statusCode,409);
});

test('owner assertions reject a request arriving under another account cookie', async () => {
 await assert.rejects(cart.writeCart(otherUser,change(0,'clear')),{statusCode:409});
 assert.deepEqual((await cart.getCart(otherUser)).items,[]);
});

test('lost PATCH response retry conflicts instead of duplicating an add', async () => {
 const saved=await cart.getCart(userId);
 const request=change(saved.revision,'add',2);
 const first=await cart.writeCart(userId,request);
 await assert.rejects(cart.writeCart(userId,request),{statusCode:409});
 assert.equal((await cart.getCart(userId)).items[0].quantity,first.items[0].quantity);
});

test('unavailable catalog records remain visible and price changes use current price', async () => {
 await Variant.updateOne({_id:variantId},{$set:{price:6,stock:0}});
 const saved=await cart.getCart(userId);
 assert.equal(saved.items[0].product.price,6);
 assert.equal(saved.items[0].priceChanged,true);
 assert.ok(saved.items[0].unavailableReason);
 await Variant.updateOne({_id:variantId},{$set:{price:5,stock:100}});
});

test('unknown imports are rejected without changing cart or fabricating a zero price', async () => {
 const before=await cart.getCart(userId);
 await assert.rejects(cart.writeCart(userId,{ownerId:String(userId),revision:before.revision,items:[{variantId:String(new mongoose.Types.ObjectId()),quantity:1,price:0}]},true),{statusCode:400});
 assert.deepEqual(await cart.getCart(userId),before);
});

test('a product deleted after saving retains a server-derived title and price', async () => {
 const saved=await Variant.findById(variantId).lean();
 await Variant.deleteOne({_id:variantId});
 const unavailable=await cart.getCart(userId);
 assert.equal(unavailable.items[0].product.price,5);
 assert.equal(unavailable.items[0].product.title,'Test Product');
 assert.ok(unavailable.items[0].unavailableReason);
 await Variant.collection.insertOne(saved);
});

function purchase(saved, expectedSubtotal=10) {
 return orders.createOrder({userId,ownerId:String(userId),cartRevision:saved.revision,expectedSubtotal,
  items:[{variantId:String(variantId),quantity:2}], deliveryAddress:'Test address', deliveryPhone:'0591234567',paymentMethod:'wallet'});
}

test('real checkout consumes only purchased quantities in the payment transaction', async () => {
 const saved=await cart.getCart(userId);
 const beforeBalance=(await Wallet.findOne({userId})).withdrawableBalance;
 const beforeStock=(await Variant.findById(variantId)).stock;
 const result=await purchase(saved);
 assert.ok(result.createdOrderGroup._id);
 assert.equal((await cart.getCart(userId)).items[0].quantity,saved.items[0].quantity-2);
 assert.equal((await Wallet.findOne({userId})).withdrawableBalance,beforeBalance-20);
 assert.equal((await Variant.findById(variantId)).stock,beforeStock-2);
});

test('failed payment rolls back consumption and order creation', async () => {
 await Wallet.updateOne({userId},{$set:{withdrawableBalance:0}});
 const before=await cart.getCart(userId);
 const count=await OrderGroup.countDocuments();
 await assert.rejects(purchase(before),/enough balance/);
 assert.deepEqual(await cart.getCart(userId),before);
 assert.equal(await OrderGroup.countDocuments(),count);
 await Wallet.updateOne({userId},{$set:{withdrawableBalance:1000}});
});

test('stale checkout and price change never debit wallet or consume items', async () => {
 const before=await cart.getCart(userId);
 const balance=(await Wallet.findOne({userId})).withdrawableBalance;
 await assert.rejects(purchase({...before,revision:before.revision-1}),{statusCode:409});
 await assert.rejects(purchase(before,9),{statusCode:409});
 assert.equal((await Wallet.findOne({userId})).withdrawableBalance,balance);
 assert.deepEqual(await cart.getCart(userId),before);
});

test('rejected or deleted active stores cannot receive orders or consume cart or funds', async () => {
 const before=await cart.getCart(userId);
 const balance=(await Wallet.findOne({userId})).withdrawableBalance;
 for(const unavailable of [{approveStatus:'rejected'},{isDeleted:true}]) {
  await Store.updateOne({_id:storeId},{$set:unavailable});
  await assert.rejects(purchase(before),/invalid or inactive/);
  assert.equal((await Wallet.findOne({userId})).withdrawableBalance,balance);
  assert.equal((await cart.getCart(userId)).revision,before.revision);
  await Store.updateOne({_id:storeId},{$set:{approveStatus:'approved',isDeleted:false}});
 }
 assert.deepEqual(await cart.getCart(userId),before);
});

test('checkout followed by another device addition retains new quantities', async () => {
 const before=await cart.getCart(userId);
 await purchase(before);
 const after=await cart.getCart(userId);
 const added=await cart.writeCart(userId,change(after.revision,'add',1));
 assert.equal(added.items[0].quantity,before.items[0].quantity-1);
});

test('checkout racing another device addition never loses the added quantity', async () => {
 const before=await cart.getCart(userId);
 const results=await Promise.allSettled([purchase(before),cart.writeCart(userId,change(before.revision,'add',3))]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
 const failed=results.find(result=>result.status==='rejected');
 assert.equal(failed.reason.statusCode,409);
 const after=await cart.getCart(userId);
 const purchased=results[0].status==='fulfilled';
 assert.equal(after.items[0].quantity,before.items[0].quantity+(purchased?-2:3));
});

test('API authentication isolates reads and refuses a stale owner assertion', async () => {
 const express=require('express');
 const User=require('../models/User');
 const {issueAccessToken}=require('../utils/token');
 const app=express();app.use(express.json());app.use('/api/cart',require('../routes/cart.route'));
 app.use((err,req,res,next)=>res.status(err.statusCode||500).json({message:err.message}));
 await User.collection.insertMany([
  {_id:userId,name:'A',email:'cart-a@example.test',status:'active',role:'user',isDeleted:false},
  {_id:otherUser,name:'B',email:'cart-b@example.test',status:'active',role:'user',isDeleted:false},
 ]);
 const server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
 const url=`http://127.0.0.1:${server.address().port}/api/cart`;
 try {
  assert.equal((await fetch(url)).status,401);
  const token=issueAccessToken({_id:otherUser,role:'user'});
  const headers={authorization:`Bearer ${token}`,'content-type':'application/json'};
  const response=await fetch(url,{headers});
  const body=await response.json();
  assert.equal(body.cart.ownerId,String(otherUser));
  assert.deepEqual(body.cart.items,[]);
  assert.equal((await fetch(url,{method:'PATCH',headers,body:JSON.stringify(change(0,'clear'))})).status,409);
 } finally { await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve())); }
});

test('HTTP boundary accepts remove/clear without quantity and rejects unknown owner fields', async () => {
 async function validate(middleware,body) {
  const req={body};let status=200;
  const res={status(value){status=value;return this;},json(){return this;}};
  for(const handler of middleware) { let next=false;await handler(req,res,()=>next=true);if(!next)break; }
  return status;
 }
 assert.equal(await validate(validateCartChange,change(0,'clear')),200);
 assert.equal(await validate(validateCartChange,change(0,'remove')),200);
 assert.equal(await validate(validateCartChange,{...change(0,'add',1),userId:String(otherUser)}),400);
 assert.equal(await validate(validateCartImport,{ownerId:String(userId),revision:0,items:[item(Infinity)]}),400);
 assert.equal(await validate(validateCartImport,{ownerId:String(userId),importId:randomUUID(),items:[item(1)]}),400);
});

test('legacy receipt data is preserved without new receipt writes', async () => {
 const collection=mongoose.connection.collection('cartreceipts');
 await collection.insertOne({operationId:'legacy-preserved',userId,fingerprint:'old'});
 const before=await cart.getCart(userId);
 await cart.writeCart(userId,change(before.revision,'add',1));
 assert.equal(await collection.countDocuments(),1);
 assert.equal((await collection.findOne({operationId:'legacy-preserved'})).fingerprint,'old');
});
