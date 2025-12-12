import { SummaryCards } from "./SummaryCards";
import { AllocationChart } from "./AllocationChart";
import { InvestmentTimeline } from "./InvestmentTimeline";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Spanish translations for transaction types
const TRANSACTION_LABELS: Record<string, string> = {
    'Deposit': 'Depósito de Capital',
    'Withdraw': 'Retirada de Capital',
    'Buy': 'Compra',
    'Sell': 'Venta',
    'Adjustment': 'Ajuste'
};

export default function Dashboard() {
    const transactions = useStore(state => state.transactions);

    // Get recent transactions (last 5)
    const recentTransactions = transactions.slice(0, 5);

    const getTransactionLabel = (t: typeof transactions[0]) => {
        if (t.description && !t.description.startsWith('Buy ') && !t.description.startsWith('Sell ')) {
            return t.description;
        }
        const baseLabel = TRANSACTION_LABELS[t.type] || t.type;
        // If it's a buy/sell, extract the symbol from description
        if ((t.type === 'Buy' || t.type === 'Sell') && t.description) {
            const symbol = t.description.replace('Buy ', '').replace('Sell ', '');
            return `${baseLabel} ${symbol}`;
        }
        return baseLabel;
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button>Descargar Informe</Button>
                </div>
            </div>

            <SummaryCards />

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <InvestmentTimeline />
                <AllocationChart />
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((t) => (
                                <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium text-sm">{getTransactionLabel(t)}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('es-ES')}</p>
                                    </div>
                                    <span className={`font-semibold ${['Deposit', 'Sell'].includes(t.type) ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {['Deposit', 'Sell'].includes(t.type) ? '+' : '-'}
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
