import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Sellers from "./pages/Sellers";
import MapView from "./pages/MapView";
import SellerDashboard from "./pages/SellerDashboard";
import SellerAddProduct from "./pages/SellerAddProduct";
import SellerEditProduct from "./pages/SellerEditProduct";
import SellerOnboarding from "./pages/SellerOnboarding";
import ClientSetupLocation from "./pages/ClientSetupLocation";
import Checkout from "./pages/Checkout";
import ClientTransactions from "./pages/ClientTransactions";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/:role" element={<Auth />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/sellers" element={<Sellers />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/seller/add" element={<SellerAddProduct />} />
            <Route path="/seller/edit/:id" element={<SellerEditProduct />} />
            <Route path="/seller/onboarding" element={<SellerOnboarding />} />
            <Route path="/client/location" element={<ClientSetupLocation />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/client/transactions" element={<ClientTransactions />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
