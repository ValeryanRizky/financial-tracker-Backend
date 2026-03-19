const express = require('express');

class GoalRoutes {
    constructor(goalController, authMiddleware) {
        this.router = express.Router();
        this.goalController = goalController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Semua route goal butuh authentication
        this.router.use(this.authMiddleware.verifyToken);

        // CRUD routes
        this.router.post('/', this.goalController.createGoal);
        this.router.get('/', this.goalController.getUserGoals);
        this.router.get('/stats', this.goalController.getGoalStats);
        this.router.get('/:id', this.goalController.getGoalById);
        this.router.put('/:id', this.goalController.updateGoal);
        this.router.delete('/:id', this.goalController.deleteGoal);
        this.router.patch('/:id/contribute', this.goalController.addContribution);
    }

    getRouter() {
        return this.router;
    }
}

module.exports = GoalRoutes;