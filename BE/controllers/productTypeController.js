const productTypeService = require('../services/productTypeService');

class ProductTypeController {
    // List product types
    async list(req, res) {
        try {
            const productTypes = await productTypeService.listProductTypes();
            res.json({ success: true, data: productTypes });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving product types', error: error.message });
        }
    }

    // Get product type by ID
    async get(req, res) {
        try {
            const { id } = req.params;
            const productType = await productTypeService.getProductTypeById(id);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(404).json({ message: 'Error retrieving product type', error: error.message });
        }
    }

    // Create product type
    async create(req, res) {
        try {
            const productType = await productTypeService.createProductType(req.body);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(409).json({ message: 'Error creating product type', error: error.message });
        }
    }

    // Update product type
    async update(req, res) {
        try {
            const { id } = req.params;
            const productType = await productTypeService.updateProductType(id, req.body);
            res.json({ success: true, data: productType });
        } catch (error) {
            res.status(409).json({ message: 'Error updating product type', error: error.message });
        }
    }

    // Delete product type
    async remove(req, res) {
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
