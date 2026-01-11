const Brand = require('../models/Brand');

class BrandService {
    async getListBrands() {
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

    // Bulk create brands
    async createBrands(brandsArray) {
        try {
            if (!Array.isArray(brandsArray) || brandsArray.length === 0) {
                throw new Error('Provide an array of brands to create');
            }

            // Basic validation: each item must have name and price
            const toInsert = brandsArray.map((p, idx) => {
                if (!p.name) {
                    throw new Error(`Brand at index ${idx} missing required fields (name)`);
                }
                return {
                    name: p.name,
                    description: p.description || ''
                };
            });

            const created = await Brand.insertMany(toInsert, { ordered: true });
            return created;
        } catch (error) {
            throw new Error(`Error bulk creating brands: ${error.message}`);
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

    async toggleBrandStatus(id) {
        try {
            const brand = await Brand.findById(id);
            if (!brand) {
                throw new Error('Brand not found');
            }
            brand.status = brand.status === 'Active' ? 'Inactive' : 'Active';
            await brand.save();
            return brand;
        } catch (error) {
            throw new Error(`Error toggling brand status: ${error.message}`);
        }
    }
}

module.exports = new BrandService();
