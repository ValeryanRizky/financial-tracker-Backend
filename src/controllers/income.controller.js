class IncomeController {
    constructor(incomeService) {
        this.incomeService = incomeService;
    }

    createIncome = async (req, res) => {
        const result = await this.incomeService.createIncome(req.userId, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getUserIncomes = async (req, res) => {
        const filters = {
            category: req.query.category,
            paymentMethod: req.query.paymentMethod,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10
        };

        const result = await this.incomeService.getUserIncomes(req.userId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getIncomeById = async (req, res) => {
        const result = await this.incomeService.getIncomeById(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    updateIncome = async (req, res) => {
        const result = await this.incomeService.updateIncome(req.userId, req.params.id, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    deleteIncome = async (req, res) => {
        const result = await this.incomeService.deleteIncome(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    };

    getCategorySummary = async (req, res) => {
        const { startDate, endDate } = req.query;
        const result = await this.incomeService.getCategorySummary(req.userId, startDate, endDate);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = IncomeController;