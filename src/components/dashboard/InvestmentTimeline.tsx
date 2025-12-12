import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

export function InvestmentTimeline() {
    const transactions = useStore(state => state.transactions);

    // Build cumulative investment data from transactions
    const chartData = useMemo(() => {
        // Only count Buy transactions for invested capital
        // Deposits are for capital account, not invested amount
        const relevantTransactions = transactions
            .filter(t => t.type === 'Buy')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (relevantTransactions.length === 0) return [];

        let cumulative = 0;
        const data: { date: string; value: number; label: string }[] = [];

        relevantTransactions.forEach(t => {
            cumulative += t.amount;
            data.push({
                date: t.date,
                value: cumulative,
                label: new Date(t.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            });
        });

        return data;
    }, [transactions]);

    if (chartData.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Evolución del Capital</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No hay transacciones registradas
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Evolución del Capital</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [
                                    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value),
                                    'Capital Total'
                                ]}
                                labelFormatter={(label) => `Fecha: ${label}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#0088FE"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
