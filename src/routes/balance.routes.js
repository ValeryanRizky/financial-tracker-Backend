const express = require('express');

class BalanceRoutes {
    constructor(balanceController, authMiddleware) {
        this.router = express.Router();
        this.balanceController = balanceController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Semua route balance butuh authentication
        this.router.use(this.authMiddleware.verifyToken);

        // CRUD routes
        this.router.get('/', this.balanceController.getBalance);
        this.router.put('/', this.balanceController.updateBalance);
        this.router.get('/summary', this.balanceController.getSummary);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = BalanceRoutes;