const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['topup', 'withdraw', 'transfer', 'payment', 'adjustment']
    },
    amount: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    fromWallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    toWallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    description: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
        trim: true
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

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);