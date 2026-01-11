const inventoryService = require('../services/inventoryService');

class InventoryController {
    // List transactions
    async getListInventory(req, res) {
        try {
            const transactions = await inventoryService.getListTransactions();
            res.json({ success: true, transactions });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single transaction
    async getInventory(req, res) {
        try {
            const { id } = req.params;
            const transaction = await inventoryService.getTransactionById(id);
            res.json({ success: true, transaction });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create transaction
    async createInventory(req, res) {
        try {
            const transaction = await inventoryService.createTransaction(req.body);
            res.status(201).json({ success: true, transaction });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update transaction
    async updateInventory(req, res) {
        try {
            const { id } = req.params;
            const transaction = await inventoryService.updateTransaction(id, req.body);
            res.json({ success: true, transaction });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete transaction
    async removeInventory(req, res) {
        try {
            const { id } = req.params;
            await inventoryService.deleteTransaction(id);
            res.json({ success: true, message: 'Transaction deleted and stock adjusted' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}

module.exports = new InventoryController();