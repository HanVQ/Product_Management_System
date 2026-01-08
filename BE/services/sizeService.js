const Size = require('../models/Size');

class SizeService {
    async listSizes() {
        try {
            return await Size.find().sort({ name: 1 });
        } catch (error) {
            throw new Error(`Error listing sizes: ${error.message}`);
        }
    }

    async createSize(name) {
        try {
            if (!name) {
                throw new Error('Name required');
            }

            // Normalize: trim and capitalize first letter for consistency
            let normalized = name.trim();
            normalized = normalized.toUpperCase();

            // Check for duplicates (case-insensitive)
            const checkDuplicate = await Size.findOne({ name: { $regex: `^${normalized}$`, $options: 'i' } });
            if (checkDuplicate) {
                throw new Error(`Size "${checkDuplicate.name}" already exists`);
            }

            const size = new Size({ name: normalized });
            await size.save();
            return size;
        } catch (error) {
            throw new Error(`Error creating size: ${error.message}`);
        }
    }

    async updateSize(id, name) {
        try {
            if (!name) {
                throw new Error('Name required');
            }
            // Normalize: trim and capitalize first letter for consistency
            let normalized = name.trim();
            normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
            const size = await Size.findById(id);
            if (!size) {
                throw new Error('Size not found');
            }
            size.name = normalized;
            await size.save();
            return size;
        } catch (error) {
            throw new Error(`Error updating size: ${error.message}`);
        }   
    }

    async deleteSize(id) {
        try {
            const size = await Size.findByIdAndDelete(id);
            if (!size) {
                throw new Error('Size not found');
            }
            return size;
        } catch (error) {
            throw new Error(`Error deleting size: ${error.message}`);
        }
    }
}

module.exports = new SizeService();