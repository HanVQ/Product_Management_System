const Brand = require('../models/Brand');

class BrandService {
    async listBrands() {
        try {
            return await Brand.find();
        } catch (error) {
            throw new Error(`Error listing brands: ${error.message}`);
        }
    }

    async getBrandById(id) {
        try {
            const brand = await Brand.findById(id);
            if (!brand) {
                throw new Error('Brand not found');
            }
            return brand;
        } catch (error) {
            throw new Error(`Error getting brand: ${error.message}`);
        }
    }

    async createBrand(brandData) {
        try {
            const { name, description } = brandData;
            
            if (!name) {
                throw new Error('Brand name is required');
            }

            const existing = await Brand.findOne({ name });
            if (existing) {
                throw new Error('Brand with this name already exists');
            }

            const newBrand = new Brand({
                name,
                description
            });

            await newBrand.save();
            return newBrand;
        } catch (error) {
            throw new Error(`Error creating brand: ${error.message}`);
        }
    }

    async updateBrand(id, updateData) {
        try {
            const { name, description } = updateData;
            
            if (!name) {
                throw new Error('Brand name is required');
            }

            const existing = await Brand.findOne({ name, _id: { $ne: id } });
            if (existing) {
                throw new Error('Brand with this name already exists');
            }

            const brand = await Brand.findByIdAndUpdate(
                id,
                { name, description },
                { new: true, runValidators: true }
            );

            if (!brand) {
                throw new Error('Brand not found');
            }

            return brand;
        } catch (error) {
            throw new Error(`Error updating brand: ${error.message}`);
        }
    }

    async deleteBrand(id) {
        try {
            const brand = await Brand.findByIdAndDelete(id);
            if (!brand) {
                throw new Error('Brand not found');
            }
            return brand;
        } catch (error) {
            throw new Error(`Error deleting brand: ${error.message}`);
        }
    }
}

module.exports = new BrandService();
