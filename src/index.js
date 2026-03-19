const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Config
dotenv.config();
const database = require('./config/database');

// ============= REPOSITORIES =============
const UserRepository = require('./repositories/user.repository');
const BalanceRepository = require('./repositories/balance.repository');
const IncomeRepository = require('./repositories/income.repository');
const ExpenseRepository = require('./repositories/expense.repository');
const GoalRepository = require('./repositories/goal.repository');

// ============= SERVICES =============
const AuthService = require('./services/auth.service');
const IncomeService = require('./services/income.service');
const ExpenseService = require('./services/expense.service');
const GoalService = require('./services/goal.service');
const BalanceService = require('./services/balance.service'); // <-- TAMBAHKAN

// ============= CONTROLLERS =============
const AuthController = require('./controllers/auth.controller');
const UserController = require('./controllers/user.controller');
const IncomeController = require('./controllers/income.controller');
const ExpenseController = require('./controllers/expense.controller');
const GoalController = require('./controllers/goal.controller');
const BalanceController = require('./controllers/balance.controller'); // <-- TAMBAHKAN

// ============= MIDDLEWARES =============
const AuthMiddleware = require('./middlewares/auth.middleware');

// ============= ROUTES =============
const AuthRoutes = require('./routes/auth.routes');
const UserRoutes = require('./routes/user.routes');
const IncomeRoutes = require('./routes/income.routes');
const ExpenseRoutes = require('./routes/expense.routes');
const GoalRoutes = require('./routes/goal.routes');
const BalanceRoutes = require('./routes/balance.routes'); // <-- TAMBAHKAN

class App {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;

        // Initialize dependencies
        this.initializeDependencies();

        // Setup middleware and routes
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    initializeDependencies() {
        // ============= REPOSITORIES =============
        this.userRepository = new UserRepository();
        this.balanceRepository = new BalanceRepository();
        this.incomeRepository = new IncomeRepository();
        this.expenseRepository = new ExpenseRepository();
        this.goalRepository = new GoalRepository();

        // ============= SERVICES =============
        this.authService = new AuthService(
            this.userRepository,
            this.balanceRepository
        );

        this.incomeService = new IncomeService(
            this.incomeRepository,
            this.balanceRepository
        );

        this.expenseService = new ExpenseService(
            this.expenseRepository,
            this.balanceRepository
        );

        this.goalService = new GoalService(
            this.goalRepository,
            this.balanceRepository
        );

        // 🔥 TAMBAH BALANCE SERVICE
        this.balanceService = new BalanceService(
            this.balanceRepository,
            this.goalRepository, 
            this.incomeRepository,    // <-- TAMBAHKAN
            this.expenseRepository
        );

        // ============= CONTROLLERS =============
        this.authController = new AuthController(this.authService);
        this.userController = new UserController(this.userRepository);
        this.incomeController = new IncomeController(this.incomeService);
        this.expenseController = new ExpenseController(this.expenseService);
        this.goalController = new GoalController(this.goalService);

        // 🔥 TAMBAH BALANCE CONTROLLER
        this.balanceController = new BalanceController(this.balanceService);

        // ============= MIDDLEWARES =============
        this.authMiddleware = new AuthMiddleware(this.userRepository);
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Health check
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'API is running...',
                timestamp: new Date().toISOString()
            });
        });

        // ============= AUTH ROUTES =============
        const authRoutes = new AuthRoutes(
            this.authController,
            this.authMiddleware
        );
        this.app.use('/api/auth', authRoutes.getRouter());

        // ============= USER ROUTES =============
        const userRoutes = new UserRoutes(this.userController);
        this.app.use('/api/users', userRoutes.getRouter());

        // ============= INCOME ROUTES =============
        const incomeRoutes = new IncomeRoutes(
            this.incomeController,
            this.authMiddleware
        );
        this.app.use('/api/incomes', incomeRoutes.getRouter());

        // ============= EXPENSE ROUTES =============
        const expenseRoutes = new ExpenseRoutes(
            this.expenseController,
            this.authMiddleware
        );
        this.app.use('/api/expenses', expenseRoutes.getRouter());

        // ============= GOAL ROUTES =============
        const goalRoutes = new GoalRoutes(
            this.goalController,
            this.authMiddleware
        );
        this.app.use('/api/goals', goalRoutes.getRouter());

        // ============= BALANCE ROUTES =============
        const balanceRoutes = new BalanceRoutes(
            this.balanceController,
            this.authMiddleware
        );
        this.app.use('/api/balance', balanceRoutes.getRouter()); // <-- TAMBAHKAN
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });

        // Error handler
        this.app.use((err, req, res, next) => {
            console.error('Error:', err.stack);
            res.status(500).json({
                success: false,
                message: 'Something went wrong!'
            });
        });
    }

    async start() {
        // Connect to database
        await database.connect(process.env.MONGODB_URI);

        // Start server
        this.app.listen(this.port, () => {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`📝 Available endpoints:`);
            console.log(`   - Auth:     /api/auth`);
            console.log(`   - Users:    /api/users`);
            console.log(`   - Incomes:  /api/incomes`);
            console.log(`   - Expenses: /api/expenses`);
            console.log(`   - Goals:    /api/goals`);
            console.log(`   - Balance:  /api/balance`); // <-- TAMBAHKAN
        });
    }
}

// Start the application
const app = new App();
app.start();