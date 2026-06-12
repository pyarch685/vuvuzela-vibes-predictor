import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Benchmark from "./pages/Benchmark";
import NotFound from "./pages/NotFound";
import { IdleWarningDialog } from "@/components/IdleWarningDialog";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@wc/lib/api";

// WC2026 surface — additive, kept in src/wc2026/ to keep PSL untouched.
import WcIndex from "./wc2026/pages/Index";
import WcGroups from "./wc2026/pages/Groups";
import WcBenchmark from "./wc2026/pages/Benchmark";
import WcForgotPassword from "./wc2026/pages/ForgotPassword";
import WcResetPassword from "./wc2026/pages/ResetPassword";

const queryClient = new QueryClient();

/**
 * Drives the inactivity-logout flow for every authenticated route.
 *
 * Mounted once at App level so both the PSL surface (/, /benchmark) and
 * the WC2026 surface (/wc2026, /wc2026/*) inherit the same 15-minute
 * idle timeout + 60-second warning. Public routes (/forgot-password,
 * /reset-password) are unaffected because `isAuthenticated()` is false
 * there and the hook tears its listeners down.
 */
const IdleLogoutController = () => {
  const { toast } = useToast();
  const [authed, setAuthed] = useState<boolean>(() => isAuthenticated());

  // Re-evaluate auth state whenever any of the existing auth signals fire:
  //   - `auth-changed`: dispatched by login / logout buttons within this tab.
  //   - `storage`: the auth_token key changed in another tab.
  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    window.addEventListener("auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { state, secondsUntilLogout, stayActive, logoutNow } = useIdleLogout({
    enabled: authed,
    onAutoLogout: () =>
      toast({
        title: "Signed out",
        description: "You were signed out after 15 minutes of inactivity.",
      }),
  });

  return (
    <IdleWarningDialog
      open={state === "warning"}
      secondsRemaining={secondsUntilLogout}
      onStay={stayActive}
      onLogout={logoutNow}
    />
  );
};

// Wraps any WC2026 surface in the .wc2026-theme scope so all CSS variables
// (Tailwind/shadcn) resolve to the World Cup navy palette. PSL routes bypass
// this wrapper entirely and continue to resolve variables from :root.
const WcShell = ({ children }: { children: React.ReactNode }) => (
  <div className="wc2026-theme min-h-screen bg-background text-foreground">
    {children}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <IdleLogoutController />
        <Routes>
          {/* PSL surface (unchanged) */}
          <Route path="/" element={<Index />} />
          <Route path="/benchmark" element={<Benchmark />} />

          {/* WC2026 surface — wrapped in WcShell for the navy theme */}
          <Route path="/wc2026" element={<WcShell><WcIndex /></WcShell>} />
          <Route path="/wc2026/groups" element={<WcShell><WcGroups /></WcShell>} />
          <Route path="/wc2026/benchmark" element={<WcShell><WcBenchmark /></WcShell>} />

          {/* Shared auth flows — render in WC2026 theme */}
          <Route path="/forgot-password" element={<WcShell><WcForgotPassword /></WcShell>} />
          <Route path="/reset-password" element={<WcShell><WcResetPassword /></WcShell>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
