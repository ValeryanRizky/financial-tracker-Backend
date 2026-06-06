const GoalDTO = require('../dtos/goal.dto');

class GoalService {
    constructor(goalRepository, balanceRepository = null, walletRepository = null) {
        this.goalRepository = goalRepository;
        this.balanceRepository = balanceRepository;
        this.walletRepository = walletRepository; // <-- TAMBAHKAN walletRepository
    }

    _validateCategory(category) {
        const validCategories = ['Tech', 'Travel', 'Finance', 'Education', 'Health', 'Property', 'Vehicle', 'Entertainment', 'Other'];
        return validCategories.includes(category);
    }

    _validateColor(color) {
        const validColors = [
            'bg-blue-600',
            'bg-rose-500',
            'bg-emerald-500',
            'bg-purple-600',
            'bg-amber-500',
            'bg-indigo-600'
        ];
        return validColors.includes(color);
    }

    async getTotalWalletBalance(userId) {
        if (!this.walletRepository) return 0;
        const wallets = await this.walletRepository.findByUserId(userId);
        return wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    }

    async updateWalletBalance(userId, walletId, newBalance) {
        if (!this.walletRepository) return null;
        return await this.walletRepository.updateBalance(walletId, newBalance);
    }

    async createGoal(userId, goalData) {
        try {
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

            if (goalData.color && !this._validateColor(goalData.color)) {
                return {
                    success: false,
                    message: 'Invalid color',
                    statusCode: 400
                };
            }

            if (goalData.currentAmount && goalData.currentAmount > 0) {
                if (this.walletRepository) {
                    const totalBalance = await this.getTotalWalletBalance(userId);
                    if (totalBalance < goalData.currentAmount) {
                        return {
                            success: false,
                            message: `Insufficient balance. Available: ${this._formatIDR(totalBalance)}`,
                            statusCode: 400
                        };
                    }

                    const wallets = await this.walletRepository.findByUserId(userId);
                    const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                    const newBalance = cashWallet.balance - goalData.currentAmount;
                    await this.updateWalletBalance(userId, cashWallet.id, newBalance);
                } else if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (!balance || balance.amount < goalData.currentAmount) {
                        return {
                            success: false,
                            message: 'Insufficient balance',
                            statusCode: 400
                        };
                    }
                    balance.amount -= goalData.currentAmount;
                    await balance.save();
                }
            }

            const createData = GoalDTO.createRequest({
                ...goalData,
                userId,
                currentAmount: goalData.currentAmount || 0
            });

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

            if (updateData.category && !this._validateCategory(updateData.category)) {
                return {
                    success: false,
                    message: 'Invalid category',
                    statusCode: 400
                };
            }

            if (updateData.targetAmount && updateData.targetAmount <= 0) {
                return {
                    success: false,
                    message: 'Target amount must be greater than 0',
                    statusCode: 400
                };
            }

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

            if (existingGoal.currentAmount > 0) {
                if (this.walletRepository) {
                    const wallets = await this.walletRepository.findByUserId(userId);
                    const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                    const newBalance = (cashWallet.balance || 0) + existingGoal.currentAmount;
                    await this.updateWalletBalance(userId, cashWallet.id, newBalance);
                } else if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (balance) {
                        balance.amount += existingGoal.currentAmount;
                        await balance.save();
                    }
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


    async addContribution(userId, goalId, amount) {
        try {
            console.log(`📝 addContribution called: goalId=${goalId}, amount=${amount}`);

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

            console.log(`📊 Current goal: currentAmount=${goal.currentAmount}, targetAmount=${goal.targetAmount}`);

            if (amount > 0) {
                // Cek tidak melebihi target
                if (goal.currentAmount + amount > goal.targetAmount) {
                    return {
                        success: false,
                        message: `Contribution would exceed target amount. Remaining: ${this._formatIDR(goal.targetAmount - goal.currentAmount)}`,
                        statusCode: 400
                    };
                }

                if (this.walletRepository) {
                    const wallets = await this.walletRepository.findByUserId(userId);
                    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

                    console.log(`💰 Total wallet balance: ${totalBalance}, need: ${amount}`);

                    if (totalBalance < amount) {
                        return {
                            success: false,
                            message: `Saldo tidak cukup. Saldo tersedia: ${this._formatIDR(totalBalance)}, Dibutuhkan: ${this._formatIDR(amount)}`,
                            statusCode: 400
                        };
                    }

                    const sortedWallets = [...wallets].sort((a, b) => b.balance - a.balance);
                    let remainingAmount = amount;

                    for (const wallet of sortedWallets) {
                        if (remainingAmount <= 0) break;

                        const deductAmount = Math.min(wallet.balance, remainingAmount);
                        const newBalance = wallet.balance - deductAmount;

                        console.log(`💰 Deducting ${deductAmount} from wallet ${wallet.name}: ${wallet.balance} → ${newBalance}`);
                        await this.walletRepository.updateBalance(wallet.id, newBalance);

                        remainingAmount -= deductAmount;
                    }

                    if (remainingAmount > 0) {
                        return {
                            success: false,
                            message: `Gagal mengambil dana dari wallet. Sisa yang belum terpenuhi: ${this._formatIDR(remainingAmount)}`,
                            statusCode: 400
                        };
                    }
                } else if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (!balance || balance.amount < amount) {
                        return {
                            success: false,
                            message: `Saldo tidak cukup. Saldo: ${this._formatIDR(balance?.amount || 0)}`,
                            statusCode: 400
                        };
                    }
                    balance.amount -= amount;
                    await balance.save();
                }
            }
            else {
                const withdrawAmount = Math.abs(amount);
                if (goal.currentAmount - withdrawAmount < 0) {
                    return {
                        success: false,
                        message: `Saldo goal tidak mencukupi. Saldo saat ini: ${this._formatIDR(goal.currentAmount)}`,
                        statusCode: 400
                    };
                }

                if (this.walletRepository) {
                    const wallets = await this.walletRepository.findByUserId(userId);
                    const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                    const newBalance = (cashWallet.balance || 0) + withdrawAmount;
                    console.log(`💰 Returning to wallet ${cashWallet.name}: ${cashWallet.balance} → ${newBalance}`);
                    await this.walletRepository.updateBalance(cashWallet.id, newBalance);
                } else if (this.balanceRepository) {
                    const balance = await this.balanceRepository.findByUserId(userId);
                    if (balance) {
                        balance.amount += withdrawAmount;
                        await balance.save();
                    }
                }
            }

            goal.currentAmount += amount;
            goal.updateStatus();
            await goal.save();

            console.log(`✅ Goal updated: new currentAmount=${goal.currentAmount}`);

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

    _formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
    _formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

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

    async recalculateGoalsBalance(userId) {
        try {
            const goals = await this.goalRepository.findByUserId(userId);

            let totalInGoals = 0;
            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
                totalInGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

                return {
                    success: true,
                    data: {
                        totalInGoals,
                        currentBalance: totalBalance,
                        difference: totalBalance - totalInGoals,
                        message: totalInGoals > totalBalance
                            ? 'Warning: Goals exceed available balance'
                            : 'Goals are within balance'
                    },
                    statusCode: 200
                };
            }

            return {
                success: true,
                data: {
                    totalInGoals: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
                    message: 'Balance info not available'
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