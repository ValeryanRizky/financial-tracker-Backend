
class IRepository {
    async findById(id) {
        throw new Error('Method not implemented');
    }

    async findOne(condition) {
        throw new Error('Method not implemented');
    }

    async create(data) {
        throw new Error('Method not implemented');
    }

    async update(id, data) {
        throw new Error('Method not implemented');
    }

    async delete(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = IRepository;