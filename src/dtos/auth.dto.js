
class AuthDTO {
    static registerRequest(data) {
        return {
            email: data.email?.toLowerCase().trim(),
            password: data.password,
            name: data.name?.trim()
        };
    }

    // Login Request
    static loginRequest(data) {
        return {
            email: data.email?.toLowerCase().trim(),
            password: data.password
        };
    }

    // User Response (tanpa password)
    static userResponse(user, token = null) {
        const response = {
            id: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        };

        if (token) {
            response.token = token;
        }

        return response;
    }

    // Error Response
    static errorResponse(message, statusCode = 400) {
        return {
            success: false,
            message,
            statusCode
        };
    }

    // Success Response
    static successResponse(data, message = 'Success') {
        return {
            success: true,
            message,
            data
        };
    }
}

module.exports = AuthDTO;