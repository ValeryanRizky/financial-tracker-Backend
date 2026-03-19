const ExpenseDTO = require('../dtos/expense.dto');

class ExpenseService {
    constructor(expenseRepository, balanceRepository = null) {
        this.expenseRepository = expenseRepository;
        this.balanceRepository = balanceRepository;
    }

    // ============= VALIDATION METHODS =============
    _validateCategory(category) {
        const validCategories = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'];
        return validCategories.includes(category);
    }

    _validatePaymentMethod(method) {
        const validMethods = ['Cash', 'Bank Transfer', 'E-Wallet', 'Credit Card', 'Debit Card', 'Other'];
        return validMethods.includes(method);
    }

    // ============= CREATE EXPENSE =============
    async createExpense(userId, expenseData) {
        try {
            // Validasi amount
            if (!expenseData.amount || expenseData.amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            // Validasi payment method
            if (!expenseData.paymentMethod) {
                return {
                    success: false,
                    message: 'Payment method is required',
                    statusCode: 400
                };
            }

            if (!this._validatePaymentMethod(expenseData.paymentMethod)) {
                return {
                    success: false,
                    message: 'Invalid payment method. Must be: Cash, Bank Transfer, E-Wallet, Credit Card, Debit Card, or Other',
                    statusCode: 400
                };
            }

            // Validasi category
            if (!expenseData.category) {
                return {
                    success: false,
                    message: 'Category is required',
                    statusCode: 400
                };
            }

            if (!this._validateCategory(expenseData.category)) {
                return {
                    success: false,
                    message: 'Invalid category. Must be: Food, Transport, Bills, Shopping, Health, or Other',
                    statusCode: 400
                };
            }

            // Siapkan data
            const createData = ExpenseDTO.createRequest({
                ...expenseData,
                userId
            });

            // Simpan ke database
            const expense = await this.expenseRepository.create(createData);

            // Update balance (kurangi saldo) jika ada balanceRepository
            if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = Math.max(0, balance.amount - expenseData.amount);
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                } else {
                    // Buat balance baru jika belum ada (tapi expense harusnya balance sudah ada)
                    await this.balanceRepository.create({
                        userId: userId,
                        amount: 0
                    });
                }
            }

            return {
                success: true,
                data: ExpenseDTO.response(expense),
                statusCode: 201
            };
        } catch (error) {
            console.error('Create expense error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= GET ALL EXPENSES =============
    async getUserExpenses(userId, filters = {}) {
        try {
            const result = await this.expenseRepository.findByUserId(userId, filters);

            // Hitung total keseluruhan
            const totalAmount = await this.expenseRepository.getTotalByUserId(userId, filters);

            return {
                success: true,
                data: {
                    expenses: result.expenses.map(exp => ExpenseDTO.response(exp)),
                    total: result.total,
                    totalAmount,
                    page: result.page,
                    totalPages: result.totalPages
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get expenses error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= GET EXPENSE BY ID =============
    async getExpenseById(userId, expenseId) {
        try {
            const expense = await this.expenseRepository.findOne({
                _id: expenseId,
                userId
            });

            if (!expense) {
                return {
                    success: false,
                    message: 'Expense not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: ExpenseDTO.response(expense),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get expense error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= UPDATE EXPENSE =============
    async updateExpense(userId, expenseId, updateData) {
        try {
            // Cek apakah expense ada
            const existingExpense = await this.expenseRepository.findOne({
                _id: expenseId,
                userId
            });

            if (!existingExpense) {
                return {
                    success: false,
                    message: 'Expense not found',
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

            // Validasi category jika ada
            if (updateData.category && !this._validateCategory(updateData.category)) {
                return {
                    success: false,
                    message: 'Invalid category',
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

            const sanitizedData = ExpenseDTO.updateRequest(updateData);

            // Update data
            const updatedExpense = await this.expenseRepository.update(expenseId, sanitizedData);

            // Update balance jika amount berubah dan ada balanceRepository
            if (this.balanceRepository && updateData.amount !== undefined) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const difference = updateData.amount - existingExpense.amount;
                    const newAmount = Math.max(0, balance.amount - difference);
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                }
            }

            return {
                success: true,
                data: ExpenseDTO.response(updatedExpense),
                statusCode: 200
            };
        } catch (error) {
            console.error('Update expense error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= DELETE EXPENSE =============
    async deleteExpense(userId, expenseId) {
        try {
            // Cek apakah expense ada
            const existingExpense = await this.expenseRepository.findOne({
                _id: expenseId,
                userId
            });

            if (!existingExpense) {
                return {
                    success: false,
                    message: 'Expense not found',
                    statusCode: 404
                };
            }

            // Hapus
            await this.expenseRepository.delete(expenseId);

            // Update balance (tambah saldo karena expense dihapus)
            if (this.balanceRepository) {
                const balance = await this.balanceRepository.findByUserId(userId);
                if (balance) {
                    const newAmount = balance.amount + existingExpense.amount;
                    await this.balanceRepository.updateByUserId(userId, newAmount);
                }
            }

            return {
                success: true,
                message: 'Expense deleted successfully',
                statusCode: 200
            };
        } catch (error) {
            console.error('Delete expense error:', error);
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
            const summary = await this.expenseRepository.getCategorySummary(userId, startDate, endDate);
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
            const summary = await this.expenseRepository.getMonthlySummary(userId, year, month);

            return {
                success: true,
                data: {
                    total: summary.total || 0,
                    count: summary.count || 0,
                    average: summary.average || 0,
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

    // ============= GET DAILY SUMMARY =============
    async getDailySummary(userId, date) {
        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const filters = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            };

            const totalAmount = await this.expenseRepository.getTotalByUserId(userId, filters);
            const transactions = await this.expenseRepository.findByUserId(userId, filters);

            return {
                success: true,
                data: {
                    date: date,
                    total: totalAmount,
                    count: transactions.total,
                    transactions: transactions.expenses.map(exp => ExpenseDTO.response(exp))
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get daily summary error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= GET EXPENSE TRENDS =============
    async getExpenseTrends(userId, months = 6) {
        try {
            const trends = [];
            const currentDate = new Date();

            for (let i = 0; i < months; i++) {
                const date = new Date(currentDate);
                date.setMonth(date.getMonth() - i);

                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                const summary = await this.expenseRepository.getMonthlySummary(userId, year, month);

                trends.push({
                    month: `${year}-${month.toString().padStart(2, '0')}`,
                    total: summary.total || 0,
                    count: summary.count || 0
                });
            }

            return {
                success: true,
                data: trends.reverse(),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get expense trends error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    // ============= GET TOP EXPENSES =============
    async getTopExpenses(userId, limit = 5, startDate, endDate) {
        try {
            const filters = { startDate, endDate, limit };
            const result = await this.expenseRepository.findByUserId(userId, filters);

            // Sort by amount descending
            const topExpenses = result.expenses
                .sort((a, b) => b.amount - a.amount)
                .slice(0, limit)
                .map(exp => ExpenseDTO.response(exp));

            return {
                success: true,
                data: topExpenses,
                statusCode: 200
            };
        } catch (error) {
            console.error('Get top expenses error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }
}

module.exports = ExpenseService;