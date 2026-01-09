const express = require('express');
const router = express.Router();
const productVariantController = require('../controllers/productVariantController');
const { authenticate, requireRole } = require('../middleware/auth');

// Admin-protected variant management
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => productVariantController.getListProductVariant(req, res));
router.post('/', (req, res) => productVariantController.createProductVariant(req, res));
router.get('/:id', (req, res) => productVariantController.getProductVariant(req, res));
router.put('/:id', (req, res) => productVariantController.updateProductVariant(req, res));
router.patch('/:id', (req, res) => productVariantController.toggleVariantStatus(req, res));
router.delete('/:id', (req, res) => productVariantController.removeProductVariant(req, res));
module.exports = router;
