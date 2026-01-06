const productTypeService = require('../services/productTypeService');

class ProductTypeController {
    // List product types
    async listProductType(req, res) {
        try {
            const productTypes = await productTypeService.listProductTypes();
            res.json({ success: true, data: productTypes });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving product types', error: error.message });
        }
    }

    // Get product type by ID
    async getProductType(req, res) {
        try {
            const { id } = req.params;
            const productType = await productTypeService.getProductTypeById(id);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(404).json({ message: 'Error retrieving product type', error: error.message });
        }
    }

    // Create product type
    async createProductType(req, res) {
        try {
            const productType = await productTypeService.createProductType(req.body);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(409).json({ message: 'Error creating product type', error: error.message });
        }
    }

    // Bulk create products
    async createManyProductType(req, res) {
        try {
            const productTypes = await productTypeService.createProductTypes(req.body);
            res.status(201).json({ success: true, data: productTypes });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update product type
    async updateProductType(req, res) {
        try {
            const { id } = req.params;
            const productType = await productTypeService.updateProductType(id, req.body);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(409).json({ message: 'Error updating product type', error: error.message });
        }
    }

    // Delete product type
    async removeProductType(req, res) {
        try {
            const { id } = req.params;
            const productType = await productTypeService.deleteProductType(id);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(404).json({ message: 'Error deleting product type', error: error.message });
        }
    }
}

module.exports = new ProductTypeController();
