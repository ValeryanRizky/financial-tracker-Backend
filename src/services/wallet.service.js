const WalletDTO = require('../dtos/wallet.dto');

class WalletService {
    constructor(walletRepository) {
        this.walletRepository = walletRepository;
    }

    _validateType(type) {
        const validTypes = ['bank', 'ewallet', 'cash', 'credit', 'debit', 'qris', 'transfer', 'other'];
        return validTypes.includes(type);
    }

    _validateCategory(category) {
        const validCategories = ['payment', 'digital', 'credit', 'savings'];
        return validCategories.includes(category);
    }

    async createWallet(userId, walletData) {
        try {
            // Validasi
            if (!walletData.name) {
                return {
                    success: false,
                    message: 'Wallet name is required',
                    statusCode: 400
                };
            }

            if (!walletData.type) {
                return {
                    success: false,
                    message: 'Wallet type is required',
                    statusCode: 400
                };
            }

            if (!this._validateType(walletData.type)) {
                return {
                    success: false,
                    message: 'Invalid wallet type',
                    statusCode: 400
                };
            }

            if (!walletData.category) {
                return {
                    success: false,
                    message: 'Wallet category is required',
                    statusCode: 400
                };
            }

            if (!this._validateCategory(walletData.category)) {
                return {
                    success: false,
                    message: 'Invalid wallet category',
                    statusCode: 400
                };
            }

            const createData = WalletDTO.createRequest({
                ...walletData,
                userId
            });

            const wallet = await this.walletRepository.create(createData);

            return {
                success: true,
                data: WalletDTO.response(wallet),
                statusCode: 201
            };
        } catch (error) {
            console.error('Create wallet error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getUserWallets(userId, filters = {}) {
        try {
            const wallets = await this.walletRepository.findByUserId(userId, filters);
            const summary = await this.walletRepository.getSummary(userId);

            return {
                success: true,
                data: {
                    wallets: wallets.map(w => WalletDTO.response(w)),
                    summary
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Get wallets error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getWalletById(userId, walletId) {
        try {
            const wallet = await this.walletRepository.findOne({
                _id: walletId,
                userId,
                isActive: true
            });

            if (!wallet) {
                return {
                    success: false,
                    message: 'Wallet not found',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: WalletDTO.response(wallet),
                statusCode: 200
            };
        } catch (error) {
            console.error('Get wallet error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async updateWallet(userId, walletId, updateData) {
        try {
            const wallet = await this.walletRepository.findOne({
                _id: walletId,
                userId,
                isActive: true
            });

            if (!wallet) {
                return {
                    success: false,
                    message: 'Wallet not found',
                    statusCode: 404
                };
            }

            if (updateData.type && !this._validateType(updateData.type)) {
                return {
                    success: false,
                    message: 'Invalid wallet type',
                    statusCode: 400
                };
            }

            // Validasi category jika ada
            if (updateData.category && !this._validateCategory(updateData.category)) {
                return {
                    success: false,
                    message: 'Invalid wallet category',
                    statusCode: 400
                };
            }

            const updatedWallet = await this.walletRepository.update(walletId, updateData);

            return {
                success: true,
                data: WalletDTO.response(updatedWallet),
                statusCode: 200
            };
        } catch (error) {
            console.error('Update wallet error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async deleteWallet(userId, walletId) {
        try {
            const wallet = await this.walletRepository.findOne({
                _id: walletId,
                userId,
                isActive: true
            });

            if (!wallet) {
                return {
                    success: false,
                    message: 'Wallet not found',
                    statusCode: 404
                };
            }

            await this.walletRepository.update(walletId, { isActive: false });

            return {
                success: true,
                message: 'Wallet deleted successfully',
                statusCode: 200
            };
        } catch (error) {
            console.error('Delete wallet error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async getSummary(userId) {
        try {
            const summary = await this.walletRepository.getSummary(userId);

            return {
                success: true,
                data: summary,
                statusCode: 200
            };
        } catch (error) {
            console.error('Get summary error:', error);
            return {
                success: false,
                message: error.message || 'Internal server error',
                statusCode: 500
            };
        }
    }

    async addBalance(userId, walletId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            const wallet = await this.walletRepository.findOne({
                _id: walletId,
                userId,
                isActive: true
            });

            if (!wallet) {
                return {
                    success: false,
                    message: 'Wallet not found',
                    statusCode: 404
                };
            }

            const newBalance = (wallet.balance || 0) + amount;
            const updatedWallet = await this.walletRepository.updateBalance(walletId, newBalance);

            return {
                success: true,
                message: 'Balance added successfully',
                data: WalletDTO.response(updatedWallet),
                statusCode: 200
            };
        } catch (error) {
            console.error('Add balance error:', error);
            return {
                success: false,
                message: error.message || 'Failed to add balance',
                statusCode: 500
            };
        }
    }

    async subtractBalance(userId, walletId, amount) {
        try {
            if (!amount || amount <= 0) {
                return {
                    success: false,
                    message: 'Amount must be greater than 0',
                    statusCode: 400
                };
            }

            const wallet = await this.walletRepository.findOne({
                _id: walletId,
                userId,
                isActive: true
            });

            if (!wallet) {
                return {
                    success: false,
                    message: 'Wallet not found',
                    statusCode: 404
                };
            }

            const currentBalance = wallet.balance || 0;
            if (currentBalance < amount) {
                return {
                    success: false,
                    message: 'Insufficient balance',
                    statusCode: 400
                };
            }

            const newBalance = currentBalance - amount;
            const updatedWallet = await this.walletRepository.updateBalance(walletId, newBalance);

            return {
                success: true,
                message: 'Balance subtracted successfully',
                data: WalletDTO.response(updatedWallet),
                statusCode: 200
            };
        } catch (error) {
            console.error('Subtract balance error:', error);
            return {
                success: false,
                message: error.message || 'Failed to subtract balance',
                statusCode: 500
            };
        }
    }
}

module.exports = WalletService;