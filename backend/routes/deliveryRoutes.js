const express = require('express');
const { calculateFee } = require('../controllers/deliveryController');
const { validateDeliveryCalculation } = require('../schemas/deliverySchema');

const router = express.Router();

// حساب رسوم التوصيل وفق إحداثيات المتاجر والزبون وخوارزمية المسافات
router.post('/calculate', validateDeliveryCalculation, calculateFee);

module.exports = router;
