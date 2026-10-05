const express = require('express');
const { getRegions, calculateFee } = require('../controllers/deliveryController');

const router = express.Router();

router.get('/regions', getRegions);
router.post('/calculate', calculateFee);

module.exports = router;
