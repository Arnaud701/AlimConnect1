import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { getAllProducts, Product } from "@/lib/mock-data";
import { getCart, removeFromCart, updateCartItemQuantity } from "@/lib/cart";
import { useAuth } from "@/context/AuthContext";
import { formatPriceFcfa } from "@/lib/utils";

const Cart = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cartItems, setCartItems] = useState(() => getCart());
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "client") {
      navigate("/auth/client", { replace: true });
      return;
    }
    getAllProducts().then(setAllProducts);
  }, [loading, user, navigate]);

  const enrichedCartItems = useMemo(() => {
    return cartItems
      .map((item) => ({ ...item, product: allProducts.find((p) => p.id === item.productId) }))
      .filter((item) => item.product) as { productId: string; quantity: number; product: Product }[];
  }, [cartItems, allProducts]);

  const totalCount = enrichedCartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = enrichedCartItems.reduce((s, i) => s + i.product.reducedPrice * i.quantity, 0);

  const handleQuantityChange = (productId: string, qty: number) => setCartItems(updateCartItemQuantity(productId, qty));
  const handleRemove = (productId: string) => setCartItems(removeFromCart(productId));

  const handleCheckout = () => {
    if (totalCount === 0) return;
    navigate("/checkout", {
      state: { items: enrichedCartItems.map((i) => ({ product: i.product, quantity: i.quantity })) },
    });
  };

  const setGivenRating = (sellerId: string, value: number) => {
    setRatingTargets((prev) => prev?.map((t) => t.sellerId === sellerId ? { ...t, given: value } : t) ?? null);
  };

  const handleSubmitRatings = async () => {
    if (!user || !ratingTargets) return;
    setSubmittingRatings(true);
    try {
      await Promise.all(
        ratingTargets.filter((t) => t.given > 0).map((t) => upsertRating(user.id, t.sellerId, t.given)),
      );
    } catch {
      // best-effort
    } finally {
      setSubmittingRatings(false);
      navigate("/marketplace", { replace: true });
    }
  };

  return (
    <MobileLayout mode="client">
      <MobileHeader title="Mon panier" />
      <div className="px-4 py-5 space-y-4">
        <div className="bg-card rounded-2xl border p-4">
          <h2 className="text-lg font-semibold text-foreground mb-2">{`Articles (${totalCount})`}</h2>
          {enrichedCartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Votre panier est vide.</p>
          ) : (
            <div className="space-y-3">
              {enrichedCartItems.map((item) => (
                <div key={item.product.id} className="bg-background border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.product.category}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × {formatPriceFcfa(item.product.reducedPrice)}</p>
                    </div>
                    <button onClick={() => handleRemove(item.productId)} className="text-xs text-destructive underline">
                      Supprimer
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button onClick={() => handleQuantityChange(item.productId, Math.max(1, item.quantity - 1))} className="px-2 py-1 rounded bg-secondary/60 text-xs">-</button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.productId, item.quantity + 1)} className="px-2 py-1 rounded bg-secondary/60 text-xs">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground mb-1">Montant total :</p>
            <p className="text-xl font-bold text-foreground mb-3">{formatPriceFcfa(totalPrice)}</p>
            <button
              onClick={handleCheckout}
              disabled={totalCount === 0}
              className="w-full rounded-xl bg-emerald-500 text-white py-2 font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Valider le panier
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Cart;
