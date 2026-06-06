import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Benchmark from "./pages/Benchmark";
import NotFound from "./pages/NotFound";

// WC2026 surface — additive, kept in src/wc2026/ to keep PSL untouched.
import WcIndex from "./wc2026/pages/Index";
import WcGroups from "./wc2026/pages/Groups";
import WcBenchmark from "./wc2026/pages/Benchmark";
import WcForgotPassword from "./wc2026/pages/ForgotPassword";
import WcResetPassword from "./wc2026/pages/ResetPassword";

const queryClient = new QueryClient();

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
