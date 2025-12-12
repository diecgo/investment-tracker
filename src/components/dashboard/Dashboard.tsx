import { SummaryCards } from "./SummaryCards";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button>Descargar Informe</Button>
                </div>
            </div>

            <SummaryCards />

            {/* Placeholder for potential Charts or recent activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold mb-4">Evolución (Próximamente)</h3>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
                        Gráfico de Valor Portfolio
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold mb-4">Actividad Reciente</h3>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
