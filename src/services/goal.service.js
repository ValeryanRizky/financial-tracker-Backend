const GoalDTO = require('../dtos/goal.dto');

class GoalService {
    constructor(goalRepository, balanceRepository = null) {
        this.goalRepository = goalRepository;
        this.balanceRepository = balanceRepository; // Tambah balanceRepository
    }

    // Validasi category
    _validateCategory(category) {
        const validCategories = ['Tech', 'Travel', 'Finance', 'Education', 'Health', 'Property', 'Vehicle', 'Entertainment', 'Other'];
        return validCategories.includes(category);
    }

    // Validasi color
    _validateColor(color) {
        const validColors = ['from-blue-600 to-blue-400', 'from-rose-500 to-pink-500', 'from-emerald-500 to-teal-400', 'from-purple-600 to-violet-500', 'from-amber-500 to-orange-500', 'from-indigo-600 to-blue-500'];
        return validColors.includes(color);
    }

    // Create goal
    async createGoal(userId, goalData) {
        try {
            // Validasi required fields
            if (!goalData.title) {
                return {
                    success: false,
                    message: 'Title is required',
                    statusCode: 400
                };
            }

            if (!goalData.category) {
                return {
                    success: false,
                    message: 'Category is required',
                    statusCode: 400
                };
            }

            if (!this._validateCategory(goalData.category)) {
                return {
                    success: false,
                    message: 'Invalid category',
                    statusCode: 400
                };
            }

            if (!goalData.targetAmount || goalData.targetAmount <= 0) {
                return {
                    success: false,
                    message: 'Target amount must be greater than 0',
                    statusCode: 400
                };
            }

            if (!goalData.deadline) {
                return {
                    success: false,
                    message: 'Deadline is required',
                    statusCode: 400
                };
            }

            // Validasi deadline tidak boleh di masa lalu
            const deadline = new Date(goalData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (deadline < today) {
                return {
                    success: false,
                    message: 'Deadline cannot be in the past',
                    statusCode: 400
                };
            }

            // Validasi color jika ada
            if (goalData.color && !this._validateColor(goalData.color)) {
                return {
                    success: false,
                    message: 'Invalid color',
                    statusCode: 400
                };
            }

            // 🔥 CEK BALANCE jika ada currentAmount
            if (goalData.currentAmount && goalData.currentAmount > 0) {
                if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (!balance || balance.amount < goalData.currentAmount) {
                        return {
                            success: false,
                            message: 'Insufficient balance to allocate to goal',
                            statusCode: 400
                        };
                    }

                    // Kurangi balance
                    balance.amount -= goalData.currentAmount;
                    await balance.save();
                }
            }

            // Siapkan data
            const createData = GoalDTO.createRequest({
                ...goalData,
                userId,
                currentAmount: goalData.currentAmount || 0
            });

            // Simpan ke database
            const goal = await this.goalRepository.create(createData);

            return {
                success: true,
                data: GoalDTO.response(goal),
                statusCode: 201
            };
        } catch (error) {
            console.error('Create goal error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Get all goals by user
    async getUserGoals(userId, filters = {}) {
        try {
            const goals = await this.goalRepository.findByUserId(userId, filters);
            const stats = await this.goalRepository.getStats(userId);

            return {
                success: true,
                data: {
                    goals: goals.map(goal => GoalDTO.response(goal)),
                    stats
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get goals error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Get single goal
    async getGoalById(userId, goalId) {
        try {
            const goal = await this.goalRepository.findOne({
                _id: goalId,
                userId
            });

            if (!goal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: GoalDTO.response(goal),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get goal error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Update goal
    async updateGoal(userId, goalId, updateData) {
        try {
            const existingGoal = await this.goalRepository.findOne({
                _id: goalId,
                userId
            });

            if (!existingGoal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            // Validasi category jika ada
            if (updateData.category && !this._validateCategory(updateData.category)) {
                return {
                    success: false,
                    message: 'Invalid category',
                    statusCode: 400
                };
            }

            // Validasi target amount
            if (updateData.targetAmount && updateData.targetAmount <= 0) {
                return {
                    success: false,
                    message: 'Target amount must be greater than 0',
                    statusCode: 400
                };
            }

            // Validasi current amount tidak melebihi target
            if (updateData.currentAmount !== undefined) {
                const target = updateData.targetAmount || existingGoal.targetAmount;
                if (updateData.currentAmount > target) {
                    return {
                        success: false,
                        message: 'Current amount cannot exceed target amount',
                        statusCode: 400
                    };
                }
            }

            const sanitizedData = GoalDTO.updateRequest(updateData);
            const updatedGoal = await this.goalRepository.update(goalId, sanitizedData);

            return {
                success: true,
                data: GoalDTO.response(updatedGoal),
                statusCode: 200
            };
        } catch (error) {
            console.error('Update goal error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Delete goal
    async deleteGoal(userId, goalId) {
        try {
            const existingGoal = await this.goalRepository.findOne({
                _id: goalId,
                userId
            });

            if (!existingGoal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            // 🔥 KEMBALIKAN DANA KE BALANCE
            if (this.balanceRepository && existingGoal.currentAmount > 0) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    balance.amount += existingGoal.currentAmount;
                    await balance.save();
                }
            }

            await this.goalRepository.delete(goalId);

            return {
                success: true,
                message: 'Goal deleted successfully',
                statusCode: 200
            };
        } catch (error) {
            console.error('Delete goal error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Add contribution to goal
    async addContribution(userId, goalId, amount) {
        try {
            if (!amount || amount === 0) {
                return {
                    success: false,
                    message: 'Amount must be provided',
                    statusCode: 400
                };
            }

            const goal = await this.goalRepository.findOne({
                _id: goalId,
                userId
            });

            if (!goal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            // 🔥 CEK BALANCE UNTUK ADD (amount positif)
            if (amount > 0) {
                if (goal.currentAmount + amount > goal.targetAmount) {
                    return {
                        success: false,
                        message: 'Contribution would exceed target amount',
                        statusCode: 400
                    };
                }

                // Cek balance
                if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (!balance || balance.amount < amount) {
                        return {
                            success: false,
                            message: 'Insufficient balance',
                            statusCode: 400
                        };
                    }

                    // Kurangi balance
                    balance.amount -= amount;
                    await balance.save();
                }
            }
            // 🔥 UNTUK WITHDRAW (amount negatif)
            else {
                if (goal.currentAmount + amount < 0) { // amount negatif
                    return {
                        success: false,
                        message: 'Insufficient balance in goal',
                        statusCode: 400
                    };
                }

                // Kembalikan ke balance
                if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (balance) {
                        balance.amount += Math.abs(amount);
                        await balance.save();
                    }
                }
            }

            // Update goal
            goal.currentAmount += amount;
            goal.updateStatus();
            await goal.save();

            return {
                success: true,
                data: GoalDTO.response(goal),
                statusCode: 200
            };
        } catch (error) {
            console.error('Add contribution error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Get goal statistics
    async getGoalStats(userId) {
        try {
            const stats = await this.goalRepository.getStats(userId);

            return {
                success: true,
                data: stats,
                statusCode: 200
            };
        } catch (error) {
            console.error('Get goal stats error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Recalculate all goals impact on balance
    async recalculateGoalsBalance(userId) {
        try {
            const goals = await this.goalRepository.findByUserId(userId);
            const balance = await this.balanceRepository.findByUserId(userId);

            if (!balance) return { success: false, message: 'Balance not found', statusCode: 404 };

            // Hitung total di goals
            const totalInGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

            // Balance yang seharusnya (income - expense)
            // Tapi kita tidak punya data income/expense di sini
            // Jadi kita hanya bisa mengembalikan informasi

            return {
                success: true,
                data: {
                    totalInGoals,
                    currentBalance: balance.amount,
                    difference: balance.amount - totalInGoals,
                    message: totalInGoals > balance.amount
                        ? 'Warning: Goals exceed available balance'
                        : 'Goals are within balance'
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Recalculate goals balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }
}

module.exports = GoalService;