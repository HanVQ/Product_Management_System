const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    } // giá tại thời điểm đặt hàng
});

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    // orderDate: { will open when have handmade import
    //     type: Date,
    //     default: Date.now,
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Pending(vàng) → Đơn mới tạo, chưa được xác nhận.Admin hoặc nhân viên cần xem xét, duyệt hoặc liên hệ khách hàng.

// Confirmed(xanh lá) → Đơn đã được xác nhận, chuẩn bị xử lý.Đây là tín hiệu cho bộ phận kho / ship bắt đầu chuẩn bị hàng.

// Shipped(xanh dương) → Đơn đã được gửi đi.Bộ phận giao hàng đang xử lý.

// Delivered(xanh đậm) → Đơn đã giao thành công cho khách.Đây là trạng thái hoàn tất.

// Cancelled(đỏ) → Đơn bị hủy.Có thể do khách đổi ý, hết hàng, hoặc lỗi thanh toán.Stock sẽ được khôi phục.

module.exports = mongoose.model('Order', orderSchema);