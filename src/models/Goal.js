const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Tech', 'Travel', 'Finance', 'Education', 'Health', 'Other']
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    color: {
        type: String,
        enum: ['bg-blue-600', 'bg-rose-500', 'bg-emerald-500', 'bg-purple-600', 'bg-amber-500', 'bg-indigo-600'],
        default: 'bg-blue-600'
    },
    icon: {
        type: String,
        default: '🎯'
    },
    status: {
        type: String,
        enum: ['on-track', 'almost-there', 'completed', 'behind'],
        default: 'on-track'
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

// Virtual untuk progress percentage
goalSchema.virtual('progress').get(function () {
    return (this.currentAmount / this.targetAmount) * 100;
});

// Virtual untuk remaining amount
goalSchema.virtual('remaining').get(function () {
    return this.targetAmount - this.currentAmount;
});

// Method untuk update status berdasarkan progress
goalSchema.methods.updateStatus = function () {
    const progress = this.currentAmount / this.targetAmount * 100;
    if (progress >= 100) {
        this.status = 'completed';
    } else if (progress >= 80) {
        this.status = 'almost-there';
    } else if (progress >= 30) {
        this.status = 'on-track';
    } else {
        this.status = 'behind';
    }
    return this.status;
};

module.exports = mongoose.model('Goal', goalSchema);