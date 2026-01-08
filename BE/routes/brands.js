const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => brandController.getListBrand(req, res));
router.post('/', (req, res) => brandController.createBrand(req, res));
router.post('/bulk', (req, res) => brandController.createManyBrand(req, res));
router.get('/:id', (req, res) => brandController.getBrand(req, res));
router.put('/:id', (req, res) => brandController.updateBrand(req, res));
router.delete('/:id', (req, res) => brandController.removeBrand(req, res));

module.exports = router;