import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DailyReport, Transaction } from "@/types";
import { ArrowDownRight, ArrowUpRight, Calendar, ShoppingCart } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function DailyReportsPage() {
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Histórico Diario
            </h1>

            {reports.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur-md border-white/10">
                    <CardContent className="p-8 text-center text-gray-400">
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

function ReportCard({ report, onClick }: { report: DailyReport, onClick: () => void }) {
    // Determine daily P/L color roughly based on metrics or just neutral
    // We didn't store "Daily P/L" explicitly in the top level, but metrics has dailyProfit (placeholder) or we can infer from winners/losers
    // For now, let's just show totals.

    return (
        <Card
            className="group cursor-pointer hover:bg-white/5 transition-colors bg-card/40 backdrop-blur-md border-white/10"
            onClick={onClick}
        >
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-500/10 p-2 rounded-full">
                        <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-white capitalize">
                            {format(new Date(report.date), "EEEE, d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-sm text-gray-400">
                            {report.operations?.length || 0} operaciones
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className="font-bold text-white mb-1">
                        {formatCurrency(report.currentValue)}
                    </p>
                    <p className="text-xs text-gray-400">
                        Invertido: {formatCurrency(report.totalInvested)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function ReportDetailModal({ report, isOpen, onClose }: { report: DailyReport, isOpen: boolean, onClose: () => void }) {
    // Safely verify ops are transactions
    const ops = (report.operations || []) as Transaction[];
    const winners = report.metrics?.topWinners || [];
    const losers = report.metrics?.topLosers || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Informe del ${format(new Date(report.date), "d MMM yyyy", { locale: es })}`}>
            <div className="space-y-6 py-4">

                {/* Summary Header */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-gray-400 block mb-1">Valor Total</span>
                        <span className="text-xl font-bold">{formatCurrency(report.currentValue)}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-gray-400 block mb-1">Total Invertido</span>
                        <span className="text-xl font-bold text-gray-300">{formatCurrency(report.totalInvested)}</span>
                    </div>
                </div>

                {/* Top Movers */}
                {(winners.length > 0 || losers.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-green-400 flex items-center mb-2">
                                <ArrowUpRight className="w-4 h-4 mr-1" /> Top Winners
                            </h4>
                            {winners.map((w, i) => (
                                <div key={i} className="flex justify-between text-sm bg-green-500/5 p-2 rounded">
                                    <span>{w.symbol}</span>
                                    <span className="text-green-400">+{w.changePercent.toFixed(2)}%</span>
                                </div>
                            ))}
                            {winners.length === 0 && <p className="text-xs text-gray-500">-</p>}
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-red-400 flex items-center mb-2">
                                <ArrowDownRight className="w-4 h-4 mr-1" /> Top Losers
                            </h4>
                            {losers.map((l, i) => (
                                <div key={i} className="flex justify-between text-sm bg-red-500/5 p-2 rounded">
                                    <span>{l.symbol}</span>
                                    <span className="text-red-400">{l.changePercent.toFixed(2)}%</span>
                                </div>
                            ))}
                            {losers.length === 0 && <p className="text-xs text-gray-500">-</p>}
                        </div>
                    </div>
                )}

                {/* Operations Table */}
                <div>
                    <h4 className="text-md font-semibold mb-3 flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-2 text-blue-400" />
                        Operaciones del Día
                    </h4>
                    {ops.length > 0 ? (
                        <div className="rounded-md border border-white/10 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="p-2 text-left">Tipo</th>
                                        <th className="p-2 text-left">Activo</th>
                                        <th className="p-2 text-right">Cantidad</th>
                                        <th className="p-2 text-right">Precio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {ops.map((op) => (
                                        <tr key={op.id} className="hover:bg-white/5">
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${op.type === 'Buy' ? 'bg-green-500/20 text-green-400' :
                                                    op.type === 'Sell' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {op.type === 'Buy' ? 'Compra' : op.type === 'Sell' ? 'Venta' : op.type}
                                                </span>
                                            </td>
                                            <td className="p-2 font-medium">
                                                {/* Requires fetching investment symbol or checking logic. 
                                                   Operations stored in daily report might not have symbol directly if only transaction saved. 
                                                   Let's assume description has it or we just show description */}
                                                {op.description || "N/A"}
                                            </td>
                                            <td className="p-2 text-right">{op.quantity}</td>
                                            <td className="p-2 text-right">{op.pricePerUnit ? formatCurrency(op.pricePerUnit) : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No hubo operaciones registradas en este día.</p>
                    )}
                </div>

            </div>
        </Modal>
    );
}
