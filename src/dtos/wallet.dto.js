class WalletDTO {
    static createRequest(data) {
        return {
            name: data.name,
            type: data.type,
            category: data.category,
            balance: data.balance || 0,
            icon: data.icon || this.getDefaultIcon(data.type),
            color: data.color || this.getDefaultColor(data.type),
            institution: data.institution,
            cardNumber: data.cardNumber,
            notes: data.notes,
            userId: data.userId
        };
    }

    static getDefaultIcon(type) {
        const icons = {
            bank: '🏦',
            ewallet: '📱',
            cash: '💵',
            credit: '💳',
            debit: '💳',
            qris: '📲',
            transfer: '🔄',
            other: '💰'
        };
        return icons[type] || '💰';
    }

    static getDefaultColor(type) {
        const colors = {
            bank: 'bg-blue-600',
            ewallet: 'bg-green-600',
            cash: 'bg-emerald-600',
            credit: 'bg-rose-600',
            debit: 'bg-purple-600',
            qris: 'bg-amber-600',
            transfer: 'bg-indigo-600',
            other: 'bg-slate-600'
        };
        return colors[type] || 'bg-blue-600';
    }

    static response(wallet) {
        return {
            id: wallet._id,
            name: wallet.name,
            type: wallet.type,
            category: wallet.category,
            balance: wallet.balance,
            icon: wallet.icon,
            color: wallet.color,
            institution: wallet.institution,
            cardNumber: wallet.cardNumber ? this.maskCardNumber(wallet.cardNumber) : null,
            notes: wallet.notes,
            isActive: wallet.isActive,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
        };
    }

    static maskCardNumber(cardNumber) {
        if (!cardNumber) return null;
        const last4 = cardNumber.slice(-4);
        return `**** ${last4}`;
    }

    static summaryResponse(wallets) {
        const summary = {
            total: 0,
            byCategory: {},
            byType: {}
        };

        wallets.forEach(wallet => {
            summary.total += wallet.balance;

            if (!summary.byCategory[wallet.category]) {
                summary.byCategory[wallet.category] = 0;
            }
            summary.byCategory[wallet.category] += wallet.balance;

            if (!summary.byType[wallet.type]) {
                summary.byType[wallet.type] = 0;
            }
            summary.byType[wallet.type] += wallet.balance;
        });

        return summary;
    }
}

module.exports = WalletDTO;