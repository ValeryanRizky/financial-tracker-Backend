const BalanceDTO = require('../dtos/balance.dto');

class BalanceService {
    constructor(balanceRepository, goalRepository = null, incomeRepository = null, expenseRepository = null, walletRepository = null) {
        this.balanceRepository = balanceRepository;
        this.goalRepository = goalRepository;
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.walletRepository = walletRepository; // <-- TAMBAHKAN walletRepository
    }

    async getBalance(userId) {
        try {
            let totalBalance = 0;

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
                console.log('💰 Balance from wallets:', totalBalance);
            }

            if (totalBalance === 0 && this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                totalBalance = balance?.amount || 0;
                console.log('💰 Balance from fallback:', totalBalance);
            }

            return {
                success: true,
                data: { amount: totalBalance, userId },
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

    async updateBalance(userId, amount) {
        try {
            if (amount === undefined || amount < 0) {
                return {
                    success: false,
                    message: 'Amount must be a valid number and >= 0',
                    statusCode: 400
                };
            }

            let balance = null;
            if (this.balanceRepository) {
                balance = await this.balanceRepository.updateByUserId(userId, amount);
            }

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);

                if (wallets.length === 0) {
                    const cashWallet = await this.walletRepository.create({
                        name: 'Cash',
                        type: 'cash',
                        category: 'payment',
                        balance: amount,
                        isActive: true,
                        color: 'bg-slate-500',
                        userId: userId
                    });
                    console.log('✅ Default Cash wallet created with balance:', amount);
                } else {
                    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
                    const difference = amount - totalBalance;

                    if (difference !== 0) {
                        const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                        const newBalance = (cashWallet.balance || 0) + difference;
                        await this.walletRepository.updateBalance(cashWallet.id, newBalance);
                        console.log(`💰 Wallet ${cashWallet.name} updated: ${cashWallet.balance} → ${newBalance}`);
                    }
                }
            }

            return {
                success: true,
                data: balance ? BalanceDTO.response(balance) : { amount, userId },
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

    async getSummary(userId) {
        try {
            let totalBalance = 0;

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
                console.log('💰 Summary - Balance from wallets:', totalBalance);
            } else if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                totalBalance = balance?.amount || 0;
            }

            let goals = [];
            let totalSaved = 0;

            if (this.goalRepository) {
                goals = await this.goalRepository.findByUserId(userId);
                totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
            }

            const remainingBalance = totalBalance - totalSaved;

            return {
                success: true,
                data: {
                    balance: totalBalance,
                    totalSaved,
                    remainingBalance,
                    goalsCount: goals.length,
                    walletsCount: wallets?.length || 0
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

    async recalculateBalance(userId) {
        try {
            let totalBalance = 0;

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
                console.log('💰 Recalculated balance from wallets:', totalBalance);
            }

            if (totalBalance === 0 && this.incomeRepository && this.expenseRepository) {
                const [incomes, expenses] = await Promise.all([
                    this.incomeRepository.findByUserId(userId),
                    this.expenseRepository.findByUserId(userId)
                ]);

                const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
                const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                totalBalance = totalIncome - totalExpense;
                console.log('💰 Recalculated balance from income/expense:', totalBalance);
            }

            let totalInGoals = 0;
            if (this.goalRepository) {
                const goals = await this.goalRepository.findByUserId(userId);
                totalInGoals = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
            }

            return {
                success: true,
                data: {
                    balance: totalBalance,
                    totalInGoals,
                    difference: totalBalance - totalInGoals,
                    status: totalInGoals > totalBalance
                        ? 'WARNING: Goals exceed available balance'
                        : 'Healthy',
                    timestamp: new Date().toISOString()
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

    async addToBalance(userId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            let updatedBalance = null;

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);

                if (wallets.length === 0) {
                    const newWallet = await this.walletRepository.create({
                        name: 'Cash',
                        type: 'cash',
                        category: 'payment',
                        balance: amount,
                        isActive: true,
                        color: 'bg-slate-500',
                        userId: userId
                    });
                    updatedBalance = { amount: newWallet.balance };
                    console.log(`✅ Created new wallet with balance: ${amount}`);
                } else {
                    const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                    const newAmount = (cashWallet.balance || 0) + amount;
                    await this.walletRepository.updateBalance(cashWallet.id, newAmount);
                    updatedBalance = { amount: newAmount };
                    console.log(`💰 Added ${amount} to ${cashWallet.name}, new balance: ${newAmount}`);
                }
            }

            if (this.balanceRepository) {
                const currentBalance = await this.balanceRepository.findByUserId(userId);
                const newAmount = (currentBalance?.amount || 0) + amount;
                updatedBalance = await this.balanceRepository.updateByUserId(userId, newAmount);
            }

            return {
                success: true,
                data: updatedBalance,
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

    async subtractFromBalance(userId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            let updatedBalance = null;

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

                if (totalBalance < amount) {
                    return {
                        success: false,
                        message: 'Insufficient balance',
                        statusCode: 400
                    };
                }

                const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                const newAmount = Math.max(0, (cashWallet.balance || 0) - amount);
                await this.walletRepository.updateBalance(cashWallet.id, newAmount);
                updatedBalance = { amount: newAmount };
                console.log(`💰 Subtracted ${amount} from ${cashWallet.name}, new balance: ${newAmount}`);
            }

            if (this.balanceRepository) {
                const currentBalance = await this.balanceRepository.findByUserId(userId);
                if (currentBalance && currentBalance.amount < amount) {
                    return {
                        success: false,
                        message: 'Insufficient balance',
                        statusCode: 400
                    };
                }
                const newAmount = (currentBalance?.amount || 0) - amount;
                updatedBalance = await this.balanceRepository.updateByUserId(userId, newAmount);
            }

            return {
                success: true,
                data: updatedBalance,
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

    async resetBalance(userId) {
        try {
            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                for (const wallet of wallets) {
                    await this.walletRepository.updateBalance(wallet.id, 0);
                }
                console.log(`💰 Reset all wallets for user ${userId}`);
            }

            let balance = null;
            if (this.balanceRepository) {
                balance = await this.balanceRepository.updateByUserId(userId, 0);
            }

            return {
                success: true,
                data: balance ? BalanceDTO.response(balance) : { amount: 0, userId },
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

            let currentBalance = 0;
            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                currentBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
            } else if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                currentBalance = balance?.amount || 0;
            }

            if (currentBalance < amount) {
                return {
                    success: false,
                    message: 'Insufficient balance',
                    statusCode: 400
                };
            }

            const goal = await this.goalRepository.findOne({ _id: goalId, userId });
            if (!goal) {
                return {
                    success: false,
                    message: 'Goal not found',
                    statusCode: 404
                };
            }

            if (goal.currentAmount + amount > goal.targetAmount) {
                return {
                    success: false,
                    message: 'Transfer would exceed goal target',
                    statusCode: 400
                };
            }

            if (this.walletRepository) {
                const wallets = await this.walletRepository.findByUserId(userId);
                const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                const newWalletBalance = (cashWallet.balance || 0) - amount;
                await this.walletRepository.updateBalance(cashWallet.id, newWalletBalance);
            }

            if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newBalanceAmount = balance.amount - amount;
                    await this.balanceRepository.updateByUserId(userId, newBalanceAmount);
                }
            }

            goal.currentAmount += amount;
            if (goal.updateStatus) goal.updateStatus();
            await goal.save();

            return {
                success: true,
                data: {
                    balance: currentBalance - amount,
                    goal: {
                        id: goal._id,
                        title: goal.title,
                        currentAmount: goal.currentAmount,
                        targetAmount: goal.targetAmount,
                        progress: (goal.currentAmount / goal.targetAmount) * 100
                    },
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