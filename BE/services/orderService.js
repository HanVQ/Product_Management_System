const Order = require('../models/Order');
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

class OrderService {
    async getListOrders() {
        try {
            return await Order.find()
                .populate('customer', 'name email')
                .populate('items.product', 'name price productType')
                .populate('items.variant', 'sku price size color')
                .sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing orders: ${error.message}`);
        }
    }

    async getOrderById(id) {
        try {
            const order = await Order.findById(id)
                .populate('customer', 'name email phone address')
                .populate('items.product', 'name price category')
                .populate('items.variant', 'sku price size color');

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

            // 1. Determine customer: prefer provided customer id in orderData, otherwise use tokenUser
            let customer = null;
            if (orderData.customer) {
                customer = await Customer.findById(orderData.customer);
                if (!customer) {
                    throw new Error('Provided customer not found');
                }
            } else {
                // find or create customer record for tokenUser
                customer = await Customer.findOne({ userId: tokenUser._id });
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
            }

            // 2. Calculate order items and check stock
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                // Support variant if provided
                if (item.variant) {
                    const variant = await ProductVariant.findById(item.variant);
                    if (!variant) throw new Error(`Variant ${item.variant} not found`);
                    if (variant.stock < item.quantity) throw new Error(`Insufficient stock for variant ${variant.sku}`);

                    orderItems.push({
                        product: variant.product,
                        variant: variant._id,
                        quantity: item.quantity,
                        price: variant.price,
                    });
                    totalAmount += variant.price * item.quantity;

                    variant.stock -= item.quantity;
                    await variant.save();

                    // Record inventory outbound for variant
                    await Inventory.create({
                        product: variant.product,
                        variant: variant._id,
                        type: 'outbound',
                        quantity: item.quantity,
                        reason: `Order created by ${tokenUser.email}`,
                        transactionDate: new Date()
                    });
                } else {
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
            }

            // 3. Create new order (ensure unique orderNumber to avoid null-unique index collisions)
            const newOrder = new Order({
                customer: customer._id,
                items: orderItems,
                totalAmount,
                status: 'pending',
                orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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
            const order = await Order.findById(id);
            if (!order) {
                throw new Error('Order not found');
            }

            // 1. Restore stock and log inventory inbound
            for (const item of order.items) {
                if (item.variant) {
                    const variant = await ProductVariant.findById(item.variant);
                    if (variant) {
                        variant.stock += item.quantity;
                        await variant.save();

                        // Log inventory inbound
                        await Inventory.create({
                            product: item.product,
                            variant: item.variant,
                            type: 'inbound',
                            quantity: item.quantity,
                            reason: `Order ${id} cancelled`,
                            transactionDate: new Date()
                        });
                    }
                } else {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();

                        // Log inventory inbound
                        await Inventory.create({
                            product: item.product,
                            type: 'inbound',
                            quantity: item.quantity,
                            reason: `Order ${id} cancelled`,
                            transactionDate: new Date()
                        });
                    }
                }
            }

            // 2. Update customer stats
            const customer = await Customer.findById(order.customer);
            if (customer) {
                customer.totalOrders -= 1;
                customer.totalSpent -= order.totalAmount;
                await customer.save();
            }

            // 3. Delete order
            await Order.findByIdAndDelete(id);
            return order;
        } catch (error) {
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }
}

module.exports = new OrderService();
