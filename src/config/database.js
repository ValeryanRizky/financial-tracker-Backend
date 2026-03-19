const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
    }

    async connect(uri) {
        try {
            this.connection = await mongoose.connect(uri);
            console.log('✅ Database connected');
            return this.connection;
        } catch (error) {
            console.error('❌ Database connection error:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            console.log('Database disconnected');
        }
    }
}

module.exports = new Database();