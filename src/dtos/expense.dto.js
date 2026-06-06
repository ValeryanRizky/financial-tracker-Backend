class ExpenseDTO {
    static createRequest(data) {
        return {
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            category: data.category,
            description: data.description || '',
            date: data.date ? new Date(data.date) : new Date(),
            userId: data.userId,
            walletId: data.walletId 
        };
    }

    static response(expense) {
        return {
            id: expense._id,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            category: expense.category,
            description: expense.description,
            date: expense.date,
            walletId: expense.walletId,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt
        };
    }

    static listResponse(expenses, total = null, totalAmount = null) {
        const response = {
            success: true,
            count: expenses.length,
            data: expenses.map(expense => this.response(expense))
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

module.exports = ExpenseDTO;