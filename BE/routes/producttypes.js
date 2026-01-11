const express = require('express');
const router = express.Router();
const productTypeController = require('../controllers/productTypeController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => productTypeController.getListProductType(req, res));
router.post('/', (req, res) => productTypeController.createProductType(req, res));
router.post('/bulk', (req, res) => productTypeController.createManyProductType(req, res));
router.get('/:id', (req, res) => productTypeController.getProductType(req, res));
router.put('/:id', (req, res) => productTypeController.updateProductType(req, res));
router.patch('/:id', (req, res) => productTypeController.toggleProductTypeStatus(req, res));
router.delete('/:id', (req, res) => productTypeController.removeProductType(req, res));

module.exports = router;