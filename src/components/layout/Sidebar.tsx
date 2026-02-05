import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Shirt, 
  ShoppingCart, 
  Receipt, 
  Users,
  LogOut,
  Shield,
  BarChart3,
  Wallet,
  Landmark,
  HandCoins
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Merchandise", href: "/merchandise", icon: Package },
  { name: "Laundry Services", href: "/laundry", icon: Shirt },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Receipts", href: "/receipts", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Cash to Bank", href: "/cash-to-bank", icon: Landmark },
  { name: "Loans & Credits", href: "/loans", icon: HandCoins },
];

export function Sidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Package className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">MerchLaundry</h1>
            <p className="text-xs text-sidebar-foreground/60">Business Manager</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}

          {/* Admin Link - only visible to admins */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-4 border-t border-sidebar-border pt-4",
                location.pathname === "/admin"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Shield className="h-5 w-5" />
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* Footer with user info and logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          {user && (
            <div className="px-2">
              <div className="flex items-center gap-2">
                <p className="text-xs text-sidebar-foreground/60">Logged in as</p>
                {isAdmin && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-destructive/20 text-destructive border-destructive/30">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-sidebar-foreground truncate">{user.email}</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}
