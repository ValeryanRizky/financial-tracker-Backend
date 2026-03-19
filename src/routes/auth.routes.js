const express = require('express');

/**
 * Auth Routes
 * (Single Responsibility - define endpoints)
 */
class AuthRoutes {
    constructor(authController, authMiddleware) {
        this.router = express.Router();
        this.authController = authController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Public routes
        this.router.post('/register', this.authController.register);
        this.router.post('/login', this.authController.login);

        // Protected routes
        this.router.get(
            '/me',
            this.authMiddleware.verifyToken,
            this.authController.getMe
        );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;