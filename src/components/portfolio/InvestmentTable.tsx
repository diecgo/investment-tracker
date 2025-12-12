import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Edit2, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { SellInvestmentDialog } from "./SellInvestmentDialog";
import { EditInvestmentDialog } from "./EditInvestmentDialog";
import { fetchMultiplePrices, convertUsdToEur } from "@/lib/priceService";
import type { Investment } from "@/types";

export function InvestmentTable() {
    const investments = useStore(state => state.investments);
    const updateCurrentPrice = useStore(state => state.updateCurrentPrice);

    // Filter out active investments
    const activeInvestments = investments.filter(i => i.status === 'Active');

    const [sellInvestment, setSellInvestment] = useState<Investment | null>(null);
    const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState<string | null>(null);

    const handleRefreshPrices = async () => {
        if (activeInvestments.length === 0) return;

        setIsRefreshing(true);
        setRefreshStatus("Actualizando precios...");

        try {
            const results = await fetchMultiplePrices(
                activeInvestments.map(inv => ({ symbol: inv.symbol, type: inv.type }))
            );

            let successCount = 0;
            let errorCount = 0;

            for (const inv of activeInvestments) {
                const result = results.get(inv.symbol);
                if (result && result.price !== null) {
                    // Log for debugging
                    console.log(`${inv.symbol}: ${result.price} ${result.currency}`);

                    // Only convert if currency is USD
                    // EUR prices should be used directly
                    const priceInEur = result.currency === 'USD'
                        ? convertUsdToEur(result.price)
                        : result.price;

                    console.log(`${inv.symbol} final price: ${priceInEur} EUR`);
                    await updateCurrentPrice(inv.id, priceInEur);
                    successCount++;
                } else {
                    errorCount++;
                }
            }

            setRefreshStatus(`✓ ${successCount} actualizados${errorCount > 0 ? `, ${errorCount} errores` : ''}`);
            setTimeout(() => setRefreshStatus(null), 3000);
        } catch (error) {
            console.error('Error refreshing prices:', error);
            setRefreshStatus("Error al actualizar precios");
            setTimeout(() => setRefreshStatus(null), 3000);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Refresh Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshPrices}
                        disabled={isRefreshing || activeInvestments.length === 0}
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Actualizar Precios
                    </Button>
                    {refreshStatus && (
                        <span className="text-sm text-muted-foreground">{refreshStatus}</span>
                    )}
                </div>
                <span className="text-sm text-muted-foreground">
                    {activeInvestments.length} inversiones activas
                </span>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Símbolo</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Compra</TableHead>
                            <TableHead className="text-right">Total Invertido</TableHead>
                            <TableHead className="text-right w-[150px]">Precio Actual</TableHead>
                            <TableHead className="text-right">Valor Actual</TableHead>
                            <TableHead className="text-right">Beneficio</TableHead>
                            <TableHead className="text-right">TAE Anual</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeInvestments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                    No hay inversiones activas. Añade una para empezar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            activeInvestments.map((inv) => {
                                const currentPrice = inv.currentPrice ?? inv.buyPrice;
                                const currentValue = inv.quantity * currentPrice;
                                const profit = currentValue - inv.totalInvested;
                                const profitPercent = inv.totalInvested > 0
                                    ? ((currentValue - inv.totalInvested) / inv.totalInvested) * 100
                                    : 0;
                                const isPositive = profit >= 0;

                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.symbol}</TableCell>
                                        <TableCell>{inv.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                                                {inv.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">{Number(inv.quantity).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.buyPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.totalInvested)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                <Input
                                                    key={`price-${inv.id}-${inv.currentPrice}`}
                                                    type="number"
                                                    step="any"
                                                    className="h-8 w-24 text-right"
                                                    defaultValue={inv.currentPrice ?? ""}
                                                    placeholder={inv.buyPrice.toString()}
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val)) {
                                                            updateCurrentPrice(inv.id, val);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = parseFloat((e.target as HTMLInputElement).value);
                                                            if (!isNaN(val)) {
                                                                updateCurrentPrice(inv.id, val);
                                                                (e.target as HTMLElement).blur();
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(currentValue)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className={`flex flex-col items-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                <span className="font-bold whitespace-nowrap">
                                                    {isPositive ? '+' : ''}{formatCurrency(profit)}
                                                </span>
                                                <span className="text-xs flex items-center">
                                                    {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                                    {profitPercent.toFixed(2)}%
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(() => {
                                                const purchaseDate = new Date(inv.purchaseDate);
                                                const today = new Date();
                                                const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                if (diffDays === 0 || inv.totalInvested === 0) return <span className="text-muted-foreground">-</span>;

                                                const years = diffDays / 365.25;
                                                if (currentValue <= 0) return <span className="text-red-600">-100%</span>;

                                                const cagr = (Math.pow(currentValue / inv.totalInvested, 1 / years) - 1) * 100;

                                                if (!isFinite(cagr) || cagr > 10000 || cagr < -100) return <span className="text-muted-foreground">-</span>;

                                                return (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xs font-semibold ${cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {cagr.toFixed(2)}%
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ({diffDays} días)
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center space-x-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditInvestment(inv)}
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSellInvestment(inv)}
                                                >
                                                    Vender
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                <SellInvestmentDialog
                    isOpen={!!sellInvestment}
                    onClose={() => setSellInvestment(null)}
                    investment={sellInvestment}
                />

                <EditInvestmentDialog
                    isOpen={!!editInvestment}
                    onClose={() => setEditInvestment(null)}
                    investment={editInvestment}
                />
            </div>
        </div>
    );
}
