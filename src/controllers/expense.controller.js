class ExpenseController {
    constructor(expenseService) {
        this.expenseService = expenseService;
    }

    createExpense = async (req, res) => {
        const result = await this.expenseService.createExpense(req.userId, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getUserExpenses = async (req, res) => {
        const filters = {
            category: req.query.category,
            paymentMethod: req.query.paymentMethod,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const result = await this.expenseService.getUserExpenses(req.userId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getExpenseById = async (req, res) => {
        const result = await this.expenseService.getExpenseById(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    updateExpense = async (req, res) => {
        const result = await this.expenseService.updateExpense(req.userId, req.params.id, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    deleteExpense = async (req, res) => {
        const result = await this.expenseService.deleteExpense(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    };

    getCategorySummary = async (req, res) => {
        const { startDate, endDate } = req.query;
        const result = await this.expenseService.getCategorySummary(req.userId, startDate, endDate);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getMonthlySummary = async (req, res) => {
        const { year, month } = req.params;
        const result = await this.expenseService.getMonthlySummary(req.userId, parseInt(year), parseInt(month));
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = ExpenseController;