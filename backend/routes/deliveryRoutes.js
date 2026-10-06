const express = require('express');
const { getRegions, calculateFee } = require('../controllers/deliveryController');
const { validateDeliveryCalculation } = require('../schemas/deliverySchema');

const router = express.Router();

router.get('/regions', getRegions);
router.post('/calculate', validateDeliveryCalculation, calculateFee);

module.exports = router;
