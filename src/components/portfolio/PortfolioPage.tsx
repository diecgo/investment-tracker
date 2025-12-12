import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InvestmentTable } from "./InvestmentTable";
import { AddInvestmentDialog } from "./AddInvestmentDialog";
import { SummaryCards } from "../dashboard/SummaryCards"; // Reuse summary cards? Or maybe just use Portfolio Metrics
import { Plus } from "lucide-react";

export default function PortfolioPage() {
    const [isAddOpen, setIsAddOpen] = useState(false);

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mis Inversiones</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Añadir Inversión
                    </Button>
                </div>
            </div>

            <SummaryCards />

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Cartera Actual</h3>
                <InvestmentTable />
            </div>

            <AddInvestmentDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        </div>
    );
}
