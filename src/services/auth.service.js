const PasswordUtil = require('../utils/password.util');
const TokenUtil = require('../utils/token.util');
const AuthDTO = require('../dtos/auth.dto');

class AuthService {
    constructor(userRepository, balanceRepository) {
        this.userRepository = userRepository;
        this.balanceRepository = balanceRepository;
    }

    async register(userData) {
        try {
            const validatedData = AuthDTO.registerRequest(userData);

            if (!validatedData.email || !validatedData.password || !validatedData.name) {
                return {
                    success: false,
                    message: 'All fields are required',
                    statusCode: 400
                };
            }

            const passwordValidation = PasswordUtil.validate(validatedData.password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.message,
                    statusCode: 400
                };
            }

            const existingUser = await this.userRepository.findByEmail(validatedData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email already registered',
                    statusCode: 400
                };
            }

            const hashedPassword = await PasswordUtil.hash(validatedData.password);

            const newUser = await this.userRepository.create({
                email: validatedData.email,
                password: hashedPassword,
                name: validatedData.name
            });

            await this.balanceRepository.create({
                userId: newUser._id,
                amount: 0
            });

            const token = TokenUtil.generate({ userId: newUser._id });

            return {
                success: true,
                data: AuthDTO.userResponse(newUser, token),
                statusCode: 201
            };
        } catch (error) {
            console.error('Register service error:', error);
            return {
                success: false,
                message: 'Internal server error',
                statusCode: 500
            };
        }
    }

    async login(credentials) {
        try {
            const validatedData = AuthDTO.loginRequest(credentials);

            if (!validatedData.email || !validatedData.password) {
                return {
                    success: false,
                    message: 'Email and password are required',
                    statusCode: 400
                };
            }

            const user = await this.userRepository.findByEmail(validatedData.email);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password',
                    statusCode: 400
                };
            }

            const isPasswordValid = await PasswordUtil.compare(
                validatedData.password,
                user.password
            );

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid email or password',
                    statusCode: 400
                };
            }

            const token = TokenUtil.generate({ userId: user._id });

            return {
                success: true,
                data: AuthDTO.userResponse(user, token),
                statusCode: 200
            };
        } catch (error) {
            console.error('Login service error:', error);
            return {
                success: false,
                message: 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getProfile(userId) {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: AuthDTO.userResponse(user),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get profile service error:', error);
            return {
                success: false,
                message: 'Internal server error',
                statusCode: 500
            };
        }
    }
}

module.exports = AuthService;