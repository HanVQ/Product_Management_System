const express = require('express');
const router = express.Router();
const colorController = require('../controllers/colorController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('admin'));

// Public read, admin create and delete
router.get('/', (req, res) => colorController.getListColor(req, res));
router.post('/', (req, res) => colorController.createColor(req, res));
router.put('/:id', (req, res) => colorController.updateColor(req, res));
router.delete('/:id', (req, res) => colorController.deleteColor(req, res));

module.exports = router;

