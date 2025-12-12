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
    const investments = useStore(state => state.investments);

    // Filters state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    // Filter logic
    const filteredInvestments = investments.filter(inv => {
        const matchesType = typeFilter === "All" || inv.type === typeFilter;
        const matchesStatus = statusFilter === "All" ||
            (statusFilter === "Active" ? inv.status === "Active" : inv.status === "Sold");

        let matchesDate = true;
        if (startDate) matchesDate = matchesDate && inv.purchaseDate >= startDate;
        if (endDate) matchesDate = matchesDate && inv.purchaseDate <= endDate;

        return matchesType && matchesStatus && matchesDate;
    });

    // Accumulate View logic (group by Symbol)
    const accumulatedData = Object.values(filteredInvestments.reduce((acc, inv) => {
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

    const totalInvested = accumulatedData.reduce((sum, item) => sum + item.totalInvested, 0);
    const totalCurrentValue = accumulatedData.reduce((sum, item) => sum + item.currentValue, 0);
    const totalProfit = totalCurrentValue - totalInvested;
    const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Informes y Análisis</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Informe</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha Inicio</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Fin</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Inversión</Label>
                            <Select value={typeFilter} onChange={(e: any) => setTypeFilter(e.target.value)}>
                                <option value="All">Todos</option>
                                <option value="Stock">Acciones</option>
                                <option value="Crypto">Criptomonedas</option>
                                <option value="Fund">Fondos</option>
                                <option value="ETF">ETF</option>
                                <option value="Bond">Bonos</option>
                                <option value="Other">Otros</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Estado</Label>
                            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
                                <option value="All">Todos</option>
                                <option value="Active">Activas</option>
                                <option value="Sold">Vendidas</option>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary of Filtered Data */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumen General</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Invertido</p>
                            <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Actual</p>
                            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Beneficio Total</p>
                            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(totalProfit)}
                                <span className="text-sm ml-2 font-normal text-muted-foreground">
                                    ({totalProfitPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Inversiones Acumuladas</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Símbolo</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Cantidad Total</TableHead>
                                <TableHead className="text-right">Total Invertido</TableHead>
                                <TableHead className="text-right">Valor Actual</TableHead>
                                <TableHead className="text-right">Beneficio</TableHead>
                                <TableHead className="text-right">Operaciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accumulatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No hay datos que coincidan con los filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accumulatedData.map((item) => {
                                    const profit = item.currentValue - item.totalInvested;
                                    const profitPercent = (profit / item.totalInvested) * 100;
                                    const isPositive = profit >= 0;

                                    return (
                                        <TableRow key={item.symbol}>
                                            <TableCell className="font-medium">{item.symbol}</TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                                                    {item.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">{Number(item.quantity).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalInvested)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.currentValue)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className={`flex flex-col items-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    <span className="font-bold">{isPositive ? '+' : ''}{formatCurrency(profit)}</span>
                                                    <span className="text-xs">{profitPercent.toFixed(2)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.count}</TableCell>
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
