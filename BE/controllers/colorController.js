const Color = require('../models/Color');

class ColorController {
    async listColor(req, res) {
        try {
            const colors = await Color.find().sort({ name: 1 });
            res.json({ success: true, colors });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createColor(req, res) {
        try {
            let { name } = req.body;
            if (!name) return res.status(400).json({ success: false, message: 'Name required' });
            
            // Normalize: trim and capitalize first letter for consistency
            name = name.trim();
            const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            // Check for duplicates (case-insensitive)
            const existing = await Color.findOne({ name: { $regex: `^${normalized}$`, $options: 'i' } });
            if (existing) {
                return res.status(400).json({ success: false, message: `Color "${existing.name}" already exists` });
            }
            
            const c = new Color({ name: normalized });
            await c.save();
            res.status(201).json({ success: true, color: c });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteColor(req, res) {
        try {
            const { id } = req.params;
            const c = await Color.findByIdAndDelete(id);
            if (!c) return res.status(404).json({ success: false, message: 'Color not found' });
            res.json({ success: true, message: 'Color deleted' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ColorController();
