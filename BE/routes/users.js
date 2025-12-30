const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => userController.list(req, res));
router.post('/', (req, res) => userController.create(req, res));
router.post('/bulk', (req, res) => userController.createMany(req, res));
router.get('/:id', (req, res) => userController.get(req, res));
router.put('/:id', (req, res) => userController.update(req, res));
router.delete('/:id', (req, res) => userController.remove(req, res));

module.exports = router;
