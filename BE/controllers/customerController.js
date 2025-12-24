const customerService = require('../services/customerService');

class CustomerController {
    // List customers
    async list(req, res) {
        try {
            const customers = await customerService.listCustomers();
            res.json({ success: true, customers });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single customer
    async get(req, res) {
        try {
            const { id } = req.params;
            const customer = await customerService.getCustomerById(id);
            res.json({ success: true, customer });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create customer
    async create(req, res) {
        try {
            const customer = await customerService.createCustomer(req.body);
            res.status(201).json({ success: true, customer });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update customer
    async update(req, res) {
        try {
            const { id } = req.params;
            const customer = await customerService.updateCustomer(id, req.body);
            res.json({ success: true, customer });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete customer
    async remove(req, res) {
        try {
            const { id } = req.params;
            await customerService.deleteCustomer(id);
            res.json({ success: true, message: 'Customer deleted' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}

module.exports = new CustomerController();