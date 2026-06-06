class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }

    createWallet = async (req, res) => {
        const result = await this.walletService.createWallet(req.userId, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getUserWallets = async (req, res) => {
        const filters = {
            type: req.query.type,
            category: req.query.category
        };

        const result = await this.walletService.getUserWallets(req.userId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getWalletById = async (req, res) => {
        const result = await this.walletService.getWalletById(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    updateWallet = async (req, res) => {
        const result = await this.walletService.updateWallet(req.userId, req.params.id, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    deleteWallet = async (req, res) => {
        const result = await this.walletService.deleteWallet(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    };

    getSummary = async (req, res) => {
        const result = await this.walletService.getSummary(req.userId);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    addBalance = async (req, res) => {
        const { id } = req.params;
        const { amount } = req.body;

        const result = await this.walletService.addBalance(req.userId, id, amount);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    subtractBalance = async (req, res) => {
        const { id } = req.params;
        const { amount } = req.body;

        const result = await this.walletService.subtractBalance(req.userId, id, amount);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = WalletController;