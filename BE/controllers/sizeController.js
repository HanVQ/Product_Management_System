const sizeService = require('../services/sizeService');

class SizeController {
    async getListSize(req, res) {
        try {
            const sizes = await sizeService.getListSizes();
            res.json({ success: true, sizes });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createSize(req, res) {
        try {
            const { name } = req.body;
            const size = await sizeService.createSize(name);
            res.status(201).json({ success: true, size });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async updateSize(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const size = await sizeService.updateSize(id, name);
            res.json({ success: true, size });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }       
    }

    async deleteSize(req, res) {
        try {
            const { id } = req.params;
            await sizeService.deleteSize(id);
            res.json({ success: true, message: 'Size deleted' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}

module.exports = new SizeController();
