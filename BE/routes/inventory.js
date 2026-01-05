const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => inventoryController.listInventory(req, res));
router.post('/', (req, res) => inventoryController.createInventory(req, res));
router.get('/:id', (req, res) => inventoryController.getInventory(req, res));
router.put('/:id', (req, res) => inventoryController.updateInventory(req, res));
router.delete('/:id', (req, res) => inventoryController.removeInventory(req, res));
module.exports = router;