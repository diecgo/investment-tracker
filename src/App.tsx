import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import PortfolioPage from "@/components/portfolio/PortfolioPage";
import CapitalPage from "@/components/capital/CapitalPage";
import ReportsPage from "@/components/reports/ReportsPage";
import SimulationPage from "@/components/simulation/SimulationPage";
import SpreadSimulator from "@/components/tools/SpreadSimulator";
import { AuthPage } from "@/components/auth/AuthPage";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";

// Auth Guard Component
function RequireAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // We also trigger store data fetch here if authenticated
  const fetchAllData = useStore(state => state.fetchAllData);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchAllData]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/" element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="capital" element={<CapitalPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="tools/spread" element={<SpreadSimulator />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
