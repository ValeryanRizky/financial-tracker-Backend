const express = require('express');

class AuthRoutes {
    constructor(authController, authMiddleware) {
        this.router = express.Router();
        this.authController = authController;
        this.authMiddleware = authMiddleware;
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post('/register', this.authController.register);
        this.router.post('/login', this.authController.login);

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