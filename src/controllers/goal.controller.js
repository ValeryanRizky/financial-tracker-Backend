class GoalController {
    constructor(goalService) {
        this.goalService = goalService;
    }

    // Create goal
    createGoal = async (req, res) => {
        const result = await this.goalService.createGoal(req.userId, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Get all goals
    getUserGoals = async (req, res) => {
        const filters = {
            category: req.query.category,
            status: req.query.status
        };

        const result = await this.goalService.getUserGoals(req.userId, filters);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Get single goal
    getGoalById = async (req, res) => {
        const result = await this.goalService.getGoalById(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Update goal
    updateGoal = async (req, res) => {
        const result = await this.goalService.updateGoal(req.userId, req.params.id, req.body);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Delete goal
    deleteGoal = async (req, res) => {
        const result = await this.goalService.deleteGoal(req.userId, req.params.id);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message
        });
    };

    // Add contribution
    addContribution = async (req, res) => {
        const { amount } = req.body;
        const result = await this.goalService.addContribution(req.userId, req.params.id, amount);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    // Get goal stats
    getGoalStats = async (req, res) => {
        const result = await this.goalService.getGoalStats(req.userId);
        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = GoalController;