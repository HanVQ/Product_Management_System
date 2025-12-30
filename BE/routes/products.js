const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', productController.list);
router.post('/', productController.create);
router.post('/bulk', productController.createMany);
router.get('/:id', productController.get);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

// // READ: user + admin
// router.get('/', authenticate, productController.list);
// router.get('/:id', authenticate, productController.get);

// WRITE: admin only
// router.post('/', authenticate, requireRole('admin'), productController.create);
// router.put('/:id', authenticate, requireRole('admin'), productController.update);
// router.delete('/:id', authenticate, requireRole('admin'), productController.remove);

module.exports = router;