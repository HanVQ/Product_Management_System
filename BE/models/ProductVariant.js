const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: false,
        default: null,
    },
    color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
        required: false,
        default: null,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
        validate: Number.isInteger
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        default: () => `PV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// One product can have many variants, but only ONE variant per size+color combination
productVariantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
