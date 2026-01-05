const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => productController.listProduct(req, res));
router.post('/', (req, res) => productController.createProduct(req, res));
router.post('/bulk', (req, res) => productController.createManyProduct(req, res));
router.get('/:id', (req, res) => productController.getProduct(req, res));
router.put('/:id', (req, res) => productController.updateProduct(req, res));
router.delete('/:id', (req, res) => productController.removeProduct(req, res));

// // READ: user + admin
// router.get('/', authenticate, productController.list);
// router.get('/:id', authenticate, productController.get);

// WRITE: admin only
// router.post('/', authenticate, requireRole('admin'), productController.create);
// router.put('/:id', authenticate, requireRole('admin'), productController.update);
// router.delete('/:id', authenticate, requireRole('admin'), productController.remove);

module.exports = router;