const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
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
