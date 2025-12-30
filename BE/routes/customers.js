const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => customerController.list(req, res));
router.post('/', (req, res) => customerController.create(req, res));
router.post('/bulk', (req, res) => customerController.createMany(req, res));
router.get('/:id', (req, res) => customerController.get(req, res));
router.put('/:id', (req, res) => customerController.update(req, res));
router.delete('/:id', (req, res) => customerController.remove(req, res));
module.exports = router;