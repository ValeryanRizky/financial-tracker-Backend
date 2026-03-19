const Balance = require('../models/Balance');
const IRepository = require('../interfaces/repository.interface');

class BalanceRepository extends IRepository {
    constructor() {
        super();
        this.model = Balance;
    }

    async findById(id) {
        return this.model.findById(id);
    }

    async findOne(condition) {
        return this.model.findOne(condition);
    }

    async create(data) {
        return this.model.create(data);
    }

    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return this.model.findByIdAndDelete(id);
    }

    // 🔥 METHOD PENTING UNTUK BALANCE
    async findByUserId(userId) {
        try {
            return this.model.findOne({ userId });
        } catch (error) {
            throw new Error(`Error finding balance by user: ${error.message}`);
        }
    }

    // 🔥 METHOD UNTUK UPDATE ATAU CREATE BALANCE
    async updateByUserId(userId, amount) {
        try {
            return this.model.findOneAndUpdate(
                { userId },
                { amount },
                { new: true, upsert: true, runValidators: true }
            );
        } catch (error) {
            throw new Error(`Error updating balance: ${error.message}`);
        }
    }
}

module.exports = BalanceRepository;