const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    amount: {
        type: Number,
        default: 0,
        min: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
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

module.exports = mongoose.model('Balance', balanceSchema);