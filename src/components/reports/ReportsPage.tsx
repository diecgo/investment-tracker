import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

export default function ReportsPage() {
    const { investments, transactions } = useStore();

    // Filters state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("All");

    // 1. ACTIVE PORTFOLIO LOGIC
    // Filter only ACTIVE investments for the main view
    const activeInvestments = investments.filter(inv => {
        const matchesType = typeFilter === "All" || inv.type === typeFilter;
        const isActive = inv.status === "Active" && inv.quantity > 0;

        let matchesDate = true;
        // For active holdings, purchase date is relevant
        if (startDate) matchesDate = matchesDate && inv.purchaseDate >= startDate;
        if (endDate) matchesDate = matchesDate && inv.purchaseDate <= endDate;

        return matchesType && isActive && matchesDate;
    });

    // Accumulate Active Data (group by Symbol)
    const accumulatedActive = Object.values(activeInvestments.reduce((acc, inv) => {
        const key = inv.symbol;
        if (!acc[key]) {
            acc[key] = {
                symbol: inv.symbol,
                name: inv.name,
                type: inv.type,
                quantity: 0,
                totalInvested: 0,
                currentValue: 0,
                count: 0
            };
        }
        acc[key].quantity += inv.quantity;
        acc[key].totalInvested += inv.totalInvested;

        const currentPrice = inv.currentPrice ?? inv.buyPrice;
        acc[key].currentValue += inv.quantity * currentPrice;
        acc[key].count += 1;

        return acc;
    }, {} as Record<string, any>));

    const totalInvestedActive = accumulatedActive.reduce((sum, item) => sum + item.totalInvested, 0);
    const totalCurrentValueActive = accumulatedActive.reduce((sum, item) => sum + item.currentValue, 0);
    const totalUnrealizedProfit = totalCurrentValueActive - totalInvestedActive;
    const totalUnrealizedProfitPercent = totalInvestedActive > 0 ? (totalUnrealizedProfit / totalInvestedActive) * 100 : 0;

    // 2. REALIZED OPERATIONS LOGIC (Sales)
    // Filter transactions for sales
    const sellTransactions = transactions.filter(t => {
        const isSell = t.type === 'Sell';
        const investment = investments.find(i => i.id === t.investmentId);

        const matchesType = typeFilter === "All" || (investment ? investment.type === typeFilter : true);

        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && t.date >= startDate;
        if (endDate) matchesDate = matchesDate && t.date <= endDate;

        return isSell && matchesType && matchesDate;
    });

    // Calculate Realized P/L for each transaction
    const realizedOperations = sellTransactions.map(t => {
        const investment = investments.find(i => i.id === t.investmentId);
        // Fallback or find investment snapshot if possible. 
        // Note: 'investment' might have updated quantity=0 now, but 'buyPrice' is usually preserved as avg price.
        const buyPrice = investment ? investment.buyPrice : 0;
        const sellPrice = t.pricePerUnit || 0;
        const qty = t.quantity || 0;
        const costBasis = qty * buyPrice;
        const saleValue = t.amount;
        const profit = saleValue - costBasis;
        const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;

        return {
            id: t.id,
            date: t.date,
            symbol: investment?.symbol || 'Unknown',
            type: investment?.type || 'Unknown',
            quantity: qty,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
            costBasis: costBasis,
            saleValue: saleValue,
            profit: profit,
            profitPercent: profitPercent
        };
    });

    const totalRealizedProfit = realizedOperations.reduce((sum, op) => sum + op.profit, 0);


    const handleExportCSV = () => {
        // Create CSV headers for Active
        const rows = [];
        rows.push(['--- CARTERA ACTIVA ---']);
        rows.push(['Símbolo', 'Nombre', 'Tipo', 'Cantidad', 'Invertido', 'Valor Actual', 'Beneficio', 'Beneficio %'].join(','));

        accumulatedActive.forEach(item => {
            const profit = item.currentValue - item.totalInvested;
            const pct = item.totalInvested > 0 ? (profit / item.totalInvested) * 100 : 0;
            rows.push([
                item.symbol,
                `"${item.name}"`,
                item.type,
                item.quantity,
                item.totalInvested.toFixed(2),
                item.currentValue.toFixed(2),
                profit.toFixed(2),
                pct.toFixed(2) + '%'
            ].join(','));
        });

        rows.push([]);
        rows.push(['--- OPERACIONES REALIZADAS (VENTAS) ---']);
        rows.push(['Fecha', 'Símbolo', 'Cantidad', 'Precio Compra', 'Precio Venta', 'Coste Base', 'Valor Venta', 'Beneficio', 'Beneficio %'].join(','));

        realizedOperations.forEach(op => {
            rows.push([
                op.date,
                op.symbol,
                op.quantity,
                op.buyPrice.toFixed(2),
                op.sellPrice.toFixed(2),
                op.costBasis.toFixed(2),
                op.saleValue.toFixed(2),
                op.profit.toFixed(2),
                op.profitPercent.toFixed(2) + '%'
            ].join(','));
        });

        const csvContent = rows.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `informe_completo_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Informes de Rendimiento</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Desde</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Hasta</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Activo</Label>
                            <Select value={typeFilter} onChange={(e: any) => setTypeFilter(e.target.value)}>
                                <option value="All">Todos</option>
                                <option value="Stock">Acciones</option>
                                <option value="Crypto">Criptomonedas</option>
                                <option value="Fund">Fondos</option>
                                <option value="ETF">ETF</option>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Beneficio No Realizado (Latente)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalUnrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalUnrealizedProfit)}
                            <span className="text-sm ml-2 font-normal text-muted-foreground">
                                ({totalUnrealizedProfitPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Beneficio Realizado (Cerrado)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalRealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalRealizedProfit)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SECCION 1: CARTERA ACTIVA */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Cartera Actual (Activos)</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Símbolo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Invertido</TableHead>
                                <TableHead className="text-right">Valor Actual</TableHead>
                                <TableHead className="text-right">Bº Latente</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accumulatedActive.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                        No hay inversiones activas con estos filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accumulatedActive.map((item) => {
                                    const profit = item.currentValue - item.totalInvested;
                                    const pct = item.totalInvested > 0 ? (profit / item.totalInvested) * 100 : 0;
                                    const isPos = profit >= 0;
                                    return (
                                        <TableRow key={item.symbol}>
                                            <TableCell className="font-medium">{item.symbol}</TableCell>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell className="text-right">{Number(item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalInvested)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.currentValue)}</TableCell>
                                            <TableCell className={`text-right ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(profit)} ({pct.toFixed(2)}%)
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* SECCION 2: OPERACIONES REALIZADAS */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Operaciones Realizadas (Historial de Ventas)</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Símbolo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Precio Compra</TableHead>
                                <TableHead className="text-right">Precio Venta</TableHead>
                                <TableHead className="text-right">Valor Venta</TableHead>
                                <TableHead className="text-right">Bº Realizado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {realizedOperations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                        No hay ventas realizadas en este periodo.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                realizedOperations.map((op) => {
                                    const isPos = op.profit >= 0;
                                    return (
                                        <TableRow key={op.id}>
                                            <TableCell>{new Date(op.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-medium">{op.symbol}</TableCell>
                                            <TableCell className="text-right">{Number(op.quantity).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(op.buyPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(op.sellPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(op.saleValue)}</TableCell>
                                            <TableCell className={`text-right ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(op.profit)} ({op.profitPercent.toFixed(2)}%)
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
