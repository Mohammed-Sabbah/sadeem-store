const cartService = require('../services/cart.service');
const { success } = require('../utils/responses');

async function getCart(req, res, next) {
    try {
        return success(res, 200, { cart: await cartService.getCart(req.user._id) });
    } catch (err) { next(err); }
}

async function changeCart(req, res, next) {
    try {
        return success(res, 200, { cart: await cartService.writeCart(req.user._id, req.body) });
    } catch (err) { next(err); }
}

async function importCart(req, res, next) {
    try {
        return success(res, 200, { cart: await cartService.writeCart(req.user._id, req.body, true) });
    } catch (err) { next(err); }
}

module.exports = { getCart, changeCart, importCart };
