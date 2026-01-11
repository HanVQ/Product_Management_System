const productVariantService = require('../services/productVariantService');

class ProductVariantController {
    async getListProductVariant(req, res) {
        try {
            const { product } = req.query;
            const variants = await productVariantService.getListVariants({ product });
            res.json({ success: true, variants });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async getProductVariant(req, res) {
        try {
            const { id } = req.params;
            const v = await productVariantService.getVariantById(id);
            res.json({ success: true, variant: v });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }

    async createProductVariant(req, res) {
        try {
            const v = await productVariantService.createVariant(req.body);
            res.status(201).json({ success: true, variant: v });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async updateProductVariant(req, res) {
        try {
            const { id } = req.params;
            const v = await productVariantService.updateVariant(id, req.body);
            res.json({ success: true, variant: v });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async removeProductVariant(req, res) {
        try {
            const { id } = req.params;
            await productVariantService.deleteVariant(id);
            res.json({ success: true, message: 'Variant deleted' });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    }
    async toggleVariantStatus(req, res) {
        try {
            const { id } = req.params;
            const variant = await productVariantService.toggleVariantStatus(id);
            res.json({ success: true, variant });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }}

module.exports = new ProductVariantController();
