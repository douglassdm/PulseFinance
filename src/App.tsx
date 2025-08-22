import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Placeholder routes for sidebar navigation */}
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Transações</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Contas Bancárias</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Investimentos</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Metas Financeiras</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/debts" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Dívidas</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Categorias</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/recurring" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Transações Recorrentes</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">Configurações</h2>
                    <p className="text-muted-foreground">Em desenvolvimento...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
