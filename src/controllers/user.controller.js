class UserController {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    getAllUsers = async (req, res) => {
        try {
            const users = await this.userRepository.getAllUsers();
            res.json({
                success: true,
                count: users.length,
                data: users
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    getUserById = async (req, res) => {
        try {
            const user = await this.userRepository.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Get user by id error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
}

module.exports = UserController;