class GoalDTO {
    static createRequest(data) {
        return {
            title: data.title,
            category: data.category,
            targetAmount: data.targetAmount,
            currentAmount: data.currentAmount || 0,
            deadline: new Date(data.deadline),
            color: data.color || 'bg-blue-600',
            icon: data.icon || '🎯',
            userId: data.userId
        };
    }

    static updateRequest(data) {
        const updateData = {};
        if (data.title) updateData.title = data.title;
        if (data.category) updateData.category = data.category;
        if (data.targetAmount) updateData.targetAmount = data.targetAmount;
        if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount;
        if (data.deadline) updateData.deadline = new Date(data.deadline);
        if (data.color) updateData.color = data.color;
        if (data.icon) updateData.icon = data.icon;
        return updateData;
    }

    static response(goal) {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const remaining = goal.targetAmount - goal.currentAmount;

        return {
            id: goal._id,
            title: goal.title,
            category: goal.category,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
            deadline: goal.deadline,
            color: goal.color,
            icon: goal.icon,
            progress: progress.toFixed(1),
            remaining: remaining,
            status: goal.updateStatus ? goal.updateStatus() : goal.status,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt
        };
    }

    static listResponse(goals, total = null) {
        const response = {
            success: true,
            count: goals.length,
            data: goals.map(goal => this.response(goal))
        };

        if (total !== null) {
            response.total = total;
        }

        return response;
    }
}

module.exports = GoalDTO;