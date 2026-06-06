const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const database = require('./config/database');

const UserRepository = require('./repositories/user.repository');
const BalanceRepository = require('./repositories/balance.repository');
const IncomeRepository = require('./repositories/income.repository');
const ExpenseRepository = require('./repositories/expense.repository');
const GoalRepository = require('./repositories/goal.repository');
const WalletRepository = require('./repositories/wallet.repository');

const AuthService = require('./services/auth.service');
const IncomeService = require('./services/income.service');
const ExpenseService = require('./services/expense.service');
const GoalService = require('./services/goal.service');
const BalanceService = require('./services/balance.service');
const WalletService = require('./services/wallet.service');

const AuthController = require('./controllers/auth.controller');
const UserController = require('./controllers/user.controller');
const IncomeController = require('./controllers/income.controller');
const ExpenseController = require('./controllers/expense.controller');
const GoalController = require('./controllers/goal.controller');
const BalanceController = require('./controllers/balance.controller');
const WalletController = require('./controllers/wallet.controller');

const AuthMiddleware = require('./middlewares/auth.middleware');

const AuthRoutes = require('./routes/auth.routes');
const UserRoutes = require('./routes/user.routes');
const IncomeRoutes = require('./routes/income.routes');
const ExpenseRoutes = require('./routes/expense.routes');
const GoalRoutes = require('./routes/goal.routes');
const BalanceRoutes = require('./routes/balance.routes');
const WalletRoutes = require('./routes/wallet.routes');

class App {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 5000;

        this.initializeDependencies();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    initializeDependencies() {
        this.userRepository = new UserRepository();
        this.balanceRepository = new BalanceRepository();
        this.incomeRepository = new IncomeRepository();
        this.expenseRepository = new ExpenseRepository();
        this.goalRepository = new GoalRepository();
        this.walletRepository = new WalletRepository();

        this.authService = new AuthService(
            this.userRepository,
            this.balanceRepository
        );

        this.incomeService = new IncomeService(
            this.incomeRepository,
            this.balanceRepository,
            this.walletRepository  
        );

        // 🔥 PERBAIKI: ExpenseService dengan walletRepository
        this.expenseService = new ExpenseService(
            this.expenseRepository,
            this.balanceRepository,
            this.walletRepository  
        );

        this.goalService = new GoalService(
            this.goalRepository,
            this.balanceRepository,
            this.walletRepository
        );

        this.balanceService = new BalanceService(
            this.balanceRepository,
            this.goalRepository,
            this.incomeRepository,
            this.expenseRepository,
            this.walletRepository 
        );

        this.walletService = new WalletService(
            this.walletRepository
        );

        this.authController = new AuthController(this.authService);
        this.userController = new UserController(this.userRepository);
        this.incomeController = new IncomeController(this.incomeService);
        this.expenseController = new ExpenseController(this.expenseService);
        this.goalController = new GoalController(this.goalService);
        this.balanceController = new BalanceController(this.balanceService);
        this.walletController = new WalletController(this.walletService);

        this.authMiddleware = new AuthMiddleware(this.userRepository);
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'API is running...',
                timestamp: new Date().toISOString()
            });
        });

        const authRoutes = new AuthRoutes(
            this.authController,
            this.authMiddleware
        );
        this.app.use('/api/auth', authRoutes.getRouter());

        const userRoutes = new UserRoutes(this.userController);
        this.app.use('/api/users', userRoutes.getRouter());

        const incomeRoutes = new IncomeRoutes(
            this.incomeController,
            this.authMiddleware
        );
        this.app.use('/api/incomes', incomeRoutes.getRouter());

        const expenseRoutes = new ExpenseRoutes(
            this.expenseController,
            this.authMiddleware
        );
        this.app.use('/api/expenses', expenseRoutes.getRouter());

        const goalRoutes = new GoalRoutes(
            this.goalController,
            this.authMiddleware
        );
        this.app.use('/api/goals', goalRoutes.getRouter());

        const balanceRoutes = new BalanceRoutes(
            this.balanceController,
            this.authMiddleware
        );
        this.app.use('/api/balance', balanceRoutes.getRouter());

        const walletRoutes = new WalletRoutes(
            this.walletController,
            this.authMiddleware
        );
        this.app.use('/api/wallets', walletRoutes.getRouter());
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });

        this.app.use((err, req, res, next) => {
            console.error('Error:', err.stack);
            res.status(500).json({
                success: false,
                message: 'Something went wrong!'
            });
        });
    }

    async start() {
        await database.connect(process.env.MONGODB_URI);

        this.app.listen(this.port, () => {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`📝 Available endpoints:`);
            console.log(`   - Auth:     /api/auth`);
            console.log(`   - Users:    /api/users`);
            console.log(`   - Incomes:  /api/incomes`);
            console.log(`   - Expenses: /api/expenses`);
            console.log(`   - Goals:    /api/goals`);
            console.log(`   - Balance:  /api/balance`);
            console.log(`   - Wallets:  /api/wallets`);
        });
    }
}

const app = new App();
app.start();