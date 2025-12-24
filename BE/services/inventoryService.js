const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

class InventoryService {
    async listTransactions() {
        try {
            return await Inventory.find()
                .populate('product', 'name')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing transactions: ${error.message}`);
        }
    }

    async getTransactionById(id) {
        try {
            const transaction = await Inventory.findById(id).populate('product', 'name price stock');
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            return transaction;
        } catch (error) {
            throw new Error(`Error getting transaction: ${error.message}`);
        }
    }

    async createTransaction(transactionData) {
        try {
            const { product, type, quantity, reason } = transactionData;
            
            if (!product || !type || !quantity) {
                throw new Error('Product, type, and quantity are required');
            }

            const prod = await Product.findById(product);
            if (!prod) {
                throw new Error('Product not found');
            }

            if (type === 'outbound' && prod.stock < quantity) {
                throw new Error('Insufficient stock');
            }

            const newTransaction = new Inventory({
                product,
                type,
                quantity,
                reason
            });
            await newTransaction.save();

            // Update stock
            if (type === 'inbound') {
                prod.stock += quantity;
            } else {
                prod.stock -= quantity;
            }
            await prod.save();

            return newTransaction;
        } catch (error) {
            throw new Error(`Error creating transaction: ${error.message}`);
        }
    }

    async updateTransaction(id, updateData) {
        try {
            const transaction = await Inventory.findById(id);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            const { reason } = updateData;
            transaction.reason = reason !== undefined ? reason : transaction.reason;
            await transaction.save();
            return transaction;
        } catch (error) {
            throw new Error(`Error updating transaction: ${error.message}`);
        }
    }

    async deleteTransaction(id) {
        try {
            const transaction = await Inventory.findByIdAndDelete(id);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Reverse stock change
            const prod = await Product.findById(transaction.product);
            if (prod) {
                if (transaction.type === 'inbound') {
                    prod.stock -= transaction.quantity;
                } else {
                    prod.stock += transaction.quantity;
                }
                await prod.save();
            }

            return transaction;
        } catch (error) {
            throw new Error(`Error deleting transaction: ${error.message}`);
        }
    }
}

module.exports = new InventoryService();
