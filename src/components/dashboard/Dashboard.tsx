import { SummaryCards } from "./SummaryCards";
import { Button } from "@/components/ui/button";
import { InvestmentTable } from "@/components/portfolio/InvestmentTable";

export default function Dashboard() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button>Descargar Informe</Button>
                </div>
            </div>

            <SummaryCards />

            {/* Investment Table */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Mis Inversiones</h3>
                <InvestmentTable />
            </div>
        </div>
    );
}
