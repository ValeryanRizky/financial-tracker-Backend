const TokenUtil = require('../utils/token.util');

class AuthMiddleware {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    verifyToken = async (req, res, next) => {
        try {
            const token = TokenUtil.extractFromHeader(req.headers.authorization);

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const verification = TokenUtil.verify(token);

            if (!verification.isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            const user = await this.userRepository.findById(verification.decoded.userId);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.userId = verification.decoded.userId;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
}

module.exports = AuthMiddleware;