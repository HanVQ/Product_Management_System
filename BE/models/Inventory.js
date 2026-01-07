const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
    },
    // Optional variant reference (when product has size/color variants)
    variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: false,
    },
    type: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    reason: {
        type: String,
        trim: true,
    },
    transactionDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
