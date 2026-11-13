const Cart = require('../models/Cart');
const Variant = require('../models/Variant');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { STATUS, APPROVE_STATUS } = require('../constants/enums');
const error = require('../utils/error');

const MAX_ITEMS = 50;
const MAX_QUANTITY = 1000;
const variantKey = value => String(value).toLowerCase();

function assertItem(item) {
    if (!item || !/^[0-9a-f]{24}$/i.test(String(item.variantId)) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY ||
        (item.price !== undefined && (!Number.isFinite(item.price) || item.price < 0))) {
        throw error('Invalid cart item', 400);
    }
}

function mergeItems(target, incoming) {
    const result = target.map(item => ({ ...item, variantId: variantKey(item.variantId) }));
    for (const item of incoming) {
        assertItem(item);
        const existing = result.find(entry => entry.variantId === variantKey(item.variantId));
        if (existing) {
            existing.quantity += item.quantity;
            assertItem(existing);
        } else {
            result.push({ ...item, variantId: variantKey(item.variantId) });
        }
    }
    if (result.length > MAX_ITEMS) throw error('Cart cannot contain more than 50 items', 400);
    return result;
}

function applyOperation(items, operation) {
    const { action, quantity, price } = operation;
    const variantId = variantKey(operation.variantId);
    if (action === 'clear') return [];
    if (action === 'remove') return items.filter(item => variantKey(item.variantId) !== variantId);
    assertItem({ variantId, quantity, price });
    if (action === 'add') return mergeItems(items, [{ variantId, quantity, ...(price !== undefined && { price }) }]);
    if (action !== 'set') throw error('Unsupported cart action', 400);
    if (!items.some(item => variantKey(item.variantId) === variantId)) throw error('Cart item not found', 404);
    return items.map(item => variantKey(item.variantId) === variantId
        ? { ...item, quantity, ...(price !== undefined && { price }) } : item);
}

function consumeItems(items, purchased) {
    const result = items.map(item => ({ ...item }));
    for (const item of purchased) {
        assertItem(item);
        const existing = result.find(entry => variantKey(entry.variantId) === variantKey(item.variantId));
        if (!existing || existing.quantity < item.quantity) throw error('Cart changed. Refresh and confirm your order again.', 409);
        existing.quantity -= item.quantity;
    }
    return result.filter(item => item.quantity > 0);
}

function assertOwner(userId, ownerId) {
    if (String(userId) !== String(ownerId).toLowerCase()) throw error('Account changed. Refresh your cart.', 409);
}

async function ensureCart(userId) {
    await Cart.init();
    try {
        return await Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId, items: [], revision: 0 } }, { upsert: true, new: true });
    } catch (err) {
        if (err.code !== 11000) throw err;
        return Cart.findOne({ userId });
    }
}

function isAvailable(record) {
    return record && !record.isDeleted && record.status === STATUS.ACTIVE && record.approveStatus === APPROVE_STATUS.APPROVED;
}

async function presentCart(cart) {
    const variants = await Variant.find({ _id: { $in: cart.items.map(item => item.variantId) } }).lean();
    const products = await Product.find({ _id: { $in: variants.map(item => item.productId) } }).lean();
    const stores = await Store.find({ _id: { $in: products.map(item => item.storeId) } }).lean();
    const items = cart.items.map(item => {
        const variant = variants.find(record => String(record._id) === String(item.variantId));
        const product = products.find(record => String(record._id) === String(variant?.productId));
        const store = stores.find(record => String(record._id) === String(product?.storeId));
        const displayPrice = variant?.price ?? item.knownPrice;
        if (!Number.isFinite(displayPrice) || displayPrice <= 0) throw error('Cart price unavailable. Please review this item.', 400);
        let unavailableReason;
        if (!isAvailable(variant) || !isAvailable(product)) unavailableReason = 'الصنف غير متاح حاليًا';
        else if (!isAvailable(store)) unavailableReason = 'المتجر غير متاح حاليًا';
        else if (variant.stock < item.quantity) unavailableReason = `الكمية المتاحة ${variant.stock}`;
        return {
            variantId: String(item.variantId), quantity: item.quantity,
            priceChanged: item.price !== undefined && variant !== undefined && item.price !== variant.price,
            ...(unavailableReason && { unavailableReason }),
            product: {
                id: String(product?._id || item.variantId), title: product?.title || item.title || 'صنف غير متاح',
                price: displayPrice, currency: '₪',
                image: variant?.image || product?.images?.[0] || '/placeholder_product.svg',
                category: String(product?.categoryId || ''), inStock: !unavailableReason,
                vendor: { id: String(store?._id || ''), name: store?.name || 'متجر غير متاح',
                    city: store?.address?.city || '', verified: store?.approveStatus === APPROVE_STATUS.APPROVED },
                variantId: String(item.variantId), variantAttributes: variant?.attributes || {},
            },
        };
    });
    return { ownerId: String(cart.userId), revision: cart.revision, items };
}

async function getCart(userId) {
    return presentCart(await ensureCart(userId));
}

async function writeCart(userId, body, importing = false) {
    assertOwner(userId, body.ownerId);
    if (!Number.isSafeInteger(body.revision) || body.revision < 0) throw error('Cart revision is required', 400);
    const cart = (await ensureCart(userId)).toObject();
    if (cart.revision !== body.revision) throw error('Cart changed. Refresh and try again.', 409);
    const items = importing ? mergeItems(cart.items, body.items) : applyOperation(cart.items, body);
    const missingSnapshots = items.filter(item => !item.title || item.knownPrice === undefined);
    if (missingSnapshots.length) {
        const variants = await Variant.find({ _id: { $in: missingSnapshots.map(item => item.variantId) } }).lean();
        const products = await Product.find({ _id: { $in: variants.map(item => item.productId) } }).lean();
        for (const item of missingSnapshots) {
            const variant = variants.find(record => String(record._id) === String(item.variantId));
            const product = products.find(record => String(record._id) === String(variant?.productId));
            if (!product || !variant || !Number.isFinite(variant.price) || variant.price <= 0) {
                throw error('A cart item no longer exists. Please remove or reselect it.', 400);
            }
            item.title = product.title;
            item.knownPrice = variant.price;
            if (item.price === undefined) item.price = variant.price;
        }
    }
    const changed = await Cart.updateOne({ userId, revision: body.revision }, {
        $set: { items }, $inc: { revision: 1 },
    }, { runValidators: true });
    if (changed.modifiedCount !== 1) throw error('Cart changed. Refresh and try again.', 409);
    return getCart(userId);
}

async function consumeCart(userId, purchased, revision, session) {
    const cart = await Cart.findOne({ userId }).session(session).lean();
    if (!cart || cart.revision !== revision) throw error('Cart changed. Refresh and confirm your order again.', 409);
    const items = consumeItems(cart.items, purchased);
    const changed = await Cart.updateOne({ userId, revision }, { $set: { items }, $inc: { revision: 1 } }, { session });
    if (changed.modifiedCount !== 1) throw error('Cart changed. Refresh and confirm your order again.', 409);
}

module.exports = { getCart, writeCart, consumeCart, assertOwner, mergeItems, applyOperation, consumeItems };
