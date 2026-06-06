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

          {/* WC2026 surface */}
          <Route path="/wc2026" element={<WcIndex />} />
          <Route path="/wc2026/groups" element={<WcGroups />} />
          <Route path="/wc2026/benchmark" element={<WcBenchmark />} />

          {/* Shared auth flows — WC2026's reset-password screen also serves PSL users */}
          <Route path="/forgot-password" element={<WcForgotPassword />} />
          <Route path="/reset-password" element={<WcResetPassword />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
