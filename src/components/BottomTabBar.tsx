import { NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Store, MapPin, Home, Plus, Package, Receipt } from "lucide-react";

interface BottomTabBarProps {
  mode: "client" | "seller";
}

const BottomTabBar = ({ mode }: BottomTabBarProps) => {
  const location = useLocation();

  const clientTabs = [
    { to: "/marketplace", label: "Produits", icon: ShoppingBag },
    { to: "/sellers", label: "Vendeurs", icon: Store },
    { to: "/", label: "Accueil", icon: Home },
    { to: "/map", label: "Carte", icon: MapPin },
    { to: "/client/transactions", label: "Achats", icon: Receipt },
  ];

  const sellerTabs = [
    { to: "/seller/dashboard", label: "Produits", icon: Package },
    { to: "/seller/add", label: "Ajouter", icon: Plus },
    { to: "/marketplace", label: "Client", icon: ShoppingBag },
  ];

  const tabs = mode === "client" ? clientTabs : sellerTabs;

  return (
    <nav className="z-50 bg-card/95 backdrop-blur-lg border-t safe-bottom flex-shrink-0">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          const isCenter = mode === "client" && tab.to === "/";
          
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors relative ${
                isCenter ? "" : ""
              }`}
            >
              {isCenter ? (
                <div className={`w-12 h-12 -mt-5 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground scale-110" 
                    : "bg-primary/90 text-primary-foreground"
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
              ) : (
                <>
                  <tab.icon className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
