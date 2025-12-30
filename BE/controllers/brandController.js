const brandService = require('../services/brandService');

class BrandController {
    // List brands
    async list(req, res) {
        try {
            const brands = await brandService.listBrands();
            res.json({ success: true, data: brands });
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving brands', error: error.message });
        }
    }

    // Get brand by ID
    async get(req, res) {
        try {
            const { id } = req.params;
            const brand = await brandService.getBrandById(id);
            res.json({ success: true, data: brand });
        } catch (error) {
            res.status(404).json({ message: 'Error retrieving brand', error: error.message });
        }
    }

    // Create brand
    async create(req, res) {
        try {
            const brand = await brandService.createBrand(req.body);
            res.json({ success: true, data: brand });
        } catch (error) {
            res.status(409).json({ message: 'Error creating brand', error: error.message });
        }
    }

    // Bulk create brand
    async createMany(req, res) {
            try {
                const brand = await brandService.createBrands(req.body);
                res.json({ success: true, data: brand });
            } catch (err) {
                res.status(400).json({ success: false, message: err.message });
            }
    }

    // Update brand
    async update(req, res) {
        try {
            const { id } = req.params;
            const brand = await brandService.updateBrand(id, req.body);
            res.json({ success: true, data: brand });
        } catch (error) {
            res.status(409).json({ message: 'Error updating brand', error: error.message });
        }
    }

    // Delete brand
    async remove(req, res) {
        try {
            const { id } = req.params;
            const brand = await brandService.deleteBrand(id);
            res.json({ success: true, data: brand });
        } catch (error) {
            res.status(404).json({ message: 'Error deleting brand', error: error.message });
        }
    }
}

module.exports = new BrandController();
