import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, Star, Clock, AlertTriangle } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { saveOrdersToDB, upsertRating, Product } from "@/lib/mock-data";
import { clearCart } from "@/lib/cart";
import { useAuth } from "@/context/AuthContext";
import { formatPriceFcfa } from "@/lib/utils";

const WAVE_BASE_URL    = "https://pay.wave.com/m/M_sn_qApmbNWkrVuw/c/sn/";
const OM_QR_IMAGE      = "/om-qr.jpeg";
const OM_MERCHANT_CODE = "770902489";

const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

interface CheckoutItem { product: Product; quantity: number }
interface RatingTarget  { sellerId: string; sellerName: string; given: number }

type Step = "payment" | "confirm" | "rating" | "done";

const Checkout = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();

  const items: CheckoutItem[] = location.state?.items ?? [];
  const total: number         = items.reduce((s, i) => s + i.product.reducedPrice * i.quantity, 0);
  const commission: number    = Math.round(total * 0.05);
  const sellerAmount: number  = total - commission;

  const [step,         setStep]        = useState<Step>("payment");
  const [method,       setMethod]      = useState<"wave" | "om" | null>(null);
  const [saving,       setSaving]      = useState(false);
  const [paidAmount,   setPaidAmount]  = useState("");
  const [amountError,  setAmountError] = useState<string | null>(null);
  const [showOMQR,     setShowOMQR]    = useState(false);
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

  const waveUrl = `${WAVE_BASE_URL}?amount=${Math.round(total)}&currency=XOF`;
  const omUssd  = `*144*1*${Math.round(total)}*${OM_MERCHANT_CODE}#`;

  const handlePayWith = (m: "wave" | "om") => {
    setMethod(m);
    setPaidAmount("");
    setAmountError(null);
    if (m === "wave") {
      window.open(waveUrl, "_blank");
      setTimeout(() => setStep("confirm"), 800);
    } else if (isMobile()) {
      window.open(`tel:${omUssd}`);
      setTimeout(() => setStep("confirm"), 800);
    } else {
      setShowOMQR(true);
    }
  };

  const validateAndConfirm = () => {
    const paid = Number(paidAmount.trim());
    if (!paidAmount.trim() || isNaN(paid)) {
      setAmountError("Veuillez entrer le montant que vous avez payé.");
      return;
    }
    if (paid < total) {
      setAmountError("Solde insuffisant. Le montant payé est inférieur au total de la commande.");
      return;
    }
    if (paid > total) {
      setAmountError("Le montant est supérieur au prix du produit, veuillez vérifier.");
      return;
    }
    setAmountError(null);
    handleConfirmPayment();
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
                : isMobile()
                  ? "Complétez le paiement via l'application Orange Money ouverte sur votre téléphone."
                  : "Scannez le QR code Orange Money ci-dessous avec votre application."}
            </p>
            {method === "om" && !isMobile() && (
              <img src={OM_QR_IMAGE} alt="QR Code Orange Money" className="w-40 h-40 object-contain mx-auto rounded-xl border mt-3" />
            )}
          </div>

          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Récapitulatif</p>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-foreground">{item.product.name} ×{item.quantity}</span>
                <span className="font-semibold tabular-nums">{formatPriceFcfa(item.product.reducedPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">Total payé</span>
                <span className="font-bold text-primary tabular-nums text-lg">{formatPriceFcfa(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vendeur (95%)</span>
                <span className="text-green-600 font-semibold tabular-nums">{formatPriceFcfa(sellerAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Frais AlimConnect (5%)</span>
                <span className="tabular-nums">{formatPriceFcfa(commission)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground px-1">
              Montant que vous avez payé (F CFA)
            </label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => { setPaidAmount(e.target.value); setAmountError(null); }}
              placeholder={`Montant attendu : ${Math.round(total)}`}
              className="w-full border rounded-2xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {amountError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{amountError}</p>
              </div>
            )}
          </div>

          <button onClick={validateAndConfirm} disabled={saving}
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

  // ── MODAL QR CODE ORANGE MONEY ───────────────────────────────────
  if (showOMQR) {
    return (
      <MobileLayout mode="client">
        <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setShowOMQR(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Orange Money</h1>
          </div>
        </header>
        <div className="px-4 py-8 space-y-6 flex flex-col items-center">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Scannez ce QR code avec votre app Orange Money</p>
            <p className="text-xs text-muted-foreground">Montant à payer : <span className="font-bold text-orange-500">{formatPriceFcfa(total)}</span></p>
          </div>
          <div className="border-4 border-orange-500 rounded-3xl p-3 bg-white shadow-lg shadow-orange-500/20">
            <img src={OM_QR_IMAGE} alt="QR Code Orange Money" className="w-56 h-56 object-contain rounded-xl" />
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 w-full space-y-1">
            <p className="text-xs font-semibold text-orange-800">Comment payer ?</p>
            <ol className="text-xs text-orange-700 space-y-1 list-decimal list-inside">
              <li>Ouvrez l'application Orange Money</li>
              <li>Appuyez sur "Scanner" ou "QR Code"</li>
              <li>Scannez ce code et confirmez le paiement</li>
            </ol>
          </div>
          <button
            onClick={() => { setShowOMQR(false); setStep("confirm"); }}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform">
            J'ai scanné et payé
          </button>
          <button onClick={() => setShowOMQR(false)} className="text-sm text-muted-foreground">
            Annuler
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
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">Total à payer</span>
              <span className="text-2xl font-bold text-primary tabular-nums">{formatPriceFcfa(total)}</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Reversé au vendeur (95%)</span>
                <span className="font-semibold text-green-600 tabular-nums">{formatPriceFcfa(sellerAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frais de service AlimConnect (5%)</span>
                <span className="font-semibold tabular-nums">{formatPriceFcfa(commission)}</span>
              </div>
            </div>
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
            <p className="text-xs text-white/80">Scanner le QR code</p>
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
