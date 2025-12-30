const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => inventoryController.list(req, res));
router.post('/', (req, res) => inventoryController.create(req, res));
router.get('/:id', (req, res) => inventoryController.get(req, res));
router.put('/:id', (req, res) => inventoryController.update(req, res));
router.delete('/:id', (req, res) => inventoryController.remove(req, res));
module.exports = router;