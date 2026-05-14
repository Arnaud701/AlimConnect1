import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Clock, Trash2, LogOut, Pencil, Bell, X, AlertTriangle, ExternalLink, ShieldCheck, ArrowLeft, Sparkles, Star } from "lucide-react";
import { formatPriceFcfa } from "@/lib/utils";

import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import ScrollReveal from "@/components/ScrollReveal";
import {
  fetchProductsBySellerFromDB, deleteProductFromDB, getSellerStats,
  getDaysUntilExpiry, getExpiryLabel, getDiscountPercentage, Product,
  fetchSellerNotifications, markNotificationsRead, SellerNotification,
} from "@/lib/mock-data";
import { getSubscription, activateSubscription, SubscriptionInfo } from "@/lib/subscription";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const WAVE_URL = "https://pay.wave.com/m/M_sn_qApmbNWkrVuw/c/sn/?amount=1000&currency=XOF";
const OM_QR_IMAGE = "/om-qr.jpeg";
const OM_USSD = "*144*1*1000*770902489#";
const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

/* ── Modal abonnement ─────────────────────────────────────────── */
function SubscriptionModal({
  sellerId, onPaid, onClose,
}: { sellerId: string; onPaid: () => void; onClose: () => void }) {
  const [step, setStep] = useState<"choice" | "payment" | "qr" | "confirm">("choice");
  const [method, setMethod] = useState<"wave" | "om" | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartTrial = () => {
    // Pour l'instant : ferme le modal et indique que l'essai est démarré
    onPaid();
  };

  const handlePayWith = (m: "wave" | "om") => {
    setMethod(m);
    setPaidAmount("");
    setAmountError(null);
    if (m === "wave") {
      window.open(WAVE_URL, "_blank");
      setTimeout(() => setStep("confirm"), 800);
    } else if (isMobile()) {
      window.open(`tel:${OM_USSD}`);
      setTimeout(() => setStep("confirm"), 800);
    } else {
      setStep("qr");
    }
  };

  const handleConfirm = async () => {
    const paid = Number(paidAmount.trim());
    if (!paidAmount.trim() || isNaN(paid)) { setAmountError("Veuillez entrer le montant payé."); return; }
    if (paid < 1000) { setAmountError("Montant insuffisant. L'abonnement coûte 1 000 F CFA."); return; }
    setLoading(true);
    try {
      await activateSubscription(sellerId, new Date().toISOString());
      onPaid();
    } finally {
      setLoading(false);
    }
  };

  /* Étape QR Orange Money */
  if (step === "qr") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setStep("payment")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Orange Money</h1>
          </div>
        </header>
        <div className="flex-1 px-4 py-8 flex flex-col items-center gap-6">
          <div className="border-4 border-orange-500 rounded-3xl p-3 bg-white shadow-lg shadow-orange-500/20">
            <img src={OM_QR_IMAGE} alt="QR Code Orange Money" className="w-56 h-56 object-contain rounded-xl" />
          </div>
          <p className="text-xs text-muted-foreground">Montant : <span className="font-bold text-orange-500">1 000 F CFA</span></p>
          <button onClick={() => setStep("confirm")}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold active:scale-[0.98] transition-transform">
            J'ai scanné et payé
          </button>
        </div>
      </div>
    );
  }

  /* Étape confirmation */
  if (step === "confirm") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setStep("payment")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Confirmer le paiement</h1>
          </div>
        </header>
        <div className="px-4 py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground px-1">Montant payé (F CFA)</label>
            <input type="number" value={paidAmount}
              onChange={(e) => { setPaidAmount(e.target.value); setAmountError(null); }}
              placeholder="1000"
              className="w-full border rounded-2xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            {amountError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{amountError}</p>
              </div>
            )}
          </div>
          <button onClick={handleConfirm} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-2xl font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform">
            <ShieldCheck className="w-5 h-5" />
            {loading ? "Activation..." : "J'ai effectué le paiement"}
          </button>
          <button onClick={() => setStep("payment")} className="w-full text-sm text-muted-foreground py-2 text-center">
            Changer de méthode
          </button>
        </div>
      </div>
    );
  }

  /* Étape paiement */
  if (step === "payment") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setStep("choice")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Abonnement mensuel</h1>
          </div>
        </header>
        <div className="px-4 py-6 space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-1">
            <p className="text-base font-bold text-foreground">AlimConnect Vendeur</p>
            <p className="text-xs text-muted-foreground">Accès complet · 30 jours renouvelables</p>
            <p className="text-3xl font-bold text-primary mt-2 tabular-nums">1 000 F CFA</p>
            <p className="text-[11px] text-muted-foreground">/ mois</p>
          </div>
          <button onClick={() => handlePayWith("wave")}
            className="w-full flex items-center gap-4 bg-[#1352DE] text-white p-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-[#1352DE]/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-[#1352DE] font-black text-lg">W</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold">Payer avec Wave</p>
              <p className="text-xs text-white/80">Paiement mobile instantané</p>
            </div>
            <ExternalLink className="w-5 h-5 text-white/70 flex-shrink-0" />
          </button>
          <button onClick={() => handlePayWith("om")}
            className="w-full flex items-center gap-4 bg-orange-500 text-white p-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-orange-500 font-black text-lg">OM</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold">Orange Money</p>
              <p className="text-xs text-white/80">QR Code ou USSD *144#</p>
            </div>
            <ExternalLink className="w-5 h-5 text-white/70 flex-shrink-0" />
          </button>
        </div>
      </div>
    );
  }

  /* Étape choix (défaut) */
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="bg-card border-b">
        <div className="flex items-center gap-3 h-14 px-4">
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Commencer sur AlimConnect</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Choisissez la formule qui vous convient
        </p>

        {/* Option 1 — Essai gratuit */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-base font-bold text-green-900">Essai gratuit</p>
              <p className="text-xs text-green-700 font-semibold">7 jours offerts · sans engagement</p>
            </div>
          </div>
          <ul className="space-y-2">
            {["Publiez jusqu'à 3 produits", "Visibilité sur la marketplace", "Aucune carte bancaire requise"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-green-800">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={handleStartTrial}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-green-500 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-transform"
          >
            Démarrer l'essai gratuit
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-semibold">OU</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Option 2 — Abonnement */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Abonnement mensuel</p>
              <p className="text-2xl font-bold text-primary tabular-nums">1 000 <span className="text-sm font-semibold text-muted-foreground">F CFA / mois</span></p>
            </div>
          </div>
          <ul className="space-y-2">
            {["Produits illimités", "Accès complet 30 jours", "Renouvelable chaque mois"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setStep("payment")}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-primary-foreground bg-primary shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            S'abonner maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard principal ─────────────────────────────────────── */
const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stats, setStats] = useState({ sales: 0, revenue: 0, rating: 0 });
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const [sub, setSub] = useState<SubscriptionInfo>({ status: 'none', trialStartAt: null, trialDaysLeft: 0, subscriptionExpiresAt: null, subDaysLeft: 0 });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refreshSub = async (userId: string) => {
    try {
      const info = await getSubscription(userId);
      setSub(info);
    } catch { /* garde la valeur par défaut */ }
  };

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "seller") {
      navigate("/auth/seller", { replace: true });
      return;
    }

    refreshSub(user.id);

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

    const ordersChannel = supabase
      .channel(`seller-orders-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `seller_id=eq.${user.id}` },
        () => { getSellerStats(user.id).then(setStats); })
      .subscribe();

    const notifsChannel = supabase
      .channel(`seller-notifs-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `seller_id=eq.${user.id}` },
        () => { fetchSellerNotifications(user.id).then(setNotifications); })
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
    } catch { /* silently fail */ }
  };

  if (loading) return null;
  if (!user) return null;

  /* Modal abonnement */
  if (showSubscription) {
    return (
      <SubscriptionModal
        sellerId={user.id}
        onPaid={() => { setShowSubscription(false); refreshSub(user.id); }}
        onClose={() => setShowSubscription(false)}
      />
    );
  }

  return (
    <MobileLayout mode="seller">
      <MobileHeader
        title="Mes produits"
        rightAction={
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleOpenNotifs} className="relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Link to="/seller/add"
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center active:scale-90 transition-transform">
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
        {/* Déconnexion + S'abonner */}
        <div className="space-y-2">
          <button type="button" onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-semibold text-muted-foreground bg-card active:scale-[0.98] transition-transform">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
          <button
            onClick={() => setShowSubscription(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-green-500 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-transform"
          >
            <Star className="w-4 h-4" />
            S'abonner — 1 000 F CFA / mois
          </button>
        </div>

        {/* Stats */}
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
                  <img src={product.image} alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => navigate(`/seller/edit/${product.id}`)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(product.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-sm font-bold text-primary tabular-nums">{formatPriceFcfa(product.reducedPrice)}</span>
                      <span className="text-[10px] text-muted-foreground line-through tabular-nums">{formatPriceFcfa(product.originalPrice)}</span>
                      <span className="text-[10px] font-semibold text-primary bg-accent px-1.5 py-0.5 rounded-full">-{discount}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        expiry.urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
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
