import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { Investment, InvestmentType } from "@/types";
import { ArrowRightLeft } from "lucide-react";

interface EditInvestmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    investment: Investment | null;
}

export function EditInvestmentDialog({ isOpen, onClose, investment }: EditInvestmentDialogProps) {
    const updateInvestment = useStore(state => state.updateInvestment);

    const [name, setName] = useState("");
    const [type, setType] = useState<InvestmentType>("Stock");

    // Logic for "Correction Mode"
    // Users might want to just fix the Price, or the Quantity.
    // We'll keep the same calculator logic as Add Investment for convenience.

    const [inputMode, setInputMode] = useState<"standard" | "capital">("capital");

    const [quantity, setQuantity] = useState<string>("");
    const [buyPrice, setBuyPrice] = useState<string>("");
    const [totalInvested, setTotalInvested] = useState<string>("");
    const [date, setDate] = useState("");

    // Currency Conversion State
    const [isForeignCurrency, setIsForeignCurrency] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<string>("0.85");

    useEffect(() => {
        if (investment && isOpen) {
            setName(investment.name);
            setType(investment.type);
            setQuantity(investment.quantity.toString());
            setBuyPrice(investment.buyPrice.toString());
            setTotalInvested(investment.totalInvested.toString());
            setDate(investment.purchaseDate);
            // We don't save exchange rate history, so default "false" or assume EUR.
            setIsForeignCurrency(false);
        }
    }, [investment, isOpen]);

    // Auto-calculation effect
    useEffect(() => {
        if (!isOpen) return;

        const price = Number(buyPrice);
        const rate = isForeignCurrency ? Number(exchangeRate) : 1;
        const total = Number(totalInvested);
        const qty = Number(quantity);

        if (inputMode === "capital") {
            if (total && price && !isNaN(total) && !isNaN(price) && price !== 0 && rate !== 0) {
                // Avoid infinite loops by checking if difference is significant
                const calculatedQty = total / (price * rate);
                if (Math.abs(calculatedQty - qty) > 0.000001) {
                    setQuantity(calculatedQty.toString());
                }
            }
        } else {
            if (qty && price && !isNaN(qty) && !isNaN(price)) {
                const calculatedTotal = qty * price * rate;
                if (Math.abs(calculatedTotal - total) > 0.01) {
                    setTotalInvested(calculatedTotal.toString());
                }
            }
        }
    }, [totalInvested, buyPrice, quantity, inputMode, isForeignCurrency, exchangeRate, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!investment || !quantity || !buyPrice) return;

        const rate = isForeignCurrency ? Number(exchangeRate) : 1;
        const finalBuyPriceEUR = Number(buyPrice) * rate;
        const finalTotalInvestedEUR = Number(totalInvested) || (Number(quantity) * finalBuyPriceEUR);

        updateInvestment(investment.id, {
            name,
            type,
            quantity: Number(quantity),
            buyPrice: finalBuyPriceEUR,
            totalInvested: finalTotalInvestedEUR,
            purchaseDate: date,
        });

        onClose();
    };

    if (!investment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar ${investment.symbol}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-type">Tipo</Label>
                        <Select id="edit-type" value={type} onChange={(e: any) => setType(e.target.value as InvestmentType)}>
                            <option value="Stock">Acciones</option>
                            <option value="Crypto">Criptomonedas</option>
                            <option value="Fund">Fondos</option>
                            <option value="ETF">ETF</option>
                            <option value="Bond">Bonos</option>
                            <option value="Other">Otros</option>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-date">Fecha Compra</Label>
                        <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre</Label>
                    <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="flex items-center space-x-4 border-t border-b py-2">
                    <span className="text-sm font-medium">Modo:</span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={inputMode === "capital" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("capital")}
                        >
                            Por Capital (EUR)
                        </Button>
                        <Button
                            type="button"
                            variant={inputMode === "standard" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setInputMode("standard")}
                        >
                            Por Cantidad
                        </Button>
                    </div>
                </div>

                {/* Currency Converter Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-200">
                    <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="edit-currency-toggle" className="cursor-pointer">Operación en USD?</Label>
                    </div>
                    <input
                        id="edit-currency-toggle"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={isForeignCurrency}
                        onChange={(e) => setIsForeignCurrency(e.target.checked)}
                    />
                </div>

                {isForeignCurrency && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="edit-exchangeRate">Tasa de Cambio (USD/EUR)</Label>
                        <Input
                            id="edit-exchangeRate"
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
                        <Label htmlFor="edit-buyPrice">Precio Compra ({isForeignCurrency ? 'USD' : 'EUR'})</Label>
                        <Input
                            id="edit-buyPrice"
                            type="number"
                            step="any"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            required
                        />
                    </div>

                    {inputMode === "capital" ? (
                        <div className="space-y-2">
                            <Label htmlFor="edit-totalInvested">Total a Invertir (EUR)</Label>
                            <Input
                                id="edit-totalInvested"
                                type="number"
                                step="any"
                                value={totalInvested}
                                onChange={(e) => setTotalInvested(e.target.value)}
                                required
                            />
                            {quantity && <p className="text-xs text-muted-foreground">≈ {Number(quantity).toFixed(6)} unidades</p>}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="edit-quantity">Cantidad</Label>
                            <Input
                                id="edit-quantity"
                                type="number"
                                step="any"
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
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            </form>
        </Modal>
    );
}
