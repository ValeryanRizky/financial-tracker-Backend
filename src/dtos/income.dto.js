class IncomeDTO {
    static createRequest(data) {
        return {
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            category: data.category,
            description: data.description || '',
            date: data.date ? new Date(data.date) : new Date(),
            userId: data.userId,
            walletId: data.walletId || null
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
            walletId: income.walletId || null,
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

    static updateRequest(data) {
        const updateData = {};

        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.walletId !== undefined) updateData.walletId = data.walletId;

        return updateData;
    }
}

module.exports = IncomeDTO;