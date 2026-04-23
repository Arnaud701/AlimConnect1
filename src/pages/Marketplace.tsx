import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, LogOut, ShoppingCart } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { getAllProducts, Product } from "@/lib/mock-data";
import { addToCart, getCartItemCount } from "@/lib/cart";
import { useAuth } from "@/context/AuthContext";

const categories = ["Tout", "Boulangerie", "Produits laitiers", "Fruits & Légumes", "Plats préparés"];

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tout");
  const [cartCount, setCartCount] = useState(() => getCartItemCount());
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "client") {
      navigate("/auth/client", { replace: true });
      return;
    }
    getAllProducts().then(setAllProducts);
  }, [loading, user, navigate]);

  const onLogout = async () => {
    await signOut();
    navigate("/auth/client", { replace: true });
  };

  const onAddToCart = (product: Product) => {
    addToCart(product);
    const count = getCartItemCount();
    setCartCount(count);

    toast({
      title: "Produit ajouté",
      description: `${product.name} a été ajouté à votre panier (${count} articles).`,
    });
  };

  const cartButton = (
    <Link to="/cart" className="relative"> 
      <div className="w-9 h-9 rounded-xl bg-emerald-500/95 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-transform">
        <ShoppingCart className="w-4 h-4" />
      </div>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );

  const filtered = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Tout" || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <MobileLayout mode="client">
      <MobileHeader
        title="Offres anti-gaspi"
        rightAction={
          <div className="flex items-center gap-2">
            {cartButton}
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </p>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 60}>
              <ProductCard product={product} index={i} onAddToCart={onAddToCart} />
            </ScrollReveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucun produit trouvé</p>
            <button
              onClick={() => { setSearch(""); setCategory("Tout"); }}
              className="mt-3 text-primary text-sm font-medium"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Marketplace;
