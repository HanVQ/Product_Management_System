const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => orderController.list(req, res));
router.post('/', (req, res) => orderController.create(req, res));
router.get('/:id', (req, res) => orderController.get(req, res));
router.put('/:id', (req, res) => orderController.update(req, res));
router.delete('/:id', (req, res) => orderController.remove(req, res));
module.exports = router;