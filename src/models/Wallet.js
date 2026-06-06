const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['cash', 'bank', 'ewallet', 'credit', 'debit', 'qris', 'transfer'],
        default: 'cash'
    },
    category: {
        type: String,
        enum: ['payment', 'digital', 'credit', 'savings'],
        default: 'payment'
    },
    balance: {
        type: Number,
        default: 0,
        min: 0  // <-- INI YANG MENYEBABKAN ERROR
    },
    institution: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: 'bg-blue-500'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});


module.exports = mongoose.model('Wallet', walletSchema);