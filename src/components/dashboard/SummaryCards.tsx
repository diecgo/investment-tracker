import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";

export function SummaryCards() {
    const investments = useStore(state => state.investments);
    const capital = useStore(state => state.capital);

    const activeInvestments = investments.filter(i => i.status === 'Active');
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);
    const currentValue = activeInvestments.reduce((sum, inv) => {
        const price = inv.currentPrice ?? inv.buyPrice;
        return sum + (inv.quantity * price);
    }, 0);
    const totalProfitLoss = currentValue - totalInvested;
    const isProfit = totalProfitLoss >= 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invertido</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    <p className="text-xs text-muted-foreground">
                        En inversiones activas
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Actual</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(currentValue)}</div>
                    <p className="text-xs text-muted-foreground">
                        +0.00% desde compra (todo)
                    </p>
                </CardContent>
            </Card>

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
                    <div className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalProfitLoss)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        No realizado
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Capital Disponible</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(capital)}</div>
                    <p className="text-xs text-muted-foreground">
                        Para invertir
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
