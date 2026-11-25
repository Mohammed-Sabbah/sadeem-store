const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getCart, changeCart, importCart } = require('../controllers/cart.controller');
const { validateCartChange, validateCartImport } = require('../schemas/cartSchema');

router.use(authenticate);
router.get('/', getCart);
router.patch('/', validateCartChange, changeCart);
router.post('/import', validateCartImport, importCart);

module.exports = router;
