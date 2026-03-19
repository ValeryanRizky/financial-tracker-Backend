const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'Bank Transfer', 'E-Wallet', 'Credit Card', 'Debit Card', 'Other'] // <-- SESUAIKAN
    },
    category: {
        type: String,
        required: true,
        enum: ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'] // <-- SESUAIKAN
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret) => {
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('Expense', expenseSchema);