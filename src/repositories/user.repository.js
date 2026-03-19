const User = require('../models/User');
const IRepository = require('../interfaces/repository.interface');

/**
 * User Repository
 * (Single Responsibility - hanya akses database)
 * (Open/Closed - bisa di-extend tanpa modifikasi)
 */
class UserRepository extends IRepository {
    constructor() {
        super();
        this.model = User;
    }

    async findById(id) {
        return this.model.findById(id).select('-password');
    }

    async findOne(condition) {
        return this.model.findOne(condition);
    }

    async create(data) {
        return this.model.create(data);
    }

    async update(id, data) {
        return this.model.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        ).select('-password');
    }

    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

    // Method spesifik untuk user
    async findByEmail(email) {
        return this.model.findOne({ email: email.toLowerCase() });
    }

    async exists(email) {
        const count = await this.model.countDocuments({ email: email.toLowerCase() });
        return count > 0;
    }

    async getAllUsers() {
        try {
            return this.model.find().select('-password').sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error getting all users: ${error.message}`);
        }
    }
}

module.exports = UserRepository;