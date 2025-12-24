const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

class OrderService {
    async listOrders() {
        try {
            return await Order.find()
                .populate('customer', 'name email')
                .populate('items.product', 'name price productType')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing orders: ${error.message}`);
        }
    }

    async getOrderById(id) {
        try {
            const order = await Order.findById(id)
                .populate('customer', 'name email phone address')
                .populate('items.product', 'name price category');
            
            if (!order) {
                throw new Error('Order not found');
            }
            return order;
        } catch (error) {
            throw new Error(`Error getting order: ${error.message}`);
        }
    }

    async createOrder(orderData, tokenUser) {
        try {
            const { items } = orderData;
            
            if (!items || items.length === 0) {
                throw new Error('Items are required');
            }

            // 1. Check or create customer record
            let customer = await Customer.findOne({ userId: tokenUser._id });
            if (!customer) {
                customer = await Customer.create({
                    userId: tokenUser._id,
                    name: tokenUser.name,
                    email: tokenUser.email,
                    phone: tokenUser.phone || null,
                    address: tokenUser.address || null,
                    totalOrders: 0,
                    totalSpent: 0
                });
            }

            // 2. Calculate order items and check stock
            let totalAmount = 0;
            const orderItems = [];
            
            for (const item of items) {
                const product = await Product.findById(item.product);
                if (!product) {
                    throw new Error(`Product ${item.product} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                orderItems.push({
                    product: item.product,
                    quantity: item.quantity,
                    price: product.price,
                });
                totalAmount += product.price * item.quantity;

                product.stock -= item.quantity;
                await product.save();

                // Record inventory outbound
                await Inventory.create({
                    product: product._id,
                    type: 'outbound',
                    quantity: item.quantity,
                    reason: `Order created by ${tokenUser.email}`,
                    transactionDate: new Date()
                });
            }

            // 3. Create new order
            const newOrder = new Order({
                customer: customer._id,
                items: orderItems,
                totalAmount,
                status: 'pending',
                createdAt: new Date()
            });
            await newOrder.save();

            // 4. Update customer
            customer.totalOrders += 1;
            customer.totalSpent += totalAmount;
            await customer.save();

            return newOrder;
        } catch (error) {
            throw new Error(`Error creating order: ${error.message}`);
        }
    }

    async updateOrder(id, updateData) {
        try {
            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order not found');
            }

            const { status } = updateData;
            if (status) {
                order.status = status;
            }

            await order.save();
            return order;
        } catch (error) {
            throw new Error(`Error updating order: ${error.message}`);
        }
    }

    async deleteOrder(id) {
        try {
            const order = await Order.findByIdAndDelete(id);
            if (!order) {
                throw new Error('Order not found');
            }
            return order;
        } catch (error) {
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }
}

module.exports = new OrderService();
