const express = require('express');

class WalletRoutes {
    constructor(walletController, authMiddleware) {
        this.router = express.Router();
        this.walletController = walletController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(this.authMiddleware.verifyToken);

        this.router.post('/', this.walletController.createWallet);
        this.router.get('/', this.walletController.getUserWallets);
        this.router.get('/summary', this.walletController.getSummary);
        this.router.get('/:id', this.walletController.getWalletById);
        this.router.put('/:id', this.walletController.updateWallet);
        this.router.delete('/:id', this.walletController.deleteWallet);

        this.router.patch('/:id/add-balance', this.walletController.addBalance);
        this.router.patch('/:id/subtract-balance', this.walletController.subtractBalance);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WalletRoutes;