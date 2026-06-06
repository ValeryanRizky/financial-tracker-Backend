const Expense = require('../models/Expense');
const IRepository = require('../interfaces/repository.interface');

class ExpenseRepository extends IRepository {
    constructor() {
        super();
        this.model = Expense;
    }

    async findById(id) {
        try {
            return this.model.findById(id);
        } catch (error) {
            throw new Error(`Error finding expense: ${error.message}`);
        }
    }

    async findOne(condition) {
        try {
            return this.model.findOne(condition);
        } catch (error) {
            throw new Error(`Error finding expense: ${error.message}`);
        }
    }

    async create(data) {
        try {
            return this.model.create(data);
        } catch (error) {
            throw new Error(`Error creating expense: ${error.message}`);
        }
    }

    async update(id, data) {
        try {
            return this.model.findByIdAndUpdate(
                id,
                data,
                { returnDocument: 'after', runValidators: true }  
            );
        } catch (error) {
            throw new Error(`Error updating expense: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            return this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting expense: ${error.message}`);
        }
    }

    async findByUserId(userId, filters = {}) {
        try {
            const query = { userId };

            // Filter by category
            if (filters.category) {
                query.category = filters.category;
            }

            if (filters.paymentMethod) {
                query.paymentMethod = filters.paymentMethod;
            }

            if (filters.startDate || filters.endDate) {
                query.date = {};
                if (filters.startDate) {
                    query.date.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.date.$lte = new Date(filters.endDate);
                }
            }

            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const skip = (page - 1) * limit;

            const [expenses, total] = await Promise.all([
                this.model.find(query)
                    .sort({ date: -1 })
                    .skip(skip)
                    .limit(limit),
                this.model.countDocuments(query)
            ]);

            return {
                expenses,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Error finding expenses: ${error.message}`);
        }
    }

    async getTotalByUserId(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.category) {
                query.category = filters.category;
            }

            if (filters.startDate || filters.endDate) {
                query.date = {};
                if (filters.startDate) query.date.$gte = new Date(filters.startDate);
                if (filters.endDate) query.date.$lte = new Date(filters.endDate);
            }

            const result = await this.model.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            return result.length > 0 ? result[0].total : 0;
        } catch (error) {
            throw new Error(`Error calculating total: ${error.message}`);
        }
    }

    async getCategorySummary(userId, startDate, endDate) {
        try {
            const query = { userId };

            if (startDate || endDate) {
                query.date = {};
                if (startDate) query.date.$gte = new Date(startDate);
                if (endDate) query.date.$lte = new Date(endDate);
            }

            const result = await this.model.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { total: -1 } }
            ]);

            return result;
        } catch (error) {
            throw new Error(`Error getting category summary: ${error.message}`);
        }
    }

    // Get monthly summary
    async getMonthlySummary(userId, year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const result = await this.model.aggregate([
                {
                    $match: {
                        userId,
                        date: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        average: { $avg: '$amount' }
                    }
                }
            ]);

            return result.length > 0 ? result[0] : { total: 0, count: 0, average: 0 };
        } catch (error) {
            throw new Error(`Error getting monthly summary: ${error.message}`);
        }
    }
}

module.exports = ExpenseRepository;