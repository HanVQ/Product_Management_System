const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');

class InventoryService {
    async listTransactions() {
        try {
            return await Inventory.find()
                .populate('product', 'name')
                .populate('variant', 'sku price stock')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing transactions: ${error.message}`);
        }
    }

    async getTransactionById(id) {
        try {
            const transaction = await Inventory.findById(id)
                .populate('product', 'name price stock')
                .populate('variant', 'sku price stock');
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
            const { product, variant, type, quantity, reason } = transactionData;

            if ((!product && !variant) || !type || !quantity) {
                throw new Error('Product or variant, type, and quantity are required');
            }

            let prod = null;
            let varDoc = null;

            if (variant) {
                varDoc = await ProductVariant.findById(variant);
                if (!varDoc) throw new Error('Variant not found');
                if (type === 'outbound' && varDoc.stock < quantity) throw new Error('Insufficient variant stock');
            } else {
                prod = await Product.findById(product);
                if (!prod) throw new Error('Product not found');
                if (type === 'outbound' && prod.stock < quantity) throw new Error('Insufficient stock');
            }

            const newTransaction = new Inventory({
                product: product || (varDoc ? varDoc.product : null),
                variant: variant || null,
                type,
                quantity,
                reason
            });
            await newTransaction.save();

            // Update stock
            if (varDoc) {
                varDoc.stock = type === 'inbound' ? varDoc.stock + quantity : varDoc.stock - quantity;
                await varDoc.save();
            } else if (prod) {
                prod.stock = type === 'inbound' ? prod.stock + quantity : prod.stock - quantity;
                await prod.save();
            }

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
            if (transaction.variant) {
                const varDoc = await ProductVariant.findById(transaction.variant);
                if (varDoc) {
                    if (transaction.type === 'inbound') {
                        varDoc.stock -= transaction.quantity;
                    } else {
                        varDoc.stock += transaction.quantity;
                    }
                    await varDoc.save();
                }
            } else if (transaction.product) {
                const prod = await Product.findById(transaction.product);
                if (prod) {
                    if (transaction.type === 'inbound') {
                        prod.stock -= transaction.quantity;
                    } else {
                        prod.stock += transaction.quantity;
                    }
                    await prod.save();
                }
            }

            return transaction;
        } catch (error) {
            throw new Error(`Error deleting transaction: ${error.message}`);
        }
    }
}

module.exports = new InventoryService();
