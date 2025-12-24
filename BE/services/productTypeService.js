const ProductType = require('../models/ProductType');

class ProductTypeService {
    async listProductTypes() {
        try {
            return await ProductType.find();
        } catch (error) {
            throw new Error(`Error listing product types: ${error.message}`);
        }
    }

    async getProductTypeById(id) {
        try {
            const productType = await ProductType.findById(id);
            if (!productType) {
                throw new Error('Product type not found');
            }
            return productType;
        } catch (error) {
            throw new Error(`Error getting product type: ${error.message}`);
        }
    }

    async createProductType(productTypeData) {
        try {
            const { name, description } = productTypeData;
            
            if (!name) {
                throw new Error('Product type name is required');
            }

            const existing = await ProductType.findOne({ name });
            if (existing) {
                throw new Error('Product type with this name already exists');
            }

            const newProductType = new ProductType({
                name,
                description
            });

            await newProductType.save();
            return newProductType;
        } catch (error) {
            throw new Error(`Error creating product type: ${error.message}`);
        }
    }

    async updateProductType(id, updateData) {
        try {
            const { name, description } = updateData;
            
            if (!name) {
                throw new Error('Product type name is required');
            }

            const existing = await ProductType.findOne({ name, _id: { $ne: id } });
            if (existing) {
                throw new Error('Product type with this name already exists');
            }

            const productType = await ProductType.findByIdAndUpdate(
                id,
                { name, description },
                { new: true, runValidators: true }
            );

            if (!productType) {
                throw new Error('Product type not found');
            }

            return productType;
        } catch (error) {
            throw new Error(`Error updating product type: ${error.message}`);
        }
    }

    async deleteProductType(id) {
        try {
            const productType = await ProductType.findByIdAndDelete(id);
            if (!productType) {
                throw new Error('Product type not found');
            }
            return productType;
        } catch (error) {
            throw new Error(`Error deleting product type: ${error.message}`);
        }
    }
}

module.exports = new ProductTypeService();
