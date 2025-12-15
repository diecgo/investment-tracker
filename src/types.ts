export type InvestmentType = 'Stock' | 'Crypto' | 'Fund' | 'ETF' | 'Bond' | 'Other';
export type InvestmentStatus = 'Active' | 'Sold' | 'Simulation';

export interface Investment {
    id: string;
    symbol: string; // e.g., AAPL, BTC
    name: string;
    type: InvestmentType;
    quantity: number;
    buyPrice: number; // Price per unit at purchase
    currentPrice: number | null; // Manually updated current price
    totalInvested: number; // quantity * buyPrice (or manual input if rounding needed)
    purchaseDate: string; // ISO date
    status: InvestmentStatus;
    notes?: string;
}

export type TransactionType = 'Buy' | 'Sell' | 'Deposit' | 'Withdraw' | 'Adjustment';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number; // Currency amount
    date: string; // ISO date
    investmentId?: string; // Link to an investment if Buy/Sell
    pricePerUnit?: number; // For Buy/Sell
    quantity?: number; // For Buy/Sell
    description?: string;
}

export interface PortfolioSummary {
    totalInvested: number;
    currentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    availableCapital: number;
}

export interface DailyMetrics {
    dailyProfit: number; // Value change today
    topWinners: { symbol: string, change: number, changePercent: number }[];
    topLosers: { symbol: string, change: number, changePercent: number }[];
}

export interface DailyReport {
    id: string;
    date: string;
    totalInvested: number;
    currentValue: number;
    metrics: DailyMetrics;
    operations: Transaction[]; // Subset of transactions from that day
}
