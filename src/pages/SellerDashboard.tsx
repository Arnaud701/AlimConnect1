import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, Trash2, LogOut, Pencil, Bell, X } from "lucide-react";
import { formatPriceFcfa } from "@/lib/utils";

import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import ScrollReveal from "@/components/ScrollReveal";
import {
  fetchProductsBySellerFromDB, deleteProductFromDB, getSellerStats,
  getDaysUntilExpiry, getExpiryLabel, getDiscountPercentage, Product,
  fetchSellerNotifications, markNotificationsRead, SellerNotification,
} from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stats, setStats] = useState({ sales: 0, revenue: 0, rating: 0 });
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "seller") {
      navigate("/auth/seller", { replace: true });
      return;
    }
    Promise.all([
      fetchProductsBySellerFromDB(user.id),
      getSellerStats(user.id),
      fetchSellerNotifications(user.id),
    ]).then(([products, s, notifs]) => {
      setMyProducts(products);
      setStats(s);
      setNotifications(notifs);
      setLoadingProducts(false);
    });

    // Mise à jour temps réel des stats quand une vente arrive
    const ordersChannel = supabase
      .channel(`seller-orders-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `seller_id=eq.${user.id}` },
        () => { getSellerStats(user.id).then(setStats); }
      )
      .subscribe();

    // Mise à jour temps réel des notifications
    const notifsChannel = supabase
      .channel(`seller-notifs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `seller_id=eq.${user.id}` },
        () => { fetchSellerNotifications(user.id).then(setNotifications); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notifsChannel);
    };
  }, [loading, user, navigate]);

  const handleOpenNotifs = async () => {
    setShowNotifs(true);
    if (unreadCount > 0 && user) {
      await markNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const onLogout = async () => {
    await signOut();
    navigate("/auth/seller", { replace: true });
  };

  const onDelete = async (productId: string) => {
    try {
      await deleteProductFromDB(productId);
      setMyProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // silently fail
    }
  };

  return (
    <MobileLayout mode="seller">
      <MobileHeader
        title="Mes produits"
        rightAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
            <button type="button" onClick={handleOpenNotifs} className="relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link
              to="/seller/add"
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </Link>
          </div>
        }
      />

      {/* Panneau notifications */}
      {showNotifs && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowNotifs(false)}>
          <div className="w-full bg-background rounded-t-3xl max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-foreground text-base">Notifications</h2>
              <button onClick={() => setShowNotifs(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">Aucune notification</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-5 py-4 space-y-1 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("fr-SN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* Stats row */}
        <ScrollReveal>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
            {[
              { label: "Actifs", value: myProducts.length },
              { label: "Ventes", value: stats.sales },
              { label: "Revenus", value: formatPriceFcfa(stats.revenue) },
              { label: "Note", value: stats.rating > 0 ? `${stats.rating}/5` : "—" },
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-2xl border p-4 min-w-[100px] flex-shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <p className="text-xs text-muted-foreground">{myProducts.length} produit{myProducts.length > 1 ? "s" : ""} en ligne</p>

        {/* Products */}
        <div className="space-y-3">
          {myProducts.map((product, i) => {
            const days = getDaysUntilExpiry(product.expiryDate);
            const expiry = getExpiryLabel(days);
            const discount = getDiscountPercentage(product.originalPrice, product.reducedPrice);

            return (
              <ScrollReveal key={product.id} delay={i * 60}>
                <div className="bg-card rounded-2xl border p-3 flex gap-3 active:scale-[0.98] transition-transform">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => navigate(`/seller/edit/${product.id}`)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(product.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm font-bold text-primary tabular-nums">{formatPriceFcfa(product.reducedPrice)}</span>
                      <span className="text-[10px] text-muted-foreground line-through tabular-nums">{formatPriceFcfa(product.originalPrice)}</span>
                      <span className="text-[10px] font-semibold text-primary bg-accent px-1.5 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div
                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          expiry.urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {expiry.text}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Qté: {product.quantity}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </MobileLayout>
  );
};

export default SellerDashboard;
