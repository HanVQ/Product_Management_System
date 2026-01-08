const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes protected and require admin role
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res) => userController.getListUser(req, res));
router.post('/', (req, res) => userController.createUser(req, res));
router.post('/bulk', (req, res) => userController.createManyUser(req, res));
router.get('/:id', (req, res) => userController.getUser(req, res));
router.put('/:id', (req, res) => userController.updateUser(req, res));
router.delete('/:id', (req, res) => userController.removeUser(req, res));

module.exports = router;
