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

    useEffect(() => {
        if (investment && isOpen) {
            setQuantity(investment.quantity.toString());
            setSellPrice(investment.currentPrice ? investment.currentPrice.toString() : investment.buyPrice.toString());
        }
    }, [investment, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!investment || !quantity || !sellPrice) return;

        sellInvestment(investment.id, Number(sellPrice), Number(quantity), date);
        onClose();
    };

    if (!investment) return null;

    const totalSale = Number(quantity) * Number(sellPrice);
    const costBasis = Number(quantity) * investment.buyPrice;
    const profit = totalSale - costBasis;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vender ${investment.symbol}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha Venta</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad a Vender</Label>
                        <Input
                            id="quantity"
                            type="number"
                            step="any"
                            max={investment.quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Máx: {investment.quantity}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellPrice">Precio Venta (Unitario)</Label>
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

                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Total Venta:</span>
                        <span className="font-bold">{formatCurrency(totalSale)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Beneficio Estimado:</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit)}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
                    <Button type="submit" variant="destructive">Confirmar Venta</Button>
                </div>
            </form>
        </Modal>
    );
}
