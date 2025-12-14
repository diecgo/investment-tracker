import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

type CalculationMode = 'units' | 'amount';

type SpreadRating = {
    label: string;
    color: string;
    icon: any;
    description: string;
};

const getSpreadRating = (percent: number): SpreadRating => {
    if (percent <= 0.02) return {
        label: "Muy barato",
        color: "text-green-600 bg-green-50 border-green-200",
        icon: CheckCircle,
        description: "ETF muy líquido, entrada óptima"
    };
    if (percent <= 0.05) return {
        label: "Barato",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        icon: CheckCircle,
        description: "Normal / aceptable"
    };
    if (percent <= 0.10) return {
        label: "Regular",
        color: "text-yellow-600 bg-yellow-50 border-yellow-200",
        icon: AlertTriangle,
        description: "Se puede operar, pero mejor esperar"
    };
    if (percent <= 0.25) return {
        label: "Caro",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        icon: XCircle,
        description: "Evitar salvo necesidad"
    };
    return {
        label: "Muy caro",
        color: "text-red-600 bg-red-50 border-red-200",
        icon: XCircle,
        description: "No compensa (mejor otro ETF u horario)"
    };
};

export default function SpreadSimulator() {
    const [mode, setMode] = useState<CalculationMode>('units');
    const [buyPrice, setBuyPrice] = useState<string>("");
    const [sellPrice, setSellPrice] = useState<string>("");

    // This state holds either "units" or "total amount" depending on mode
    const [inputValue, setInputValue] = useState<string>("1");

    // Results
    const [spread, setSpread] = useState<number>(0);
    const [spreadPercent, setSpreadPercent] = useState<number>(0);

    // Calculated derived values
    const [calculatedUnits, setCalculatedUnits] = useState<number>(0);
    const [totalInvestment, setTotalInvestment] = useState<number>(0);
    const [spreadCost, setSpreadCost] = useState<number>(0);

    useEffect(() => {
        const buy = parseFloat(buyPrice) || 0;
        const sell = parseFloat(sellPrice) || 0;
        const inputVal = parseFloat(inputValue) || 0;

        if (buy > 0 && sell > 0) {
            // 1. Calculate Spread
            const diff = buy - sell;
            setSpread(diff);

            // 2. Calculate Percentage Loss (Spread / Buy Price)
            const percent = (diff / buy) * 100;
            setSpreadPercent(percent);

            // 3. Calculate Units & Total Investment & Cost based on Mode
            let units = 0;
            let investment = 0;

            if (mode === 'units') {
                // Input is number of units
                units = inputVal;
                investment = units * buy;
            } else {
                // Input is total amount to invest
                investment = inputVal;
                units = investment / buy;
            }

            setCalculatedUnits(units);
            setTotalInvestment(investment);

            // 4. Calculate Spread Cost (Money lost immediately)
            // Cost = Units * Spread
            const cost = units * diff;
            setSpreadCost(cost);

        } else {
            setSpread(0);
            setSpreadPercent(0);
            setCalculatedUnits(0);
            setTotalInvestment(0);
            setSpreadCost(0);
        }
    }, [buyPrice, sellPrice, inputValue, mode]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Simulador de Spread</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Parámetros de la Operación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Mode Selector */}
                        <div className="space-y-2">
                            <Label>Calculadora por:</Label>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as CalculationMode)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="units">Unidades</TabsTrigger>
                                    <TabsTrigger value="amount">Importe (€)</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="buyPrice">Precio Compra (Ask)</Label>
                                <Input
                                    id="buyPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sellPrice">Precio Venta (Bid)</Label>
                                <Input
                                    id="sellPrice"
                                    type="number"
                                    placeholder="0.00"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inputValue">
                                {mode === 'units' ? 'Número de Unidades' : 'Importe a Invertir (€)'}
                            </Label>
                            <Input
                                id="inputValue"
                                type="number"
                                placeholder="0"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>



                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Inversión Total</p>
                                    <div className="text-lg md:text-xl font-bold text-slate-800">
                                        {formatCurrency(totalInvestment)}
                                    </div>
                                    {mode === 'amount' && (
                                        <p className="text-xs text-muted-foreground">
                                            ≈ {calculatedUnits.toLocaleString('es-ES', { maximumFractionDigits: 4 })} unidades
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Diferencia (Spread)</p>
                                    <div className="text-lg md:text-xl font-bold">
                                        {spread.toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 5 })}
                                    </div>
                                </div>
                            </div>

                            {/* Spread Rating */}
                            {buyPrice && sellPrice ? (
                                (() => {
                                    const rating = getSpreadRating(spreadPercent);
                                    const Icon = rating.icon;
                                    return (
                                        <div className={`p-4 rounded-lg border ${rating.color}`}>
                                            <div className="flex items-start gap-3">
                                                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                                                <div>
                                                    <h4 className="font-semibold text-sm">Spread {rating.label}</h4>
                                                    <p className="text-sm mt-1 opacity-90">{rating.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : null}

                            <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-red-900">Coste del Spread</p>
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                        Pérdida Inmediata
                                    </span>
                                </div>
                                <div className="text-xl md:text-3xl font-bold text-red-600">
                                    -{formatCurrency(spreadCost)}
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                    Representa un <span className="font-bold">-{spreadPercent.toLocaleString('es-ES', { maximumFractionDigits: 3 })}%</span> de tu inversión.
                                </p>
                            </div>

                            <div className="text-sm text-muted-foreground border-t pt-4">
                                <p>
                                    Para recuperar este coste, el activo debe subir un
                                    <span className="font-bold text-foreground mx-1">
                                        {spreadPercent.toLocaleString('es-ES', { maximumFractionDigits: 3 })}%
                                    </span>
                                    desde el precio de compra.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scale Reference Accordion */}
                    <Card>
                        <Accordion type="single" collapsible>
                            <AccordionItem value="item-1" className="border-none">
                                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Info className="h-4 w-4" />
                                        Ver Baremo de Coste (Referencia)
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">Categoría</TableHead>
                                                <TableHead>Spread %</TableHead>
                                                <TableHead>Interpretación</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="text-xs">
                                            <TableRow className="bg-green-50/50">
                                                <TableCell className="font-medium text-green-700">🟢 Muy barato</TableCell>
                                                <TableCell>≤ 0,02 %</TableCell>
                                                <TableCell className="text-muted-foreground">ETF muy líquido, entrada óptima</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-emerald-50/50">
                                                <TableCell className="font-medium text-emerald-700">🟢 Barato</TableCell>
                                                <TableCell>0,02 – 0,05 %</TableCell>
                                                <TableCell className="text-muted-foreground">Normal / aceptable</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-yellow-50/50">
                                                <TableCell className="font-medium text-yellow-700">🟡 Regular</TableCell>
                                                <TableCell>0,05 – 0,10 %</TableCell>
                                                <TableCell className="text-muted-foreground">Se puede operar, pero mejor esperar</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-orange-50/50">
                                                <TableCell className="font-medium text-orange-700">🔴 Caro</TableCell>
                                                <TableCell>0,10 – 0,25 %</TableCell>
                                                <TableCell className="text-muted-foreground">Evitar salvo necesidad</TableCell>
                                            </TableRow>
                                            <TableRow className="bg-red-50/50">
                                                <TableCell className="font-medium text-red-700">🔴 Muy caro</TableCell>
                                                <TableCell>&gt; 0,25 %</TableCell>
                                                <TableCell className="text-muted-foreground">No compensa</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </Card>
                </div>
            </div>
        </div>
    );
}
