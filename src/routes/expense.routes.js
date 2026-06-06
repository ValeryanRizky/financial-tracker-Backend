const express = require('express');

class ExpenseRoutes {
    constructor(expenseController, authMiddleware) {
        this.router = express.Router();
        this.expenseController = expenseController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.use(this.authMiddleware.verifyToken);

        this.router.post('/', this.expenseController.createExpense);
        this.router.get('/', this.expenseController.getUserExpenses);
        this.router.get('/summary/category', this.expenseController.getCategorySummary);
        this.router.get('/summary/monthly/:year/:month', this.expenseController.getMonthlySummary);
        this.router.get('/:id', this.expenseController.getExpenseById);
        this.router.put('/:id', this.expenseController.updateExpense);
        this.router.delete('/:id', this.expenseController.deleteExpense);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = ExpenseRoutes;