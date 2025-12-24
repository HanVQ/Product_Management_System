const productService = require('../services/productService');

class ProductController {
    // List products
    async list(req, res) {
        try {
            const products = await productService.listProducts();
            res.json({ success: true, products });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // Get single product
    async get(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.getProductById(id);
            res.json({ success: true, product });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    // Create product
    async create(req, res) {
        try {
            const product = await productService.createProduct(req.body);
            res.status(201).json({ success: true, product });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Update product
    async update(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.updateProduct(id, req.body);
            res.json({ success: true, product });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    // Delete product
    async remove(req, res) {
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