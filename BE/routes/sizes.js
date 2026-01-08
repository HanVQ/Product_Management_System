const express = require('express');
const router = express.Router();
const sizeController = require('../controllers/sizeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// Allow public read; admin for writes
router.get('/', (req, res) => sizeController.listSize(req, res));
router.post('/', (req, res) => sizeController.createSize(req, res));
router.put('/:id', (req, res) => sizeController.updateSize(req, res));
router.delete('/:id', (req, res) => sizeController.deleteSize(req, res));

module.exports = router;

