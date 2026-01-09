const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    description: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('ProductType', productTypeSchema);
