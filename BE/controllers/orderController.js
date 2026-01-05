const orderService = require('../services/orderService');

class OrderController {
    // List orders
    async listOrder(req, res) {
        try {
            const orders = await orderService.listOrders();
            res.json({ success: true, orders });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single order
    async getOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await orderService.getOrderById(id);
            res.json({ success: true, order });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create order
    async createOrder(req, res) {
        try {
            const order = await orderService.createOrder(req.body, req.user);
            res.status(201).json({ success: true, order });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update order
    async updateOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await orderService.updateOrder(id, req.body);
            res.json({ success: true, order });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete order
    async removeOrder(req, res) {
        try {
            const { id } = req.params;
            await orderService.deleteOrder(id);
            res.json({ success: true, message: 'Order deleted, stock restored, customer updated, inventory logged' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}

module.exports = new OrderController();