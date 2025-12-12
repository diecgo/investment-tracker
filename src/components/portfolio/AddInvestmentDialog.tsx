import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { InvestmentType } from "@/types";
import { ArrowRightLeft } from "lucide-react";

interface AddInvestmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddInvestmentDialog({ isOpen, onClose }: AddInvestmentDialogProps) {
    const addInvestment = useStore(state => state.addInvestment);

    const [symbol, setSymbol] = useState("");
    const [name, setName] = useState("");
    const [type, setType] = useState<InvestmentType>("Stock");

    // Input modes: "Quantity & Price" or "Total Invested & Price"
    const [inputMode, setInputMode] = useState<"standard" | "capital">("capital");

    const [quantity, setQuantity] = useState<string>("");
    const [buyPrice, setBuyPrice] = useState<string>("");
    const [totalInvested, setTotalInvested] = useState<string>("");

    // Currency Conversion State
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<string>("0.85"); // Default example rate

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Auto-calculation effect
    useEffect(() => {
        const price = Number(buyPrice);
        const rate = isForeignCurrency ? Number(exchangeRate) : 1;
        const total = Number(totalInvested);
        const qty = Number(quantity);

        if (inputMode === "capital") {
            // User enters Total EUR -> Calculate Quantity
            // Total EUR = Qty * Price(Original) * Rate
            // Qty = Total EUR / (Price * Rate)
            if (total && price && !isNaN(total) && !isNaN(price) && price !== 0 && rate !== 0) {
                const calculatedQty = total / (price * rate);
                setQuantity(calculatedQty.toString());
            }
        } else {
            // User enters Quantity -> Calculate Total EUR
            // Total EUR = Qty * Price(Original) * Rate
            if (qty && price && !isNaN(qty) && !isNaN(price)) {
                const calculatedTotal = qty * price * rate;
                setTotalInvested(calculatedTotal.toString());
            }
        }
    }, [totalInvested, buyPrice, quantity, inputMode, isForeignCurrency, exchangeRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!symbol || !quantity || !buyPrice) return;

        const rate = isForeignCurrency ? Number(exchangeRate) : 1;
        // The stored buyPrice should be in EUR per unit
        // BuyPrice (EUR) = BuyPrice (Original) * Rate
        const finalBuyPriceEUR = Number(buyPrice) * rate;

        // Total Invested is already in EUR (if inputMode=capital) or calculated in EUR (if inputMode=standard)
        const finalTotalInvestedEUR = Number(totalInvested) || (Number(quantity) * finalBuyPriceEUR);

        addInvestment({
            symbol: symbol.toUpperCase(),
            name: name || symbol.toUpperCase(),
            type,
            quantity: Number(quantity),
            buyPrice: finalBuyPriceEUR,
            totalInvested: finalTotalInvestedEUR,
            purchaseDate: date,
            notes: isForeignCurrency ? `Bought in USD at rate ${rate}` : ""
        });

        // Reset and close
        setSymbol("");
        setName("");
        setQuantity("");
        setBuyPrice("");
        setTotalInvested("");
        setIsForeignCurrency(false);
        setExchangeRate("0.85");
        onClose();
    };

    const investments = useStore(state => state.investments);
    const existingSymbols = Array.from(new Set(investments.map(i => i.symbol)));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Añadir Inversión">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select id="type" value={type} onChange={(e: any) => setType(e.target.value as InvestmentType)}>
                            <option value="Stock">Acciones</option>
                            <option value="Crypto">Criptomonedas</option>
                            <option value="Fund">Fondos</option>
                            <option value="ETF">ETF</option>
                            <option value="Bond">Bonos</option>
                            <option value="Other">Otros</option>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha Compra</Label>
                        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="symbol">Símbolo/Ticker</Label>
                        <Input
                            id="symbol"
                            list="existing-symbols"
                            placeholder="AAPL, BTC..."
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            required
                        />
                        <datalist id="existing-symbols">
                            {existingSymbols.map(s => (
                                <option key={s} value={s} />
                            ))}
                        </datalist>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre (Opcional)</Label>
                        <Input id="name" placeholder="Apple Inc." value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>

                <div className="flex items-center space-x-4 border-t border-b py-2">
                    <span className="text-sm font-medium">Modo:</span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={inputMode === "capital" ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setInputMode("capital"); setQuantity(""); }}
                        >
                            Por Capital (EUR)
                        </Button>
                        <Button
                            type="button"
                            variant={inputMode === "standard" ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setInputMode("standard"); setTotalInvested(""); }}
                        >
                            Por Cantidad
                        </Button>
                    </div>
                </div>

                {/* Currency Converter Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="currency-toggle" className="cursor-pointer">Operación en USD?</Label>
                    </div>
                    <input
                        id="currency-toggle"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={isForeignCurrency}
                        onChange={(e) => setIsForeignCurrency(e.target.checked)}
                    />
                </div>

                {/* Exchange Rate Input - Only visible if active */}
                {isForeignCurrency && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="exchangeRate">Tasa de Cambio (USD/EUR)</Label>
                        <Input
                            id="exchangeRate"
                            type="number"
                            step="any"
                            placeholder="0.85"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            1 USD = {exchangeRate || '...'} EUR
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="buyPrice">
                            Precio Compra ({isForeignCurrency ? 'USD' : 'EUR'})
                        </Label>
                        <Input
                            id="buyPrice"
                            type="number"
                            step="any"
                            placeholder="150.00"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            required
                        />
                    </div>

                    {inputMode === "capital" ? (
                        <div className="space-y-2">
                            <Label htmlFor="totalInvested">Total a Invertir (EUR)</Label>
                            <Input
                                id="totalInvested"
                                type="number"
                                step="any"
                                placeholder="1000.00"
                                value={totalInvested}
                                onChange={(e) => setTotalInvested(e.target.value)}
                                required
                            />
                            {quantity && <p className="text-xs text-muted-foreground">≈ {Number(quantity).toFixed(6)} unidades</p>}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input
                                id="quantity"
                                type="number"
                                step="any"
                                placeholder="10"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                            {totalInvested && <p className="text-xs text-muted-foreground">≈ {Number(totalInvested).toFixed(2)} EUR</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
                    <Button type="submit">Guardar Inversión</Button>
                </div>
            </form>
        </Modal>
    );
}
