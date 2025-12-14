import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Edit2, RefreshCw, Loader2, ArrowUpDown, Check, X, Trash2, StickyNote } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useMemo } from "react";
import { SellInvestmentDialog } from "./SellInvestmentDialog";
import { EditInvestmentDialog } from "./EditInvestmentDialog";
import { fetchMultiplePrices, convertUsdToEur } from "@/lib/priceService";
import type { Investment } from "@/types";

export function InvestmentTable() {
    const investments = useStore(state => state.investments);
    const updateCurrentPrice = useStore(state => state.updateCurrentPrice);
    const deleteRealInvestment = useStore(state => state.deleteRealInvestment);

    // Filter out active investments
    const activeInvestments = investments.filter(i => i.status === 'Active');

    const [sellInvestment, setSellInvestment] = useState<Investment | null>(null);
    const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'invested' | 'profit' | 'tae' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [priceUpdateStatus, setPriceUpdateStatus] = useState<Record<string, 'success' | 'error' | null>>({});

    // Calculate values for each investment for sorting
    const investmentsWithCalculations = useMemo(() => {
        return activeInvestments.map(inv => {
            const currentPrice = inv.currentPrice ?? inv.buyPrice;
            const currentValue = inv.quantity * currentPrice;
            const profit = currentValue - inv.totalInvested;

            // Calculate TAE/CAGR
            const purchaseDate = new Date(inv.purchaseDate);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const years = diffDays / 365.25;
            let cagr = 0;
            if (years > 0 && inv.totalInvested > 0 && currentValue > 0) {
                cagr = (Math.pow(currentValue / inv.totalInvested, 1 / years) - 1) * 100;
                if (!isFinite(cagr) || cagr > 10000 || cagr < -100) cagr = 0;
            }

            return { ...inv, currentValue, profit, cagr, diffDays };
        });
    }, [activeInvestments]);

    // Apply sorting
    const sortedInvestments = useMemo(() => {
        const sorted = [...investmentsWithCalculations];
        sorted.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'invested':
                    comparison = a.totalInvested - b.totalInvested;
                    break;
                case 'profit':
                    comparison = a.profit - b.profit;
                    break;
                case 'tae':
                    comparison = a.cagr - b.cagr;
                    break;
                case 'date':
                    comparison = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
        return sorted;
    }, [investmentsWithCalculations, sortBy, sortOrder]);

    const handleSort = (field: 'invested' | 'profit' | 'tae' | 'date') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const handleRefreshPrices = async () => {
        if (activeInvestments.length === 0) return;

        setIsRefreshing(true);
        setRefreshStatus("Actualizando precios...");

        try {
            const results = await fetchMultiplePrices(
                activeInvestments.map(inv => ({ symbol: inv.symbol, type: inv.type }))
            );

            let successCount = 0;
            const failedSymbols: string[] = [];
            const successSymbols: string[] = [];

            for (const inv of activeInvestments) {
                const result = results.get(inv.symbol);
                if (result && result.price !== null) {
                    // Log for debugging
                    console.log(`✓ ${inv.symbol}: ${result.price} ${result.currency}`);

                    // Only convert if currency is USD
                    // EUR prices should be used directly
                    const priceInEur = result.currency === 'USD'
                        ? convertUsdToEur(result.price)
                        : result.price;

                    await updateCurrentPrice(inv.id, priceInEur);
                    successSymbols.push(inv.symbol);
                    successCount++;
                } else {
                    console.log(`✗ ${inv.symbol}: ${result?.error || 'Sin respuesta'}`);
                    failedSymbols.push(inv.symbol);
                }
            }

            // Build status message
            let statusMessage = `✓ ${successCount} actualizados`;
            if (failedSymbols.length > 0) {
                statusMessage += ` | ✗ Falló: ${failedSymbols.join(', ')}`;
            }

            // Update status map for visual indicators
            const newStatus: Record<string, 'success' | 'error' | null> = {};
            successSymbols.forEach(s => newStatus[s] = 'success');
            failedSymbols.forEach(s => newStatus[s] = 'error');
            setPriceUpdateStatus(newStatus);

            setRefreshStatus(statusMessage);

            // Clear text status message after a while, but keep icons visible
            setTimeout(() => setRefreshStatus(null), failedSymbols.length > 0 ? 10000 : 3000);
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
                            <TableHead
                                className="text-right cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Fecha Compra
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Compra</TableHead>
                            <TableHead
                                className="text-right cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('invested')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Total Invertido
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right w-[120px]">Precio Actual</TableHead>
                            <TableHead className="text-right">Valor Actual</TableHead>
                            <TableHead
                                className="text-right cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('profit')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    Beneficio
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="text-right cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort('tae')}
                            >
                                <div className="flex items-center justify-end gap-1">
                                    TAE Anual
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedInvestments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                                    No hay inversiones activas. Añade una para empezar.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedInvestments.map((inv) => {
                                const currentPrice = inv.currentPrice ?? inv.buyPrice;
                                const currentValue = inv.quantity * currentPrice;
                                const profit = currentValue - inv.totalInvested;
                                const profitPercent = inv.totalInvested > 0
                                    ? ((currentValue - inv.totalInvested) / inv.totalInvested) * 100
                                    : 0;
                                const isPositive = profit >= 0;

                                return (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {inv.symbol}
                                                {inv.notes && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <StickyNote className="h-4 w-4 text-yellow-500 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="max-w-xs">{inv.notes}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{inv.name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                                                {inv.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {new Date(inv.purchaseDate).toLocaleDateString('es-ES')}
                                        </TableCell>
                                        <TableCell className="text-right">{Number(inv.quantity).toLocaleString('es-ES', { maximumFractionDigits: 6 })}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.buyPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(inv.totalInvested)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-1">
                                                {priceUpdateStatus[inv.symbol] === 'success' && (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                )}
                                                {priceUpdateStatus[inv.symbol] === 'error' && (
                                                    <X className="h-4 w-4 text-red-500" />
                                                )}
                                                <Input
                                                    key={`price-${inv.id}-${inv.currentPrice}`}
                                                    type="number"
                                                    step="any"
                                                    className="h-8 w-20 text-right"
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
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm(`¿Estás seguro de ELIMINAR ${inv.symbol}? \n\nEsto borrará la inversión y devolverá el capital (${formatCurrency(inv.totalInvested)}) a tu cuenta.`)) {
                                                            deleteRealInvestment(inv.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Eliminar (Peligro)"
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
                    {activeInvestments.length > 0 && (() => {
                        // Calculate totals
                        const totals = activeInvestments.reduce((acc, inv) => {
                            const currentPrice = inv.currentPrice ?? inv.buyPrice;
                            const currentValue = inv.quantity * currentPrice;
                            return {
                                totalInvested: acc.totalInvested + inv.totalInvested,
                                totalValue: acc.totalValue + currentValue,
                            };
                        }, { totalInvested: 0, totalValue: 0 });

                        const totalProfit = totals.totalValue - totals.totalInvested;
                        const totalProfitPercent = totals.totalInvested > 0
                            ? ((totals.totalValue - totals.totalInvested) / totals.totalInvested) * 100
                            : 0;
                        const isTotalPositive = totalProfit >= 0;

                        // Calculate portfolio-level TAE using weighted average holding period
                        // This gives a single CAGR for the entire portfolio
                        let totalWeightedDays = 0;

                        for (const inv of activeInvestments) {
                            const purchaseDate = new Date(inv.purchaseDate);
                            const today = new Date();
                            const diffTime = Math.abs(today.getTime() - purchaseDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            // Weight days by the amount invested
                            totalWeightedDays += diffDays * inv.totalInvested;
                        }

                        const avgHoldingDays = totals.totalInvested > 0
                            ? totalWeightedDays / totals.totalInvested
                            : 0;
                        const avgHoldingYears = avgHoldingDays / 365.25;

                        // Calculate portfolio CAGR: (EndValue/StartValue)^(1/Years) - 1
                        let portfolioCagr = 0;
                        if (avgHoldingYears > 0 && totals.totalInvested > 0 && totals.totalValue > 0) {
                            portfolioCagr = (Math.pow(totals.totalValue / totals.totalInvested, 1 / avgHoldingYears) - 1) * 100;
                        }

                        // Handle edge cases
                        if (!isFinite(portfolioCagr) || portfolioCagr > 10000 || portfolioCagr < -100) {
                            portfolioCagr = 0;
                        }

                        return (
                            <TableFooter>
                                <TableRow className="bg-muted/50 font-semibold">
                                    <TableCell colSpan={5} className="text-right">TOTALES</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.totalInvested)}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-right">{formatCurrency(totals.totalValue)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className={`flex flex-col items-end ${isTotalPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            <span className="font-bold whitespace-nowrap">
                                                {isTotalPositive ? '+' : ''}{formatCurrency(totalProfit)}
                                            </span>
                                            <span className="text-xs flex items-center">
                                                {isTotalPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                                {totalProfitPercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`text-sm font-semibold ${portfolioCagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {portfolioCagr.toFixed(2)}%
                                        </span>
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        );
                    })()}
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
