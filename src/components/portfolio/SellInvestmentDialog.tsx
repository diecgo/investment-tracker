import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import type { Investment } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SellInvestmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment | null;
}

export function SellInvestmentDialog({ isOpen, onClose, investment }: SellInvestmentDialogProps) {
    const sellInvestment = useStore(state => state.sellInvestment);

    const [quantity, setQuantity] = useState<string>("");
    const [sellPrice, setSellPrice] = useState<string>("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // const [inputMode, setInputMode] = useState<"quantity" | "value">("quantity");
    const [percentage, setPercentage] = useState<number | null>(null);

    // Currency state
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<string>("1");

    useEffect(() => {
        if (investment && isOpen) {
            setQuantity(investment.quantity.toString());
            // Default to ALL
            setPercentage(100);

            // Check currency
            if (investment.currency === 'USD') {
                setIsForeignCurrency(true);
                setExchangeRate(investment.exchangeRateCurrent?.toString() || "1");
                // If USD, try to show USD price
                if (investment.exchangeRateCurrent && investment.currentPrice) {
                    setSellPrice((investment.currentPrice / investment.exchangeRateCurrent).toFixed(2));
                } else {
                    setSellPrice(investment.currentPrice ? investment.currentPrice.toString() : investment.buyPrice.toString());
                }
            } else {
                setIsForeignCurrency(false);
                setExchangeRate("1");
                setSellPrice(investment.currentPrice ? investment.currentPrice.toString() : investment.buyPrice.toString());
            }
        }
    }, [investment, isOpen]);

    // Auto-calculate Value <-> Quantity
    // Logic kept simple: manual inputs or percentage buttons.
    // Future enhancement: Add "Sell by Value" input.
    useEffect(() => {
        // Placeholder for future bi-directional sync if needed.
    }, [quantity, sellPrice, exchangeRate]);

    const handlePercentageClick = (pct: number) => {
        if (!investment) return;
        setPercentage(pct);
        const newQty = investment.quantity * (pct / 100);
        setQuantity(newQty.toString());
        // setInputMode("quantity");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!investment || !quantity || !sellPrice) return;

        const qty = Number(quantity);
        const price = Number(sellPrice);
        const rate = isForeignCurrency ? Number(exchangeRate) : 1;

        // Convert Price to EUR for the store action
        const finalSellPriceEUR = price * rate;

        sellInvestment(investment.id, finalSellPriceEUR, qty, date);
        onClose();
    };

    if (!investment) return null;

    const rate = isForeignCurrency ? Number(exchangeRate) : 1;
    const totalSaleEUR = Number(quantity) * Number(sellPrice) * rate;
    // Cost Basis of the SOLD portion (in EUR)
    // investment.buyPrice is the unit buy price in EUR
    const costBasisEUR = Number(quantity) * investment.buyPrice;
    const profitEUR = totalSaleEUR - costBasisEUR;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vender ${investment.symbol}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha Venta</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                {/* Percentage Chips */}
                <div className="flex space-x-2 pb-2">
                    {[25, 50, 75, 100].map(pct => (
                        <Button
                            key={pct}
                            type="button"
                            variant={percentage === pct ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePercentageClick(pct)}
                            className="flex-1"
                        >
                            {pct}%
                        </Button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="any"
                            max={investment.quantity}
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                setPercentage(null);
                            }}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Disponible: {Number(investment.quantity).toLocaleString()}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellPrice">
                            Precio Venta ({isForeignCurrency ? 'USD' : 'EUR'})
                        </Label>
                        <Input
                            id="sellPrice"
                            type="number"
                            step="any"
                            value={sellPrice}
                            onChange={(e) => setSellPrice(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {isForeignCurrency && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded border">
                        <Label htmlFor="exchangeRate" className="text-xs">Tasa Cambio (USD/EUR)</Label>
                        <Input
                            id="exchangeRate"
                            type="number"
                            step="any"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                            className="h-8"
                        />
                    </div>
                )}

                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span>Total Venta (EUR):</span>
                        <span className="font-bold text-lg">{formatCurrency(totalSaleEUR)}</span>
                    </div>

                    {isForeignCurrency && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Total USD:</span>
                            <span>{(Number(quantity) * Number(sellPrice)).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                    )}

                    <div className="border-t pt-2 mt-2 flex justify-between">
                        <span>Beneficio Realizado:</span>
                        <span className={`font-bold ${profitEUR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profitEUR)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
                    <Button type="submit" variant="destructive">
                        {Number(quantity) >= investment.quantity ? "Vender Todo" : "Vender Parcialmente"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
