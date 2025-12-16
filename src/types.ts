export type InvestmentType = 'Stock' | 'Crypto' | 'Fund' | 'ETF' | 'Bond' | 'Other';
export type InvestmentStatus = 'Active' | 'Sold' | 'Simulation';

export interface Investment {
    id: string;
    symbol: string; // e.g., AAPL, BTC
    name: string;
    type: InvestmentType;
    quantity: number;
    buyPrice: number; // Price per unit at purchase (EUR)
    currentPrice: number | null; // Manually updated current price (EUR)
    totalInvested: number; // quantity * buyPrice (EUR)
    purchaseDate: string; // ISO date
    status: InvestmentStatus;
    notes?: string;

    // Multi-Currency Support
    currency: string; // 'EUR', 'USD', etc.
    buyPriceOriginal?: number; // Price in original currency
    exchangeRateOpening?: number; // Rate at purchase
    exchangeRateCurrent?: number; // Rate now
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
