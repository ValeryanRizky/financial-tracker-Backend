const express = require('express');

class UserRoutes {
    constructor(userController) {
        this.router = express.Router();
        this.userController = userController;

        // Tambahkan console.log untuk debug (opsional)

        this.initializeRoutes();
    }

    initializeRoutes() {
        // Cek apakah userController ada
        if (!this.userController) {
            console.error('❌ userController is undefined!');
            return;
        }

        // Public routes (untuk development)
        this.router.get('/', this.userController.getAllUsers.bind(this.userController));
        this.router.get('/:id', this.userController.getUserById.bind(this.userController));

    }

    getRouter() {
        return this.router;
    }
}

module.exports = UserRoutes;