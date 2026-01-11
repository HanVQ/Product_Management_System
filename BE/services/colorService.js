const Color = require('../models/Color');

class ColorService {
    async getListColors() {
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
            let normalizedName = name.trim();
            normalizedName = normalizedName.toUpperCase();
            
            // Check for duplicates (case-insensitive)
            const checkDuplicate = await Color.findOne({ name: { $regex: `^${normalizedName}$`, $options: 'i' } });
            if (checkDuplicate) {
                throw new Error(`Color "${checkDuplicate.name}" already exists`);
            }

            const color = new Color({ name: normalizedName, hex: hex.toUpperCase() });
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
            let normalizedName = name.trim();
            normalizedName = normalizedName.toUpperCase();
            const color = await Color.findById(id);
            if (!color) {
                throw new Error('Color not found');
            }
            color.name = normalizedName;
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

    async toggleColorStatus(id) {
        try {
            const color = await Color.findById(id);
            if (!color) {
                throw new Error('Color not found');
            }
            color.status = color.status === 'Active' ? 'Inactive' : 'Active';
            await color.save();
            return color;
        } catch (error) {
            throw new Error(`Error toggling color status: ${error.message}`);
        }
    }
}

module.exports = new ColorService();
