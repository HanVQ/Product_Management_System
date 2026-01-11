const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => orderController.getListOrder(req, res));
router.post('/', (req, res) => orderController.createOrder(req, res));
router.get('/:id', (req, res) => orderController.getOrder(req, res));
router.put('/:id', (req, res) => orderController.updateOrder(req, res));
router.delete('/:id', (req, res) => orderController.removeOrder(req, res));
module.exports = router;