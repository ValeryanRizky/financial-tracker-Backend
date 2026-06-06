const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
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
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: false
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

incomeSchema.index({ userId: 1, date: -1 });
incomeSchema.index({ userId: 1, walletId: 1 });
incomeSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Income', incomeSchema);