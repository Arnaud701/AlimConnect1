import { Link, useLocation } from "react-router-dom";
import { Leaf, ShoppingBag, Store, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  mode: "client" | "seller";
}

const Navbar = ({ mode }: NavbarProps) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const clientLinks = [
    { to: "/marketplace", label: "Produits", icon: ShoppingBag },
    { to: "/sellers", label: "Vendeurs", icon: Store },
    { to: "/map", label: "Carte", icon: MapPin },
  ];

  const sellerLinks = [
    { to: "/seller/dashboard", label: "Mes produits", icon: ShoppingBag },
    { to: "/seller/add", label: "Ajouter", icon: Store },
  ];

  const links = mode === "client" ? clientLinks : sellerLinks;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-95 group-active:scale-90">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            AlimConnect
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <Link
            to={mode === "client" ? "/seller/dashboard" : "/marketplace"}
            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {mode === "client" ? "Espace vendeur" : "Espace client"}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card px-4 py-3 space-y-1 animate-fade-in">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <Link
            to={mode === "client" ? "/seller/dashboard" : "/marketplace"}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border text-muted-foreground hover:bg-muted transition-colors"
          >
            {mode === "client" ? "Espace vendeur" : "Espace client"}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
