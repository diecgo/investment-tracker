import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PieChart, Wallet, FileText, LogOut, User, KeyRound, Calculator, Ghost } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const username = useStore(state => state.username);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const navItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Inversiones", href: "/portfolio", icon: PieChart },
        { name: "Capital", href: "/capital", icon: Wallet },
        { name: "Informes", href: "/reports", icon: FileText },
        { name: "Simular Inv.", href: "/simulation", icon: Ghost },
        { name: "Coste Spread", href: "/tools/spread", icon: Calculator },
    ];

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <ChangePasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
            />

            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-900 text-white p-4 flex flex-col justify-between">
                <div>
                    <div className="mb-8 flex items-center gap-2 px-2">
                        <span className="text-xl font-bold">Investment Tracker</span>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800",
                                        isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-8 border-t border-slate-800 pt-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 px-2">
                                <User className="mr-2 h-4 w-4" />
                                <span className="truncate">{username || "Usuario"}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{username || "Usuario"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">Cuenta Personal</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                <span>Cambiar Contraseña</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-slate-50 overflow-auto h-screen">
                <Outlet />
            </div>
        </div>
    );
}
