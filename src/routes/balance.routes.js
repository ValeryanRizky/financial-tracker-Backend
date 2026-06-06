const express = require('express');

class BalanceRoutes {
    constructor(balanceController, authMiddleware) {
        this.router = express.Router();
        this.balanceController = balanceController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(this.authMiddleware.verifyToken);

        this.router.get('/', this.balanceController.getBalance);
        this.router.put('/', this.balanceController.updateBalance);
        this.router.get('/summary', this.balanceController.getSummary);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = BalanceRoutes;