import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PieChart, Briefcase, DollarSign, Banknote } from "lucide-react";

export function SummaryCards() {
    const investments = useStore(state => state.investments);
    const capital = useStore(state => state.capital);

    const activeInvestments = investments.filter(i => i.status === 'Active');

    // Calculate total invested (sum of all purchase amounts)
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.totalInvested, 0);

    // Calculate current value of investments
    const currentInvestmentValue = activeInvestments.reduce((sum, inv) => {
        const price = inv.currentPrice ?? inv.buyPrice;
        return sum + (inv.quantity * price);
    }, 0);

    // Capital Total = Capital disponible + Valor actual de inversiones
    const capitalTotal = capital + currentInvestmentValue;

    // Capital inicial aportado = Capital disponible + Total Invertido
    const capitalAportado = capital + totalInvested;

    // Porcentaje de cambio del capital total respecto al aportado
    const capitalChangePercent = capitalAportado > 0
        ? ((capitalTotal - capitalAportado) / capitalAportado) * 100
        : 0;
    const isCapitalPositive = capitalChangePercent >= 0;

    // Beneficio/Pérdida
    const profitLoss = currentInvestmentValue - totalInvested;
    const profitLossPercent = totalInvested > 0
        ? ((currentInvestmentValue - totalInvested) / totalInvested) * 100
        : 0;
    const isProfit = profitLoss >= 0;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Capital Total */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Capital Total</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(capitalTotal)}</div>
                    <p className={`text-xs flex items-center gap-1 ${isCapitalPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isCapitalPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isCapitalPositive ? '+' : ''}{capitalChangePercent.toFixed(2)}%
                    </p>
                </CardContent>
            </Card>

            {/* Capital Disponible */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Capital Disponible</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(capital)}</div>
                    <p className="text-xs text-muted-foreground">
                        Para invertir
                    </p>
                </CardContent>
            </Card>

            {/* Total Invertido */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    <p className="text-xs text-muted-foreground">
                        En posiciones
                    </p>
                </CardContent>
            </Card>

            {/* Valor Actual Inversiones */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Inversiones</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg md:text-2xl font-bold">{formatCurrency(currentInvestmentValue)}</div>
                    <p className={`text-xs flex items-center gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                    </p>
                </CardContent>
            </Card>

            {/* Beneficio/Pérdida */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Beneficio/Pérdida</CardTitle>
                    {isProfit ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                </CardHeader>
                <CardContent>
                    <div className={`text-lg md:text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                    </div>
                    <p className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                    </p>
                </CardContent>
            </Card>

            {/* Inversiones Activas */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posiciones</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg md:text-2xl font-bold">{activeInvestments.length}</div>
                    <p className="text-xs text-muted-foreground">
                        Activas
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
