const router = require('express').Router();
const { approveStore } = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLE } = require('../constants/enums');

router.patch('/:storeId/approve', authenticate, authorize(ROLE.ADMIN), approveStore);

module.exports = router;
