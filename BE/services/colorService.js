const Color = require('../models/Color');

class ColorService {
    async listColors() {
        try {
            return await Color.find().sort({ name: 1 });
        } catch (error) {
            throw new Error(`Error listing colors: ${error.message}`);
        }
    }

    async createColor(name, hex) {
        try {
            if (!name) {
                throw new Error('Name required');
            }
            if (!hex) {
                throw new Error('Hex color required');
            }

            // Normalize: trim and capitalize first letter for consistency
            let normalized = name.trim();
            normalized = normalized.toUpperCase();
            
            // Check for duplicates (case-insensitive)
            const checkDuplicate = await Color.findOne({ name: { $regex: `^${normalized}$`, $options: 'i' } });
            if (checkDuplicate) {
                throw new Error(`Color "${checkDuplicate.name}" already exists`);
            }

            const color = new Color({ name: normalized, hex: hex.toUpperCase() });
            await color.save();
            return color;
        } catch (error) {
            throw new Error(`Error creating color: ${error.message}`);
        }
    }

    async updateColor(id, name, hex) {
        try {
            if (!name) {
                throw new Error('Name required');
            }
            if (!hex) {
                throw new Error('Hex color required');
            }
            // Normalize: trim and capitalize first letter for consistency
            let normalized = name.trim();
            normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
            const color = await Color.findById(id);
            if (!color) {
                throw new Error('Color not found');
            }
            color.name = normalized;
            color.hex = hex.toUpperCase();
            await color.save();
            return color;
        } catch (error) {
            throw new Error(`Error updating color: ${error.message}`);
        }   
    }

    async deleteColor(id) {
        try {
            const color = await Color.findByIdAndDelete(id);
            if (!color) {
                throw new Error('Color not found');
            }
            return color;
        } catch (error) {
            throw new Error(`Error deleting color: ${error.message}`);
        }
    }
}

module.exports = new ColorService();
