class IncomeDTO {
    static createRequest(data) {
        return {
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            category: data.category,
            description: data.description || '',
            date: data.date ? new Date(data.date) : new Date(),
            userId: data.userId
        };
    }

    static response(income) {
        return {
            id: income._id,
            amount: income.amount,
            paymentMethod: income.paymentMethod,
            category: income.category,
            description: income.description,
            date: income.date,
            createdAt: income.createdAt,
            updatedAt: income.updatedAt
        };
    }

    static listResponse(incomes, total = null, totalAmount = null) {
        const response = {
            success: true,
            count: incomes.length,
            data: incomes.map(income => this.response(income))
        };

        if (total !== null) response.total = total;
        if (totalAmount !== null) response.totalAmount = totalAmount;

        return response;
    }
}

module.exports = IncomeDTO;