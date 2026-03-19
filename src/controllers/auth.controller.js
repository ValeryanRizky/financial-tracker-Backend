const AuthDTO = require('../dtos/auth.dto');

/**
 * Auth Controller - Handle HTTP Request/Response
 * (Single Responsibility - hanya handle HTTP)
 */
class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    // Dependency Injection via constructor
    register = async (req, res) => {
        const result = await this.authService.register(req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    login = async (req, res) => {
        const result = await this.authService.login(req.body);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };

    getMe = async (req, res) => {
        const result = await this.authService.getProfile(req.userId);

        return res.status(result.statusCode).json({
            success: result.success,
            message: result.message,
            data: result.data
        });
    };
}

module.exports = AuthController;