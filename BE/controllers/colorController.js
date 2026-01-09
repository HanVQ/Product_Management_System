const colorService = require('../services/colorService');

class ColorController {
    async getListColor(req, res) {
        try {
            const colors = await colorService.getListColors();
            res.json({ success: true, colors });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createColor(req, res) {
        try {
            const { name, hex } = req.body;
            const color = await colorService.createColor(name, hex);
            res.status(201).json({ success: true, color });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async updateColor(req, res) {
        try {
            const { id } = req.params;
            const { name, hex } = req.body;
            const color = await colorService.updateColor(id, name, hex);
            res.json({ success: true, color });
        }
        catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteColor(req, res) {
        try {
            const { id } = req.params;
            await colorService.deleteColor(id);
            res.json({ success: true, message: 'Color deleted' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
    async toggleColorStatus(req, res) {
        try {
            const { id } = req.params;
            const color = await colorService.toggleColorStatus(id);
            res.json({ success: true, color });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }}

module.exports = new ColorController();
