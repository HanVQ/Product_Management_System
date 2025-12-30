const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productTypeController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => productTypeController.list(req, res));
router.post('/', (req, res) => productTypeController.create(req, res));
router.post('/bulk', (req, res) => productTypeController.createMany(req, res));
router.get('/:id', (req, res) => productTypeController.get(req, res));
router.put('/:id', (req, res) => productTypeController.update(req, res));
router.delete('/:id', (req, res) => productTypeController.remove(req, res));

module.exports = router;