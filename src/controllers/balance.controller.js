class BalanceController {
    constructor(balanceService) {
        this.balanceService = balanceService;
    }

    // Get balance
    getBalance = async (req, res) => {
        const result = await this.balanceService.getBalance(req.userId);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Update balance
    updateBalance = async (req, res) => {
        const { amount } = req.body;
        const result = await this.balanceService.updateBalance(req.userId, amount);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Get summary (balance + goals)
    getSummary = async (req, res) => {
        const result = await this.balanceService.getSummary(req.userId);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = BalanceController;