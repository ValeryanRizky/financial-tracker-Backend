class ExpenseDTO {
    // Untuk request create expense
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

    // Untuk update request
    static updateRequest(data) {
        const updateData = {};
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
        if (data.category) updateData.category = data.category;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.date) updateData.date = new Date(data.date);
        return updateData;
    }

    // Untuk response (tanpa field sensitif)
    static response(expense) {
        return {
            id: expense._id,
            amount: expense.amount,
            paymentMethod: expense.paymentMethod,
            category: expense.category,
            description: expense.description,
            date: expense.date,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt
        };
    }

    // Untuk response list
    static listResponse(expenses, total = null, totalAmount = null, pageInfo = null) {
        const response = {
            success: true,
            count: expenses.length,
            data: expenses.map(expense => this.response(expense))
        };

        if (total !== null) response.total = total;
        if (totalAmount !== null) response.totalAmount = totalAmount;
        if (pageInfo) {
            response.page = pageInfo.page;
            response.totalPages = pageInfo.totalPages;
        }

        return response;
    }

    // Untuk summary kategori
    static categorySummaryResponse(categories, total) {
        return {
            success: true,
            data: {
                categories: categories.map(cat => ({
                    category: cat._id,
                    total: cat.total,
                    count: cat.count,
                    percentage: total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0
                })),
                total
            }
        };
    }
}

module.exports = ExpenseDTO;