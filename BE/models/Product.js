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
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field: stockStatus
// - 'out of stock' when stock === 0
// - 'low stock' when 0 < stock <= LOW_STOCK_THRESHOLD
// - 'in stock' when stock > LOW_STOCK_THRESHOLD

const LOW_STOCK_THRESHOLD = 10; // replace
productSchema.virtual('stockStatus').get(function () {
    const s = typeof this.stock === 'number' ? this.stock : 0;
    if (s === 0) return 'out of stock';
    if (s <= LOW_STOCK_THRESHOLD) return 'low stock';
    return 'in stock';
});

module.exports = mongoose.model('Product', productSchema);