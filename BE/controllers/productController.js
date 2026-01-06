const productService = require('../services/productService');

class ProductController {
    // List products with filtering, sorting, and pagination
    async listProduct(req, res) {
        try {
            const filters = {
                search: req.query.search || '',
                productType: req.query.productType || '',
                brand: req.query.brand || '',
                stockStatus: req.query.stockStatus || '',
                sortField: req.query.sortField || 'createdAt',
                sortOrder: req.query.sortOrder || -1,
                page: req.query.page || 1,
                limit: req.query.limit || 10
            };
            const result = await productService.listProducts(filters);
            res.json({ success: true, ...result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single product
    async getProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);
            res.json({ success: true, product });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create product
    async createProduct(req, res) {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ success: true, product });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Bulk create products
    async createManyProduct(req, res) {
        try {
            const product = await productService.createProducts(req.body);
            res.status(201).json({ success: true, product });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update product
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.updateProduct(id, req.body);
            res.json({ success: true, product });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete product
    async removeProduct(req, res) {
        try {
            const { id } = req.params;
            await productService.deleteProduct(id);
            res.json({ success: true, message: 'Product deleted' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ProductController();