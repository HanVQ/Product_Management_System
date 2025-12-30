const userService = require('../services/userService');

class UserController {
    // List users (admin)
    async list(req, res) {
        try {
            const users = await userService.listUsers();
            res.json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single user (admin)
    async get(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            res.json({ success: true, user });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create user (admin)
    async create(req, res) {
        try {
            const user = await userService.createUser(req.body);
            res.status(201).json({ success: true, user });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Bulk create users
    async createMany(req, res) {
        try {
            const users = await userService.createUsers(req.body);
            res.status(201).json({ success: true, users });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update user (admin)
    async update(req, res) {
        try {
            const { id } = req.params;
            const user = await userService.updateUser(id, req.body);
            res.json({ success: true, user });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete user (admin)
    async remove(req, res) {
        try {
            const { id } = req.params;
            await userService.deleteUser(id);
            res.json({ success: true, message: 'User deleted' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}

module.exports = new UserController();
