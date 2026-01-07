const Size = require('../models/Size');

class SizeController {
    async listSize(req, res) {
        try {
            const sizes = await Size.find().sort({ name: 1 });
            res.json({ success: true, sizes });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async createSize(req, res) {
        try {
            let { name } = req.body;
            if (!name) return res.status(400).json({ success: false, message: 'Name required' });
            
            // Normalize: trim and capitalize first letter for consistency
            name = name.trim();
            const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            // Check for duplicates (case-insensitive)
            const existing = await Size.findOne({ name: { $regex: `^${normalized}$`, $options: 'i' } });
            if (existing) {
                return res.status(400).json({ success: false, message: `Size "${existing.name}" already exists` });
            }
            
            const s = new Size({ name: normalized });
            await s.save();
            res.status(201).json({ success: true, size: s });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }

    async deleteSize(req, res) {
        try {
            const { id } = req.params;
            const s = await Size.findByIdAndDelete(id);
            if (!s) return res.status(404).json({ success: false, message: 'Size not found' });
            res.json({ success: true, message: 'Size deleted' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
}

module.exports = new SizeController();
