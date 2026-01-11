const ProductVariant = require('../models/ProductVariant');
const Product = require('../models/Product');

class ProductVariantService {
    async getListVariants(filters = {}) {
        const { product } = filters;
        const query = {};

        if (product) {
            query.product = product;
        }

        return await ProductVariant.find(query)
            .populate('size color')
            .sort({ createdAt: -1 });
    }

    async getVariantById(id) {
        const variant = await ProductVariant.findById(id)
            .populate('product size color');

        if (!variant) {
            throw new Error('Variant not found');
        }

        return variant;
    }


    async createVariant(data) {
        const { product, size, color, price, stock } = data;

        // Validate required fields
        if (!product) {
            throw new Error('Product ID is required');
        }

        // Verify product exists
        const productExit = await Product.findById(product);
        if (!productExit) {
            throw new Error('Product not found');
        }

        // Normalize optional fields - convert empty strings to null
        if (size === '' || size === undefined) {
            throw new Error('Size not null');
        }

        if (color === '' || color === undefined) {
            throw new Error('Color not null');
        }

        // Check for duplicate variant (same product + size + color combination)
        const existingVariant = await ProductVariant.findOne({
            product,
            size: size,
            color: color
        });

        if (existingVariant) {
            throw new Error('This product already has a variant with this Size and Color combination');
        }

        // Create and save new variant
        const variant = new ProductVariant({
            product,
            size: size,
            color: color,
            price: price || 0,
            stock: stock || 0
        });

        try {
            await variant.save();
        } catch (err) {
            // Handle MongoDB duplicate key error
            if (err.code === 11000) {
                const field = Object.keys(err.keyPattern)[0];
                throw new Error(`Duplicate value for field: ${field}`);
            }
            throw err;
        }

        return variant;
    }

    async updateVariant(id, updateData) {
        const variant = await ProductVariant.findById(id);
        if (!variant) {
            throw new Error('Variant not found');
        }

        const { price, stock, size, color } = updateData;

        // Update fields if provided
        if (price !== undefined && price !== null) {
            variant.price = price;
        }
        if (stock !== undefined && stock !== null) {
            variant.stock = stock;
        }
        if (size !== undefined) {
            variant.size = (size && size !== '') ? size : null;
        }
        if (color !== undefined) {
            variant.color = (color && color !== '') ? color : null;
        }

        try {
            await variant.save();
        } catch (err) {
            if (err.code === 11000) {
                throw new Error('Duplicate variant: A variant with this Size and Color combination already exists');
            }
            throw err;
        }

        return variant;
    }

    async deleteVariant(id) {
        const variant = await ProductVariant.findByIdAndDelete(id);
        if (!variant) {
            throw new Error('Variant not found');
        }
        return variant;
    }

    async toggleVariantStatus(id) {
        try {
            const variant = await ProductVariant.findById(id);
            if (!variant) {
                throw new Error('Variant not found');
            }
            variant.status = variant.status === 'Active' ? 'Inactive' : 'Active';
            await variant.save();
            return variant;
        } catch (error) {
            throw new Error(`Error toggling variant status: ${error.message}`);
        }
    }
}
module.exports = new ProductVariantService();