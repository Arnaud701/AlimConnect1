import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, Star, Clock } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { saveOrdersToDB, upsertRating, Product } from "@/lib/mock-data";
import { clearCart } from "@/lib/cart";
import { useAuth } from "@/context/AuthContext";
import { formatPriceFcfa } from "@/lib/utils";

const WAVE_MERCHANT_CODE = "221766470572";
const OM_MERCHANT_CODE   = "770902489";

interface CheckoutItem { product: Product; quantity: number }
interface RatingTarget  { sellerId: string; sellerName: string; given: number }

type Step = "payment" | "confirm" | "rating" | "done";

const Checkout = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  const items: CheckoutItem[] = location.state?.items ?? [];
  const total: number         = items.reduce((s, i) => s + i.product.reducedPrice * i.quantity, 0);

  const [step,    setStep]    = useState<Step>("payment");
  const [method,  setMethod]  = useState<"wave" | "om" | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [ratings, setRatings] = useState<RatingTarget[]>(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.product.sellerId, i.product.name));
    return Array.from(map.keys()).map((sid) => ({
      sellerId: sid,
      sellerName: map.get(sid) ?? "Vendeur",
      given: 0,
    }));
  });

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const waveUrl = `https://pay.wave.com/m/${WAVE_MERCHANT_CODE}?amount=${Math.round(total)}&currency=XOF`;
  const omUssd  = `*144*1*${Math.round(total)}*${OM_MERCHANT_CODE}#`;

  const handlePayWith = (m: "wave" | "om") => {
    setMethod(m);
    if (m === "wave") {
      window.open(waveUrl, "_blank");
    } else {
      window.open(`tel:${omUssd}`);
    }
    setTimeout(() => setStep("confirm"), 800);
  };

  const handleConfirmPayment = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOrdersToDB(user.id, items);
      clearCart();
      setStep("rating");
    } catch {
      setStep("rating"); // best-effort
    } finally {
      setSaving(false);
    }
  };

  const setGiven = (sellerId: string, value: number) =>
    setRatings((prev) => prev.map((r) => r.sellerId === sellerId ? { ...r, given: value } : r));

  const handleSubmitRatings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all(ratings.filter((r) => r.given > 0).map((r) => upsertRating(user.id, r.sellerId, r.given)));
    } finally {
      setSaving(false);
      navigate("/marketplace", { replace: true });
    }
  };

  // ── ÉTAPE RATING ─────────────────────────────────────────────────
  if (step === "rating") {
    return (
      <MobileLayout mode="client">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 px-4 py-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Paiement confirmé !</h1>
              <p className="text-sm text-muted-foreground">Notez vos vendeurs pour aider la communauté</p>
            </div>

            {ratings.map((r) => (
              <div key={r.sellerId} className="bg-card rounded-2xl border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">{r.sellerName}</p>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setGiven(r.sellerId, star)}>
                      <Star className={`w-8 h-8 transition-all ${star <= r.given ? "fill-yellow-400 text-yellow-400 scale-110" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleSubmitRatings} disabled={saving}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold disabled:opacity-60">
              {saving ? "Envoi..." : "Terminer"}
            </button>
            <button onClick={() => navigate("/marketplace", { replace: true })} className="w-full text-sm text-muted-foreground py-2 text-center">
              Passer
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ── ÉTAPE CONFIRMATION ───────────────────────────────────────────
  if (step === "confirm") {
    return (
      <MobileLayout mode="client">
        <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setStep("payment")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Confirmer le paiement</h1>
          </div>
        </header>
        <div className="px-4 py-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">En attente de paiement</p>
            </div>
            <p className="text-xs text-amber-700">
              {method === "wave"
                ? "Vérifiez l'application Wave et validez le paiement."
                : `Composez ${omUssd} sur votre téléphone pour payer via Orange Money.`}
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Récapitulatif</p>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-foreground">{item.product.name} ×{item.quantity}</span>
                <span className="font-semibold tabular-nums">{formatPriceFcfa(item.product.reducedPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-3 border-t flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-primary tabular-nums text-lg">{formatPriceFcfa(total)}</span>
            </div>
          </div>

          <button onClick={handleConfirmPayment} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-2xl font-semibold text-base shadow-lg shadow-green-500/20 disabled:opacity-60 active:scale-[0.98] transition-transform">
            <ShieldCheck className="w-5 h-5" />
            {saving ? "Enregistrement..." : "J'ai effectué le paiement"}
          </button>

          <button onClick={() => setStep("payment")} className="w-full text-sm text-muted-foreground py-2 text-center">
            Changer de méthode
          </button>
        </div>
      </MobileLayout>
    );
  }

  // ── ÉTAPE PAIEMENT ───────────────────────────────────────────────
  return (
    <MobileLayout mode="client">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Paiement</h1>
        </div>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Résumé commande */}
        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Votre commande</p>
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">{item.product.category} · ×{item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-primary tabular-nums flex-shrink-0">{formatPriceFcfa(item.product.reducedPrice * item.quantity)}</p>
            </div>
          ))}
          <div className="pt-3 border-t flex justify-between items-center">
            <span className="font-bold text-foreground">Total à payer</span>
            <span className="text-2xl font-bold text-primary tabular-nums">{formatPriceFcfa(total)}</span>
          </div>
        </div>

        {/* Méthodes de paiement */}
        <p className="text-sm font-semibold text-foreground px-1">Choisissez votre méthode</p>

        {/* Wave */}
        <button
          onClick={() => handlePayWith("wave")}
          className="w-full flex items-center gap-4 bg-[#1352DE] text-white p-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-[#1352DE]/30"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-[#1352DE] font-black text-lg">W</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-base">Payer avec Wave</p>
            <p className="text-xs text-white/80">Paiement mobile instantané</p>
          </div>
          <ExternalLink className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>

        {/* Orange Money */}
        <button
          onClick={() => handlePayWith("om")}
          className="w-full flex items-center gap-4 bg-orange-500 text-white p-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-orange-500 font-black text-lg">OM</span>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-base">Orange Money</p>
            <p className="text-xs text-white/80">USSD · {omUssd}</p>
          </div>
          <ExternalLink className="w-5 h-5 text-white/70 flex-shrink-0" />
        </button>

        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pt-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Paiement sécurisé · Senegal</span>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Checkout;
