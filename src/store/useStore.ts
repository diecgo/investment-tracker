import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Investment, Transaction } from '../types';

interface StoreState {
    investments: Investment[];
    capital: number;
    username: string | null;
    transactions: Transaction[];
    isLoading: boolean;

    // Actions
    fetchAllData: () => Promise<void>;
    addCapital: (amount: number, date: string, description?: string) => Promise<void>;
    withdrawCapital: (amount: number, date: string, description?: string) => Promise<void>;

    addInvestment: (
        investment: Omit<Investment, 'id' | 'currentPrice'>
    ) => Promise<void>;

    sellInvestment: (
        investmentId: string,
        sellPrice: number,
        quantity: number,
        date: string
    ) => Promise<void>;

    updateInvestment: (
        id: string,
        data: Partial<Omit<Investment, 'id'>>
    ) => Promise<void>;

    updateCurrentPrice: (id: string, price: number) => Promise<void>;

    deleteSimulation: (id: string) => Promise<void>;

    // Helpers
    getSummary: () => {
        totalInvested: number;
        currentValue: number;
        totalProfitLoss: number;
        availableCapital: number;
        unrealizedPL: number;
    };
}

export const useStore = create<StoreState>((set, get) => ({
    investments: [],
    capital: 0,
    username: null,
    transactions: [],
    isLoading: false,

    fetchAllData: async () => {
        set({ isLoading: true });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [investmentsRes, profilesRes, transactionsRes] = await Promise.all([
                supabase.from('investments').select('*'),
                supabase.from('profiles').select('capital, username').eq('id', user.id).single(),
                supabase.from('transactions').select('*').order('created_at', { ascending: false })
            ]);

            // Map DB snake_case to TS camelCase if needed, but for simplicity we used matching names in SQL mostly.
            // Wait, SQL uses snake_case column names (user_id, buy_price etc). We need to map them or use camelCase in SQL?
            // Pro Tip: Supabase JS client returns object keys exactly as in DB.
            // My SQL used: symbol, name, type, quantity, buy_price, current_price, total_invested, purchase_date, status, notes
            // My TS Investment type uses camelCase: buyPrice, currentPrice...
            // I MUST map them.

            const investments = (investmentsRes.data || []).map((i: any) => ({
                id: i.id,
                symbol: i.symbol,
                name: i.name,
                type: i.type,
                quantity: Number(i.quantity),
                buyPrice: Number(i.buy_price),
                currentPrice: i.current_price ? Number(i.current_price) : null,
                totalInvested: Number(i.total_invested),
                purchaseDate: i.purchase_date,
                status: i.status,
                notes: i.notes
            }));

            const transactions = (transactionsRes.data || []).map((t: any) => ({
                id: t.id,
                type: t.type,
                amount: Number(t.amount),
                date: t.date,
                investmentId: t.investment_id,
                pricePerUnit: t.price_per_unit ? Number(t.price_per_unit) : undefined,
                quantity: t.quantity ? Number(t.quantity) : undefined,
                description: t.description
            }));

            set({
                investments,
                capital: profilesRes.data ? Number(profilesRes.data.capital) : 0,
                username: profilesRes.data ? profilesRes.data.username : null,
                transactions,
                isLoading: false
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            set({ isLoading: false });
        }
    },

    addCapital: async (amount, date, description) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Insert Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'Deposit',
            amount: amount,
            date: date,
            description: description || 'Capital Deposit'
        });

        // 2. Update Profile Capital
        const currentCapital = get().capital;
        const newCapital = currentCapital + amount;

        // Profiles might not exist if trigger failed? We rely on trigger. 
        // Or upsert.
        await supabase.from('profiles').upsert({ id: user.id, capital: newCapital });

        get().fetchAllData(); // Refresh state
    },

    withdrawCapital: async (amount, date, description) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'Withdraw',
            amount: amount,
            date: date,
            description: description || 'Capital Withdrawal'
        });

        const currentCapital = get().capital;
        await supabase.from('profiles').update({ capital: currentCapital - amount }).eq('id', user.id);

        get().fetchAllData();
    },

    addInvestment: async (invData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isSimulation = invData.status === 'Simulation';
        const cost = invData.totalInvested;

        // 1. Insert Investment
        const { data: inv, error } = await supabase.from('investments').insert({
            user_id: user.id,
            symbol: invData.symbol,
            name: invData.name,
            type: invData.type,
            quantity: invData.quantity,
            buy_price: invData.buyPrice,
            current_price: invData.buyPrice,
            total_invested: invData.totalInvested,
            purchase_date: invData.purchaseDate,
            status: isSimulation ? 'Simulation' : 'Active', // Allow setting Simulation
            notes: invData.notes
        }).select().single();

        if (error) { console.error(error); return; }

        // STOP HERE if Simulation (No Transacton, No Capital Change)
        if (isSimulation) {
            get().fetchAllData();
            return;
        }

        // 2. Log Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'Buy',
            amount: cost,
            date: invData.purchaseDate,
            investment_id: inv.id,
            price_per_unit: invData.buyPrice,
            quantity: invData.quantity,
            description: `Buy ${invData.symbol}`
        });

        // 3. Deduct Capital
        const currentCapital = get().capital;
        await supabase.from('profiles').update({ capital: currentCapital - cost }).eq('id', user.id);

        get().fetchAllData();
    },

    sellInvestment: async (id, sellPrice, quantity, date) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const investment = get().investments.find(i => i.id === id);
        if (!investment) return;

        const saleValue = sellPrice * quantity;

        // 1. Log Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'Sell',
            amount: saleValue,
            date: date,
            investment_id: id,
            price_per_unit: sellPrice,
            quantity: quantity,
            description: `Sell ${investment.symbol}`
        });

        // 2. Update Investment Status/Quantity
        if (quantity >= investment.quantity) {
            await supabase.from('investments')
                .update({ status: 'Sold', quantity: 0 })
                .eq('id', id);
        } else {
            const newQty = investment.quantity - quantity;
            const newTotalInvested = newQty * investment.buyPrice; // Reduce cost basis proportionally? Or keep original?
            // Simple approach: reduce proportionally
            await supabase.from('investments')
                .update({ quantity: newQty, total_invested: newTotalInvested })
                .eq('id', id);
        }

        // 3. Add to Capital
        const currentCapital = get().capital;
        await supabase.from('profiles').update({ capital: currentCapital + saleValue }).eq('id', user.id);

        get().fetchAllData();
    },

    updateInvestment: async (id, data) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const investment = get().investments.find(i => i.id === id);
        if (!investment) return;

        const oldTotalInvested = investment.totalInvested;
        let newTotalInvested = oldTotalInvested;

        // Determine new values for DB update
        const updatePayload: any = {};
        if (data.name) updatePayload.name = data.name;
        if (data.type) updatePayload.type = data.type;
        if (data.purchaseDate) updatePayload.purchase_date = data.purchaseDate; // Map to snake_case
        if (data.quantity !== undefined) updatePayload.quantity = data.quantity;
        if (data.buyPrice !== undefined) updatePayload.buy_price = data.buyPrice;

        // Calculate capital adjustment logic
        if (data.totalInvested !== undefined) {
            newTotalInvested = data.totalInvested;
            updatePayload.total_invested = newTotalInvested;
        } else if (data.quantity !== undefined || data.buyPrice !== undefined) {
            const q = data.quantity ?? investment.quantity;
            const p = data.buyPrice ?? investment.buyPrice;
            newTotalInvested = q * p;
            updatePayload.total_invested = newTotalInvested;
        }

        const capitalDiff = oldTotalInvested - newTotalInvested;

        // 1. Update Investment
        await supabase.from('investments').update(updatePayload).eq('id', id);

        // 2. Log Adjustment & Update Capital if needed
        if (Math.abs(capitalDiff) > 0.01) {
            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'Adjustment',
                amount: capitalDiff,
                date: new Date().toISOString().split('T')[0],
                investment_id: id,
                description: `Correction for ${investment.symbol}: ${capitalDiff > 0 ? 'Refund' : 'Charge'}`
            });

            const currentCapital = get().capital;
            await supabase.from('profiles').update({ capital: currentCapital + capitalDiff }).eq('id', user.id);
        }

        get().fetchAllData();
    },

    updateCurrentPrice: async (id, price) => {
        // Just local optimistic update? NO, save to DB so it persists across devices.
        // It's a "current_price" column in investments table.
        await supabase.from('investments').update({ current_price: price }).eq('id', id);

        // Optimistic update locally for speed
        set((state) => ({
            investments: state.investments.map(inv =>
                inv.id === id ? { ...inv, currentPrice: price } : inv
            )
        }));
    },

    deleteSimulation: async (id) => {
        // Simple delete for simulations
        await supabase.from('investments').delete().eq('id', id);

        // Optimistic update
        set((state) => ({
            investments: state.investments.filter(i => i.id !== id)
        }));
    },


    getSummary: () => {
        const state = get();
        // Filter out simulations AND Sold items for the main dashboard summary
        const activeInvestments = state.investments.filter(i => i.status === 'Active');

        const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);
        const currentValue = activeInvestments.reduce((sum, inv) => {
            const price = inv.currentPrice ?? inv.buyPrice;
            return sum + (inv.quantity * price);
        }, 0);

        const unrealizedPL = currentValue - totalInvested;

        return {
            totalInvested,
            currentValue,
            totalProfitLoss: unrealizedPL,
            unrealizedPL,
            availableCapital: state.capital
        };
    }
}));
