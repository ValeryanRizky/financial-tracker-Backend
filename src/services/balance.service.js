const BalanceDTO = require('../dtos/balance.dto');

class BalanceService {
    constructor(balanceRepository, goalRepository = null, incomeRepository = null, expenseRepository = null) {
        this.balanceRepository = balanceRepository;
        this.goalRepository = goalRepository;
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
    }

    // Get balance by user ID
    async getBalance(userId) {
        try {
            const balance = await this.balanceRepository.findByUserId(userId);

            return {
                success: true,
                data: balance ? BalanceDTO.response(balance) : { amount: 0, userId },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Update balance
    async updateBalance(userId, amount) {
        try {
            if (amount === undefined || amount < 0) {
                return {
                    success: false,
                    message: 'Amount must be a valid number and >= 0',
                    statusCode: 400
                };
            }

            const balance = await this.balanceRepository.updateByUserId(userId, amount);

            return {
                success: true,
                data: BalanceDTO.response(balance),
                statusCode: 200
            };
        } catch (error) {
            console.error('Update balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // Get summary (balance + goals)
    async getSummary(userId) {
        try {
            const [balance, goals] = await Promise.all([
                this.balanceRepository.findByUserId(userId),
                this.goalRepository ? this.goalRepository.findByUserId(userId) : []
            ]);

            const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
            const remainingBalance = balance ? balance.amount - totalSaved : -totalSaved;

            return {
                success: true,
                data: {
                    balance: balance?.amount || 0,
                    totalSaved,
                    remainingBalance,
                    goalsCount: goals.length
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get summary error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Recalculate balance dari income - expense
    async recalculateBalance(userId) {
        try {
            if (!this.incomeRepository || !this.expenseRepository) {
                return {
                    success: false,
                    message: 'Income and Expense repositories are required',
                    statusCode: 400
                };
            }

            // Ambil semua income dan expense
            const [incomes, expenses] = await Promise.all([
                this.incomeRepository.findByUserId(userId),
                this.expenseRepository.findByUserId(userId)
            ]);

            // Hitung total income
            const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

            // Hitung total expense
            const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Balance dari income - expense
            const calculatedBalance = totalIncome - totalExpense;

            // Update balance di database
            const balance = await this.balanceRepository.updateByUserId(userId, calculatedBalance);

            // Ambil goals untuk informasi tambahan
            const goals = this.goalRepository ? await this.goalRepository.findByUserId(userId) : [];
            const totalInGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

            return {
                success: true,
                data: {
                    balance: balance.amount,
                    totalIncome,
                    totalExpense,
                    calculatedBalance,
                    totalInGoals,
                    difference: balance.amount - totalInGoals,
                    status: totalInGoals > balance.amount
                        ? 'WARNING: Goals exceed available balance'
                        : 'Healthy'
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Recalculate balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Tambah balance (untuk income)
    async addToBalance(userId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            const balance = await this.balanceRepository.findByUserId(userId);
            const newAmount = (balance?.amount || 0) + amount;

            const updatedBalance = await this.balanceRepository.updateByUserId(userId, newAmount);

            return {
                success: true,
                data: BalanceDTO.response(updatedBalance),
                statusCode: 200
            };
        } catch (error) {
            console.error('Add to balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Kurangi balance (untuk expense)
    async subtractFromBalance(userId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            const balance = await this.balanceRepository.findByUserId(userId);
            const currentAmount = balance?.amount || 0;

            if (currentAmount < amount) {
                return {
                    success: false,
                    message: 'Insufficient balance',
                    statusCode: 400
                };
            }

            const newAmount = currentAmount - amount;
            const updatedBalance = await this.balanceRepository.updateByUserId(userId, newAmount);

            return {
                success: true,
                data: BalanceDTO.response(updatedBalance),
                statusCode: 200
            };
        } catch (error) {
            console.error('Subtract from balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Reset balance ke 0
    async resetBalance(userId) {
        try {
            const balance = await this.balanceRepository.updateByUserId(userId, 0);

            return {
                success: true,
                data: BalanceDTO.response(balance),
                message: 'Balance reset to 0',
                statusCode: 200
            };
        } catch (error) {
            console.error('Reset balance error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // 🔥 METHOD BARU: Transfer dari balance ke goal (manual)
    async transferToGoal(userId, goalId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            if (!this.goalRepository) {
                return {
                    success: false,
                    message: 'Goal repository not available',
                    statusCode: 400
                };
            }

            // Cek balance
            const balance = await this.balanceRepository.findByUserId(userId);
            if (!balance || balance.amount < amount) {
                return {
                    success: false,
                    message: 'Insufficient balance',
                    statusCode: 400
                };
            }

            // Cek goal
            const goal = await this.goalRepository.findOne({ _id: goalId, userId });
            if (!goal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            // Cek apakah tidak melebihi target
            if (goal.currentAmount + amount > goal.targetAmount) {
                return {
                    success: false,
                    message: 'Transfer would exceed goal target',
                    statusCode: 400
                };
            }

            // Update balance (kurangi)
            balance.amount -= amount;
            await balance.save();

            // Update goal (tambah)
            goal.currentAmount += amount;
            goal.updateStatus();
            await goal.save();

            return {
                success: true,
                data: {
                    balance: balance.amount,
                    goal: GoalDTO.response(goal),
                    transferred: amount
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Transfer to goal error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }
}

module.exports = BalanceService;