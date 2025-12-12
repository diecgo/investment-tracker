import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7300'];

// Spanish translations for investment types
const TYPE_LABELS: Record<string, string> = {
    'Stock': 'Acciones',
    'Crypto': 'Cripto',
    'Fund': 'Fondos',
    'ETF': 'ETF',
    'Bond': 'Bonos',
    'Other': 'Otros'
};

type ViewMode = 'type' | 'symbol';

export function AllocationChart() {
    const investments = useStore(state => state.investments);
    const [viewMode, setViewMode] = useState<ViewMode>('type');

    const activeInvestments = investments.filter(i => i.status === 'Active');

    // Group investments by selected mode
    const chartData = activeInvestments.reduce((acc, inv) => {
        const currentPrice = inv.currentPrice ?? inv.buyPrice;
        const value = inv.quantity * currentPrice;

        const key = viewMode === 'type' ? inv.type : inv.symbol;
        const label = viewMode === 'type'
            ? (TYPE_LABELS[inv.type] || inv.type)
            : `${inv.symbol} (${inv.name})`;

        const existing = acc.find(d => d.key === key);
        if (existing) {
            existing.value += value;
        } else {
            acc.push({ key, name: label, value });
        }
        return acc;
    }, [] as { key: string; name: string; value: number }[]);

    if (chartData.length === 0) {
        return (
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Distribución</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No hay inversiones activas
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Distribución</CardTitle>
                <div className="flex gap-1">
                    <Button
                        variant={viewMode === 'type' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('type')}
                    >
                        Por Tipo
                    </Button>
                    <Button
                        variant={viewMode === 'symbol' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('symbol')}
                    >
                        Por Activo
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => {
                                    const displayName = name ?? '';
                                    return `${displayName.length > 10 ? displayName.slice(0, 10) + '...' : displayName} ${((percent ?? 0) * 100).toFixed(0)}%`;
                                }}
                                labelLine={false}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
