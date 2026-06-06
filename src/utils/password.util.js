const bcrypt = require('bcryptjs');

class PasswordUtil {
    static async hash(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    static async compare(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    static validate(password) {
        if (password.length < 6) {
            return {
                isValid: false,
                message: 'Password must be at least 6 characters'
            };
        }

        return {
            isValid: true,
            message: 'Password is valid'
        };
    }
}

module.exports = PasswordUtil;