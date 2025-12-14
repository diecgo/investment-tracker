import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Ghost } from "lucide-react";
import { useState } from "react";
import { EditInvestmentDialog } from "@/components/portfolio/EditInvestmentDialog";
import type { Investment } from "@/types";

export default function SimulationPage() {
    const { investments, deleteSimulation, updateCurrentPrice } = useStore();
    const [editInvestment, setEditInvestment] = useState<Investment | null>(null);

    // Filter only simulations
    const simulations = investments.filter(i => i.status === 'Simulation');

    // Calculate hypothetical totals
    const totalInvested = simulations.reduce((sum, i) => sum + i.totalInvested, 0);
    const currentValue = simulations.reduce((sum, i) => {
        const price = i.currentPrice ?? i.buyPrice;
        return sum + (i.quantity * price);
    }, 0);
    const profitLoss = currentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de borrar esta simulación?")) {
            await deleteSimulation(id);
        }
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Ghost className="h-6 w-6 md:h-8 md:w-8 text-indigo-500" />
                    Simulaciones
                </h2>
                <div className="flex items-center space-x-2">
                    {/* Could add a specific "Add Simulation" button here if needed, 
                        or rely on the main "Add" button with checkbox */}
                </div>
            </div>

            {/* Simulation Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Inversión Simulada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg md:text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Valor Actual (Simulado)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg md:text-2xl font-bold">{formatCurrency(currentValue)}</div>
                    </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium">Beneficio / Pérdida</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-lg md:text-2xl font-bold ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)}
                        </div>
                        <p className={`text-xs ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profitLoss >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cartera Simulada</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Símbolo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                                <TableHead className="text-right">Precio Compra</TableHead>
                                <TableHead className="text-right">Precio Actual</TableHead>
                                <TableHead className="text-right">Total Invertido</TableHead>
                                <TableHead className="text-right">Valor Actual</TableHead>
                                <TableHead className="text-right">P/L %</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {simulations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No hay simulaciones activas.
                                        <br />
                                        Añade una nueva inversión y marca la casilla "Es Simulación".
                                    </TableCell>
                                </TableRow>
                            ) : (
                                simulations.map((item) => {
                                    const currentPrice = item.currentPrice ?? item.buyPrice;
                                    const currentValue = item.quantity * currentPrice;
                                    const pl = currentValue - item.totalInvested;
                                    const plPercent = item.totalInvested > 0 ? (pl / item.totalInvested) * 100 : 0;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.symbol}</TableCell>
                                            <TableCell>{item.type}</TableCell>
                                            <TableCell className="text-right">{item.quantity.toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.buyPrice)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <Input
                                                        key={`price-${item.id}-${item.currentPrice}`}
                                                        type="number"
                                                        step="any"
                                                        className="h-8 w-20 text-right"
                                                        defaultValue={item.currentPrice ?? ""}
                                                        placeholder={item.buyPrice.toString()}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val)) {
                                                                updateCurrentPrice(item.id, val);
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = parseFloat((e.target as HTMLInputElement).value);
                                                                if (!isNaN(val)) {
                                                                    updateCurrentPrice(item.id, val);
                                                                    (e.target as HTMLElement).blur();
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.totalInvested)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(currentValue)}</TableCell>
                                            <TableCell className={`text-right font-bold ${pl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                {plPercent > 0 ? "+" : ""}{plPercent.toFixed(2)}%
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setEditInvestment(item)}
                                                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditInvestmentDialog
                isOpen={!!editInvestment}
                onClose={() => setEditInvestment(null)}
                investment={editInvestment}
            />
        </div>
    );
}
