const Customer = require('../models/Customer');

class CustomerService {
    async getListCustomers() {
        try {
            return await Customer.find().sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error listing customers: ${error.message}`);
        }
    }

    async getCustomerById(id) {
        try {
            const customer = await Customer.findById(id);
            if (!customer) {
                throw new Error('Customer not found');
            }
            return customer;
        } catch (error) {
            throw new Error(`Error getting customer: ${error.message}`);
        }
    }

    async createCustomer(customerData) {
        try {
            const { name, email, phone, address } = customerData;
            
            if (!name || !email) {
                throw new Error('Name and email are required');
            }

            const existing = await Customer.findOne({ email: email.toLowerCase() });
            if (existing) {
                throw new Error('Customer already exists');
            }

            const newCustomer = new Customer({
                name,
                email: email.toLowerCase(),
                phone,
                address
            });

            await newCustomer.save();
            return newCustomer;
        } catch (error) {
            throw new Error(`Error creating customer: ${error.message}`);
        }
    }

    // Bulk create customers
    async createCustomers(customersArray) {
            try {
                if (!Array.isArray(customersArray) || customersArray.length === 0) {
                    throw new Error('Provide an array of customers to create');
                }

                // Basic validation: each item must have name and email
                const toInsert = customersArray.map((c, idx) => {
                    if (!c.name || !c.email) {
                        throw new Error(`Customer at index ${idx} missing required fields (name, email)`);
                    }
                    return {
                        name: c.name,
                        email: c.email.toLowerCase(),
                        phone: c.phone || null,
                        address: c.address || null
                    };
                });
                const created = await Customer.insertMany(toInsert, { ordered: true });
                return created;
            } catch (error) {
                throw new Error(`Error bulk creating customers: ${error.message}`);
            }
    }

    async updateCustomer(id, updateData) {
        try {
            const customer = await Customer.findById(id);
            if (!customer) {
                throw new Error('Customer not found');
            }

            const { name, email, phone, address } = updateData;

            if (email && email !== customer.email) {
                const existing = await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
                if (existing) {
                    throw new Error('Email already in use');
                }
            }

            customer.name = name || customer.name;
            customer.email = email ? email.toLowerCase() : customer.email;
            customer.phone = phone !== undefined ? phone : customer.phone;
            customer.address = address !== undefined ? address : customer.address;

            await customer.save();
            return customer;
        } catch (error) {
            throw new Error(`Error updating customer: ${error.message}`);
        }
    }

    async deleteCustomer(id) {
        try {
            const customer = await Customer.findByIdAndDelete(id);
            if (!customer) {
                throw new Error('Customer not found');
            }
            return customer;
        } catch (error) {
            throw new Error(`Error deleting customer: ${error.message}`);
        }
    }
}

module.exports = new CustomerService();
