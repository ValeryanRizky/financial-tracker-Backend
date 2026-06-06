const Goal = require('../models/Goal');
const IRepository = require('../interfaces/repository.interface');

class GoalRepository extends IRepository {
    constructor() {
        super();
        this.model = Goal;
    }

    async findById(id) {
        try {
            return this.model.findById(id);
        } catch (error) {
            throw new Error(`Error finding goal: ${error.message}`);
        }
    }

    async findOne(condition) {
        try {
            return this.model.findOne(condition);
        } catch (error) {
            throw new Error(`Error finding goal: ${error.message}`);
        }
    }

    async create(data) {
        try {
            return this.model.create(data);
        } catch (error) {
            throw new Error(`Error creating goal: ${error.message}`);
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
            throw new Error(`Error updating goal: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            return this.model.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting goal: ${error.message}`);
        }
    }

    async findByUserId(userId, filters = {}) {
        try {
            const query = { userId };

            if (filters.category) {
                query.category = filters.category;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            const goals = await this.model.find(query)
                .sort({ createdAt: -1 });

            return goals;
        } catch (error) {
            throw new Error(`Error finding goals: ${error.message}`);
        }
    }

    async getStats(userId) {
        try {
            const goals = await this.model.find({ userId });

            const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
            const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
            const completedGoals = goals.filter(g => g.status === 'completed').length;

            return {
                totalGoals: goals.length,
                totalTarget,
                totalCurrent,
                completedGoals,
                overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
            };
        } catch (error) {
            throw new Error(`Error getting goal stats: ${error.message}`);
        }
    }
}

module.exports = GoalRepository;