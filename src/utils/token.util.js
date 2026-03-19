const jwt = require('jsonwebtoken');

/**
 * Utility untuk handle JWT
 * (Single Responsibility - hanya urusan token)
 */
class TokenUtil {
    static generate(payload, expiresIn = '7d') {
        return jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn }
        );
    }

    static verify(token) {
        try {
            return {
                isValid: true,
                decoded: jwt.verify(token, process.env.JWT_SECRET)
            };
        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    static extractFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }
}

module.exports = TokenUtil;