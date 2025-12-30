const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => brandController.list(req, res));
router.post('/', (req, res) => brandController.create(req, res));
router.post('/bulk', (req, res) => brandController.createMany(req, res));
router.get('/:id', (req, res) => brandController.get(req, res));
router.put('/:id', (req, res) => brandController.update(req, res));
router.delete('/:id', (req, res) => brandController.remove(req, res));

module.exports = router;