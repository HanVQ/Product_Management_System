const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        enum: ['VND'],
        default: 'VND'
    },
    // stock is now derived from variants - keeping field for backward compatibility but deprecated
    stock: {
        type: Number,
        default: 0,
        min: 0,
        validate: Number.isInteger
    },
    productType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductType',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    sku: {
        type: String,
        unique: true,
        default: () => `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field: totalStock - sum of all variant stocks
// This is populated by the service layer when variants are loaded
productSchema.virtual('totalStock').get(function () {
    if (!this.variants || this.variants.length === 0) return 0;
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
});

// Virtual field: stockStatus (based on totalStock if variants exist, otherwise product.stock)
const LOW_STOCK_THRESHOLD = 10;
productSchema.virtual('stockStatus').get(function () {
    const s = this.totalStock || (typeof this.stock === 'number' ? this.stock : 0);
    if (s === 0) return 'out of stock';
    if (s <= LOW_STOCK_THRESHOLD) return 'low stock';
    return 'in stock';
});

module.exports = mongoose.model('Product', productSchema);