const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    hex: {
        type: String,
        required: true,
        uppercase: true,
        match: /^#([0-9A-F]{6}|[0-9A-F]{3})$/,
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Color', colorSchema);
