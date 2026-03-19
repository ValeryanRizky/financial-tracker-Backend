const IncomeDTO = require('../dtos/income.dto');

class IncomeService {
    constructor(incomeRepository, balanceRepository = null) {
        this.incomeRepository = incomeRepository;
        this.balanceRepository = balanceRepository;
    }

    // ============= VALIDATION METHODS =============
    _validatePaymentMethod(method) {
        const validMethods = ['Cash', 'Bank Transfer', 'E-Wallet', 'Credit Card', 'Debit Card', 'Other'];
        return validMethods.includes(method);
    }

    _validateCategory(category) {
        const validCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
        return validCategories.includes(category);
    }

    // ============= CREATE INCOME =============
    async createIncome(userId, incomeData) {
        try {
            // Validasi amount
            if (!incomeData.amount || incomeData.amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            // Validasi payment method
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
                    message: 'Invalid payment method. Must be: Cash, Bank Transfer, E-Wallet, Credit Card, Debit Card, or Other',
                    statusCode: 400
                };
            }

            // Validasi category
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

            // Siapkan data untuk disimpan
            const createData = IncomeDTO.createRequest({
                ...incomeData,
                userId
            });

            // Simpan ke database
            const income = await this.incomeRepository.create(createData);

            // Update balance jika ada balanceRepository
            if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = balance.amount + incomeData.amount;
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                } else {
                    // Buat balance baru jika belum ada
                    await this.balanceRepository.create({
                        userId: userId,
                        amount: incomeData.amount
                    });
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

    // ============= GET ALL INCOMES =============
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

    // ============= GET INCOME BY ID =============
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

    // ============= UPDATE INCOME =============
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

            // Validasi amount jika ada
            if (updateData.amount !== undefined && updateData.amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            // Validasi payment method jika ada
            if (updateData.paymentMethod && !this._validatePaymentMethod(updateData.paymentMethod)) {
                return {
                    success: false,
                    message: 'Invalid payment method',
                    statusCode: 400
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

            // Update data
            const updated = await this.incomeRepository.update(incomeId, updateData);

            // Update balance jika amount berubah dan ada balanceRepository
            if (this.balanceRepository && updateData.amount !== undefined) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const difference = updateData.amount - existing.amount;
                    const newAmount = balance.amount + difference;
                    await this.balanceRepository.updateByUserId(userId, newAmount);
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

    // ============= DELETE INCOME =============
    async deleteIncome(userId, incomeId) {
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

            // Hapus income
            await this.incomeRepository.delete(incomeId);

            // Update balance (kurangi saldo karena income dihapus)
            if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = Math.max(0, balance.amount - existing.amount);
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                }
            }

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

    // ============= GET CATEGORY SUMMARY =============
    async getCategorySummary(userId, startDate, endDate) {
        try {
            const summary = await this.incomeRepository.getCategorySummary(userId, startDate, endDate);
            const total = summary.reduce((sum, item) => sum + item.total, 0);

            // Hitung persentase
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

    // ============= GET MONTHLY SUMMARY =============
    async getMonthlySummary(userId, year, month) {
        try {
            // Buat range tanggal untuk bulan tersebut
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