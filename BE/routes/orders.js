const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', orderController.list);
router.post('/', orderController.create);
router.get('/:id', orderController.get);
router.put('/:id', orderController.update);
router.delete('/:id', orderController.remove);

module.exports = router;