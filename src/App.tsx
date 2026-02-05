import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import MerchandisePage from "./pages/Merchandise";
import LaundryPage from "./pages/Laundry";
import OrdersPage from "./pages/Orders";
import CustomersPage from "./pages/Customers";
import ReceiptsPage from "./pages/Receipts";
import ReportsPage from "./pages/Reports";
import ExpensesPage from "./pages/Expenses";
import CashToBankPage from "./pages/CashToBank";
import LoansPage from "./pages/Loans";
import AdminPage from "./pages/Admin";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/merchandise" element={<ProtectedRoute><MerchandisePage /></ProtectedRoute>} />
            <Route path="/laundry" element={<ProtectedRoute><LaundryPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/receipts" element={<ProtectedRoute><ReceiptsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/cash-to-bank" element={<ProtectedRoute><CashToBankPage /></ProtectedRoute>} />
            <Route path="/loans" element={<ProtectedRoute><LoansPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
