import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DailyReport, Transaction } from "@/types";
import { ArrowDownRight, ArrowUpRight, Calendar, ShoppingCart, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";

export function DailyReportsPage() {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
    const { recalculatePastReports } = useStore();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching reports:", error);
        } else {
            console.log("Reports fetched:", data);
            setReports(data as DailyReport[]);
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando historial...</div>;
    }

    return (
        <div className="space-y-6 pb-20 fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">
                    Histórico Diario
                </h1>
                <Button variant="outline" onClick={async () => {
                    await recalculatePastReports();
                    fetchReports();
                }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reparar Histórico
                </Button>
            </div>

            {reports.length === 0 ? (
                <Card className="bg-white border-slate-200">
                    <CardContent className="p-8 text-center text-slate-500">
                        No hay informes guardados aún. Entra mañana para ver tu primer resumen.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onClick={() => setSelectedReport(report)}
                        />
                    ))}
                </div>
            )}

            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    isOpen={!!selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function generatePDF(report: DailyReport) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text(`Informe Diario de Inversión`, 14, 22);

    doc.setFontSize(12);
    doc.text(format(new Date(report.date), "EEEE, d 'de' MMMM yyyy", { locale: es }), 14, 32);

    // Summary
    const pl = report.currentValue - report.totalInvested;
    const plPercent = report.totalInvested > 0 ? (pl / report.totalInvested) * 100 : 0;

    autoTable(doc, {
        startY: 40,
        head: [['Concepto', 'Valor']],
        body: [
            ['Valor Total', formatCurrency(report.currentValue)],
            ['Total Invertido', formatCurrency(report.totalInvested)],
            ['Beneficio/Pérdida (€)', formatCurrency(pl)],
            ['Beneficio/Pérdida (%)', `${plPercent.toFixed(2)}%`],
        ],
    });

    // Top Movers
    const winners = report.metrics?.topWinners || [];
    const losers = report.metrics?.topLosers || [];

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text('Mejor Rendimiento (Día)', 14, finalY);
    autoTable(doc, {
        startY: finalY + 5,
        head: [['Símbolo', 'Cambio %', 'Cambio €']],
        body: winners.map(w => [w.symbol, `${w.changePercent.toFixed(2)}%`, formatCurrency(w.change)]),
    });

    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.text('Peor Rendimiento (Día)', 14, finalY);
    autoTable(doc, {
        startY: finalY + 5,
        head: [['Símbolo', 'Cambio %', 'Cambio €']],
        body: losers.map(l => [l.symbol, `${l.changePercent.toFixed(2)}%`, formatCurrency(l.change)]),
    });

    // Operations
    finalY = (doc as any).lastAutoTable.finalY + 10;
    const ops = report.operations || [];

    if (ops.length > 0) {
        doc.text('Operaciones del Día', 14, finalY);
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Tipo', 'Descripción', 'Cantidad', 'Precio']],
            body: ops.map(op => [
                op.type === 'Buy' ? 'Compra' : op.type === 'Sell' ? 'Venta' : op.type,
                op.description || '-',
                op.quantity || '-',
                op.pricePerUnit ? formatCurrency(op.pricePerUnit) : '-'
            ]),
        });
    } else {
        doc.text('Sin operaciones registradas hoy.', 14, finalY);
    }

    doc.save(`Informe_Diario_${report.date}.pdf`);
}

function ReportCard({ report, onClick }: { report: DailyReport, onClick: () => void }) {
    const pl = (report.currentValue || 0) - (report.totalInvested || 0);
    const plPercent = (report.totalInvested || 0) > 0 ? (pl / report.totalInvested) * 100 : 0;
    const isPositive = pl >= 0;

    return (
        <Card className="group bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
                <div
                    className="flex items-center space-x-4 cursor-pointer flex-1"
                    onClick={onClick}
                >
                    <div className="bg-blue-50 p-2 rounded-full">
                        <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 capitalize">
                            {format(new Date(report.date), "EEEE, d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-sm text-slate-500">
                            {report.operations?.length || 0} operaciones
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="font-bold text-slate-900 mb-1">
                            {formatCurrency(report.currentValue || 0)}
                        </p>
                        <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{plPercent.toFixed(2)}% ({formatCurrency(pl)})
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            generatePDF(report);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title="Descargar PDF"
                    >
                        <ArrowDownRight className="w-5 h-5" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

function ReportDetailModal({ report, isOpen, onClose }: { report: DailyReport, isOpen: boolean, onClose: () => void }) {
    const ops = (report.operations || []) as Transaction[];
    const winners = report.metrics?.topWinners || [];
    const losers = report.metrics?.topLosers || [];

    const pl = (report.currentValue || 0) - (report.totalInvested || 0);
    const plPercent = (report.totalInvested || 0) > 0 ? (pl / report.totalInvested) * 100 : 0;
    const isPositive = pl >= 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Informe del ${format(new Date(report.date), "d MMM yyyy", { locale: es })}`}>
            <div className="space-y-6 py-4">

                {/* Summary Header */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-sm text-slate-500 block mb-1">Valor Total</span>
                        <span className="text-xl font-bold text-slate-900">{formatCurrency(report.currentValue || 0)}</span>
                        <div className={`text-sm mt-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{plPercent.toFixed(2)}%
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-sm text-slate-500 block mb-1">Total Invertido</span>
                        <span className="text-xl font-bold text-slate-700">{formatCurrency(report.totalInvested || 0)}</span>
                    </div>
                </div>

                {/* Top Movers */}
                {(winners.length > 0 || losers.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-green-700 flex items-center mb-2">
                                <ArrowUpRight className="w-4 h-4 mr-1" /> Top Winners
                            </h4>
                            {winners.map((w, i) => (
                                <div key={i} className="flex justify-between text-sm bg-green-50 p-2 rounded text-slate-700">
                                    <span>{w.symbol}</span>
                                    <span className="text-green-600">+{w.changePercent.toFixed(2)}%</span>
                                </div>
                            ))}
                            {winners.length === 0 && <p className="text-xs text-slate-400">-</p>}
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-red-700 flex items-center mb-2">
                                <ArrowDownRight className="w-4 h-4 mr-1" /> Top Losers
                            </h4>
                            {losers.map((l, i) => (
                                <div key={i} className="flex justify-between text-sm bg-red-50 p-2 rounded text-slate-700">
                                    <span>{l.symbol}</span>
                                    <span className="text-red-600">{l.changePercent.toFixed(2)}%</span>
                                </div>
                            ))}
                            {losers.length === 0 && <p className="text-xs text-slate-400">-</p>}
                        </div>
                    </div>
                )}

                {/* Operations Table */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-slate-800 flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2 text-blue-500" />
                            Operaciones del Día
                        </h4>
                        <button
                            onClick={() => generatePDF(report)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors"
                        >
                            Descargar PDF
                        </button>
                    </div>

                    {ops.length > 0 ? (
                        <div className="rounded-md border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="p-2 text-left">Tipo</th>
                                        <th className="p-2 text-left">Activo</th>
                                        <th className="p-2 text-right">Cantidad</th>
                                        <th className="p-2 text-right">Precio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ops.map((op) => (
                                        <tr key={op.id} className="hover:bg-slate-50">
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${op.type === 'Buy' ? 'bg-green-100 text-green-700' :
                                                    op.type === 'Sell' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {op.type === 'Buy' ? 'Compra' : op.type === 'Sell' ? 'Venta' : op.type}
                                                </span>
                                            </td>
                                            <td className="p-2 font-medium text-slate-700">
                                                {op.description || "N/A"}
                                            </td>
                                            <td className="p-2 text-right text-slate-700">{op.quantity}</td>
                                            <td className="p-2 text-right text-slate-700">{op.pricePerUnit ? formatCurrency(op.pricePerUnit) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No hubo operaciones registradas en este día.</p>
                    )}
                </div>

            </div>
        </Modal>
    );
}
