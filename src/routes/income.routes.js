const express = require('express');

class IncomeRoutes {
    constructor(incomeController, authMiddleware) {
        this.router = express.Router();
        this.incomeController = incomeController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(this.authMiddleware.verifyToken);

        this.router.post('/', this.incomeController.createIncome);
        this.router.get('/', this.incomeController.getUserIncomes);
        this.router.get('/summary/category', this.incomeController.getCategorySummary);
        this.router.get('/:id', this.incomeController.getIncomeById);
        this.router.put('/:id', this.incomeController.updateIncome);
        this.router.delete('/:id', this.incomeController.deleteIncome);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = IncomeRoutes;