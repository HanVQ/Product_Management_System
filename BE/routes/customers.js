const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => customerController.listCustomer(req, res));
router.post('/', (req, res) => customerController.createCustomer(req, res));
router.post('/bulk', (req, res) => customerController.createManyCustomers(req, res));
router.get('/:id', (req, res) => customerController.getCustomer(req, res));
router.put('/:id', (req, res) => customerController.updateCustomer(req, res));
router.delete('/:id', (req, res) => customerController.removeCustomer(req, res));
module.exports = router;