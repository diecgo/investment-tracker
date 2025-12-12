import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Wallet } from "lucide-react";

export default function CapitalPage() {
    const { capital, transactions, addCapital, withdrawCapital } = useStore();
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

    // Capital history = transactions of type Deposit or Withdraw
    const capitalHistory = transactions.filter(t => t.type === 'Deposit' || t.type === 'Withdraw');

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gestión de Capital</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Disponible</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(capital)}</div>
                        <p className="text-xs text-muted-foreground">
                            Sin invertir
                        </p>
                    </CardContent>
                </Card>

                <Card className="col-span-2 flex items-center p-6 bg-muted/50 border-dashed">
                    <div className="flex gap-4 w-full justify-end">
                        <Button onClick={() => setIsDepositOpen(true)} className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" /> Ingresar Fondos
                        </Button>
                        <Button onClick={() => setIsWithdrawOpen(true)} variant="destructive">
                            <Minus className="mr-2 h-4 w-4" /> Retirar Fondos
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Historial de Movimientos</h3>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Cantidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {capitalHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        No hay movimientos de capital registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                capitalHistory.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                                                ${tx.type === 'Deposit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {tx.type === 'Deposit' ? 'Ingreso' : 'Retirada'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{tx.description}</TableCell>
                                        <TableCell className={`text-right font-medium ${tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'Deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <CapitalDialog
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                type="Deposit"
                onSubmit={addCapital}
            />
            <CapitalDialog
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                type="Withdraw"
                onSubmit={withdrawCapital}
            />
        </div>
    );
}

function CapitalDialog({ isOpen, onClose, type, onSubmit }: {
    isOpen: boolean;
    onClose: () => void;
    type: 'Deposit' | 'Withdraw';
    onSubmit: (amount: number, date: string, description: string) => void;
}) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(Number(amount), date, description);
        setAmount("");
        setDescription("");
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'Deposit' ? "Ingresar Fondos" : "Retirar Fondos"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Cantidad</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="1000.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="desc">Descripción (Opcional)</Label>
                    <Input
                        id="desc"
                        placeholder={type === 'Deposit' ? "Ahorros mensuales" : "Gastos personales"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="mr-2">Cancelar</Button>
                    <Button type="submit" variant={type === 'Deposit' ? "default" : "destructive"}>
                        {type === 'Deposit' ? "Ingresar" : "Retirar"}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
