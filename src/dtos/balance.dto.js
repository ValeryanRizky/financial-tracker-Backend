class BalanceDTO {
    static response(balance) {
        return {
            id: balance._id,
            amount: balance.amount,
            userId: balance.userId,
            createdAt: balance.createdAt,
            updatedAt: balance.updatedAt
        };
    }

    static summaryResponse(balance, goals = []) {
        const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

        return {
            balance: balance?.amount || 0,
            totalSaved,
            remainingBalance: (balance?.amount || 0) - totalSaved,
            goalsCount: goals.length
        };
    }
}

module.exports = BalanceDTO;