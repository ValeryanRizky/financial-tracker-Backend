const Wallet = require('../models/Wallet');
const IRepository = require('../interfaces/repository.interface');

class WalletRepository extends IRepository {
    constructor() {
        super();
        this.model = Wallet;
    }

    async findById(id) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            return await this.model.findById(id);
        } catch (error) {
            throw new Error(`Error finding wallet: ${error.message}`);
        }
    }

    async findOne(condition) {
        try {
            if (!condition) throw new Error('Condition is required');
            return await this.model.findOne(condition);
        } catch (error) {
            throw new Error(`Error finding wallet: ${error.message}`);
        }
    }

    async create(data) {
        try {
            if (!data.userId) throw new Error('User ID is required');
            if (!data.name) throw new Error('Wallet name is required');
            return await this.model.create(data);
        } catch (error) {
            throw new Error(`Error creating wallet: ${error.message}`);
        }
    }

    async update(id, data) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            const wallet = await this.model.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true } 
            );
            if (!wallet) throw new Error('Wallet not found');
            return wallet;
        } catch (error) {
            throw new Error(`Error updating wallet: ${error.message}`);
        }
    }

    async updateBalance(id, newBalance) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            if (newBalance === undefined || newBalance === null) throw new Error('Balance is required');

            const wallet = await this.model.findByIdAndUpdate(
                id,
                { balance: newBalance },
                { new: true, runValidators: true }  
            );

            if (!wallet) throw new Error('Wallet not found');
            console.log(` Wallet balance updated: ${wallet.name} -> ${newBalance}`);
            return wallet;
        } catch (error) {
            throw new Error(`Error updating balance: ${error.message}`);
        }
    }

    async addBalance(id, amount) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

            const wallet = await this.model.findById(id);
            if (!wallet) throw new Error('Wallet not found');

            const newBalance = (wallet.balance || 0) + amount;

            const updatedWallet = await this.model.findByIdAndUpdate(
                id,
                { balance: newBalance },
                { new: true, runValidators: true }
            );

            return updatedWallet;
        } catch (error) {
            throw new Error(`Error adding balance: ${error.message}`);
        }
    }

    async subtractBalance(id, amount) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            if (!amount || amount <= 0) throw new Error('Amount must be greater than 0');

            const wallet = await this.model.findById(id);
            if (!wallet) throw new Error('Wallet not found');

            const newBalance = Math.max(0, (wallet.balance || 0) - amount);

            const updatedWallet = await this.model.findByIdAndUpdate(
                id,
                { balance: newBalance },
                { new: true, runValidators: true }
            );

            return updatedWallet;
        } catch (error) {
            throw new Error(`Error subtracting balance: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            const wallet = await this.model.findByIdAndDelete(id);
            if (!wallet) throw new Error('Wallet not found');
            return wallet;
        } catch (error) {
            throw new Error(`Error deleting wallet: ${error.message}`);
        }
    }

    async findByUserId(userId, filters = {}) {
        try {
            if (!userId) throw new Error('User ID is required');
            const query = { userId, isActive: true };

            if (filters.type) {
                query.type = filters.type;
            }

            if (filters.category) {
                query.category = filters.category;
            }

            return await this.model.find(query).sort({ category: 1, type: 1, name: 1 });
        } catch (error) {
            throw new Error(`Error finding wallets: ${error.message}`);
        }
    }

    async getSummary(userId) {
        try {
            if (!userId) throw new Error('User ID is required');
            const wallets = await this.model.find({ userId, isActive: true });

            const summary = {
                total: 0,
                byCategory: {},
                byType: {}
            };

            wallets.forEach(wallet => {
                summary.total += wallet.balance || 0;

                if (!summary.byCategory[wallet.category]) {
                    summary.byCategory[wallet.category] = 0;
                }
                summary.byCategory[wallet.category] += wallet.balance || 0;

                if (!summary.byType[wallet.type]) {
                    summary.byType[wallet.type] = 0;
                }
                summary.byType[wallet.type] += wallet.balance || 0;
            });

            return summary;
        } catch (error) {
            throw new Error(`Error getting wallet summary: ${error.message}`);
        }
    }

    async findAllByUserId(userId, includeInactive = false) {
        try {
            if (!userId) throw new Error('User ID is required');
            const query = { userId };
            if (!includeInactive) {
                query.isActive = true;
            }
            return await this.model.find(query).sort({ category: 1, type: 1, name: 1 });
        } catch (error) {
            throw new Error(`Error finding wallets: ${error.message}`);
        }
    }

    // 🔥 METHOD UNTUK UPDATE STATUS WALLET
    async updateStatus(id, isActive) {
        try {
            if (!id) throw new Error('Wallet ID is required');
            const wallet = await this.model.findByIdAndUpdate(
                id,
                { isActive },
                { new: true, runValidators: true }
            );
            if (!wallet) throw new Error('Wallet not found');
            return wallet;
        } catch (error) {
            throw new Error(`Error updating wallet status: ${error.message}`);
        }
    }
}

module.exports = WalletRepository;