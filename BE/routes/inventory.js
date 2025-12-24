const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', inventoryController.list);
router.post('/', inventoryController.create);
router.get('/:id', inventoryController.get);
router.put('/:id', inventoryController.update);
router.delete('/:id', inventoryController.remove);

module.exports = router;