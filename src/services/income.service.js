const IncomeDTO = require('../dtos/income.dto');

class IncomeService {
    constructor(incomeRepository, balanceRepository = null, walletRepository = null) {
        this.incomeRepository = incomeRepository;
        this.balanceRepository = balanceRepository;
        this.walletRepository = walletRepository;
    }

    _validatePaymentMethod(method) {
        return method && typeof method === 'string' && method.trim().length > 0;
    }

    _validateCategory(category) {
        const validCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
        return validCategories.includes(category);
    }

    async createIncome(userId, incomeData) {
        try {
            if (!incomeData.amount || incomeData.amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            if (!incomeData.paymentMethod) {
                return {
                    success: false,
                    message: 'Payment method is required',
                    statusCode: 400
                };
            }

            if (!this._validatePaymentMethod(incomeData.paymentMethod)) {
                return {
                    success: false,
                    message: 'Payment method must be a valid string',
                    statusCode: 400
                };
            }

            if (!incomeData.category) {
                return {
                    success: false,
                    message: 'Category is required',
                    statusCode: 400
                };
            }

            if (!this._validateCategory(incomeData.category)) {
                return {
                    success: false,
                    message: 'Invalid category. Must be: Salary, Freelance, Investment, Gift, or Other',
                    statusCode: 400
                };
            }

            const createData = IncomeDTO.createRequest({
                ...incomeData,
                userId
            });

            console.log('📝 Creating income with data:', {
                amount: createData.amount,
                walletId: createData.walletId,
                userId: createData.userId
            });

            const income = await this.incomeRepository.create(createData);

            let walletUpdated = false;

            if (incomeData.walletId && this.walletRepository) {
                try {
                    const wallet = await this.walletRepository.findById(incomeData.walletId);
                    if (wallet && wallet.userId.toString() === userId) {
                        const oldBalance = wallet.balance || 0;
                        const newBalance = oldBalance + incomeData.amount;
                        await this.walletRepository.updateBalance(incomeData.walletId, newBalance); // <-- PAKAI updateBalance
                        walletUpdated = true;
                        console.log(`✅ Wallet ${wallet.name} (ID: ${incomeData.walletId}) updated: ${oldBalance} + ${incomeData.amount} = ${newBalance}`);
                    } else {
                        console.warn(`⚠️ Wallet not found or not owned by user: ${incomeData.walletId}`);
                    }
                } catch (walletError) {
                    console.error('Error updating wallet:', walletError);
                }
            } else {
                console.log('ℹ️ No walletId provided, skipping wallet update');
            }

            if (!walletUpdated && this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = balance.amount + incomeData.amount;
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                    console.log(`✅ Legacy balance updated: +${incomeData.amount} → ${newAmount}`);
                } else {
                    await this.balanceRepository.create({
                        userId: userId,
                        amount: incomeData.amount
                    });
                    console.log(`✅ Legacy balance created: ${incomeData.amount}`);
                }
            }

            return {
                success: true,
                data: IncomeDTO.response(income),
                statusCode: 201
            };
        } catch (error) {
            console.error('Create income error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getUserIncomes(userId, filters = {}) {
        try {
            const result = await this.incomeRepository.findByUserId(userId, filters);
            const totalAmount = await this.incomeRepository.getTotalByUserId(userId, filters);

            return {
                success: true,
                data: {
                    incomes: result.incomes.map(inc => IncomeDTO.response(inc)),
                    total: result.total,
                    totalAmount,
                    page: result.page,
                    totalPages: result.totalPages
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get incomes error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getIncomeById(userId, incomeId) {
        try {
            const income = await this.incomeRepository.findOne({
                _id: incomeId,
                userId
            });

            if (!income) {
                return {
                    success: false,
                    message: 'Income not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: IncomeDTO.response(income),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get income error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async updateIncome(userId, incomeId, updateData) {
        try {
            // Cek apakah income ada
            const existing = await this.incomeRepository.findOne({
                _id: incomeId,
                userId
            });

            if (!existing) {
                return {
                    success: false,
                    message: 'Income not found',
                    statusCode: 404
                };
            }

            if (updateData.amount !== undefined && updateData.amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            if (updateData.paymentMethod && !this._validatePaymentMethod(updateData.paymentMethod)) {
                return {
                    success: false,
                    message: 'Payment method must be a valid string',
                    statusCode: 400
                };
            }

            if (updateData.category && !this._validateCategory(updateData.category)) {
                return {
                    success: false,
                    message: 'Invalid category',
                    statusCode: 400
                };
            }

            const amountDifference = updateData.amount !== undefined
                ? updateData.amount - existing.amount
                : 0;

            const updated = await this.incomeRepository.update(incomeId, updateData);

            let walletUpdated = false;

            if (amountDifference !== 0 && existing.walletId && this.walletRepository) {
                try {
                    const wallet = await this.walletRepository.findById(existing.walletId);
                    if (wallet && wallet.userId.toString() === userId) {
                        const newBalance = (wallet.balance || 0) + amountDifference;
                        await this.walletRepository.updateBalance(existing.walletId, newBalance); // <-- PAKAI updateBalance
                        walletUpdated = true;
                        console.log(`✅ Wallet ${wallet.name} updated: ${amountDifference > 0 ? '+' : ''}${amountDifference} → ${newBalance}`);
                    }
                } catch (walletError) {
                    console.error('Error updating wallet on update:', walletError);
                }
            }

            if (!walletUpdated && amountDifference !== 0 && this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = balance.amount + amountDifference;
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                    console.log(`✅ Legacy balance updated: ${amountDifference > 0 ? '+' : ''}${amountDifference} → ${newAmount}`);
                }
            }

            return {
                success: true,
                data: IncomeDTO.response(updated),
                statusCode: 200
            };
        } catch (error) {
            console.error('Update income error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async deleteIncome(userId, incomeId) {
        try {
            const existing = await this.incomeRepository.findOne({
                _id: incomeId,
                userId
            });

            if (!existing) {
                return {
                    success: false,
                    message: 'Income not found',
                    statusCode: 404
                };
            }

            let walletUpdated = false;

            if (existing.walletId && this.walletRepository) {
                try {
                    const wallet = await this.walletRepository.findById(existing.walletId);
                    if (wallet && wallet.userId.toString() === userId) {
                        const newBalance = Math.max(0, (wallet.balance || 0) - existing.amount);
                        await this.walletRepository.updateBalance(existing.walletId, newBalance); // <-- PAKAI updateBalance
                        walletUpdated = true;
                        console.log(`✅ Wallet ${wallet.name} updated: -${existing.amount} → ${newBalance}`);
                    }
                } catch (walletError) {
                    console.error('Error updating wallet on delete:', walletError);
                }
            }

            if (!walletUpdated && this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = Math.max(0, balance.amount - existing.amount);
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                    console.log(`✅ Legacy balance updated: -${existing.amount} → ${newAmount}`);
                }
            }

            await this.incomeRepository.delete(incomeId);

            return {
                success: true,
                message: 'Income deleted successfully',
                statusCode: 200
            };
        } catch (error) {
            console.error('Delete income error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getCategorySummary(userId, startDate, endDate) {
        try {
            const summary = await this.incomeRepository.getCategorySummary(userId, startDate, endDate);
            const total = summary.reduce((sum, item) => sum + item.total, 0);

            const categoriesWithPercentage = summary.map(item => ({
                category: item._id,
                total: item.total,
                count: item.count,
                percentage: total > 0 ? ((item.total / total) * 100).toFixed(1) : 0
            }));

            return {
                success: true,
                data: {
                    categories: categoriesWithPercentage,
                    total
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get category summary error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getMonthlySummary(userId, year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const filters = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const totalAmount = await this.incomeRepository.getTotalByUserId(userId, filters);
            const transactions = await this.incomeRepository.findByUserId(userId, filters);

            return {
                success: true,
                data: {
                    total: totalAmount,
                    count: transactions.total,
                    average: transactions.total > 0 ? totalAmount / transactions.total : 0,
                    month: month,
                    year: year
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get monthly summary error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }
}

module.exports = IncomeService;