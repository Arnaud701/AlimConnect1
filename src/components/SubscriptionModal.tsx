import { useState } from "react";
import { ArrowLeft, AlertTriangle, ExternalLink, ShieldCheck, Sparkles, Star } from "lucide-react";
import { activateSubscription } from "@/lib/subscription";

const WAVE_URL = "https://pay.wave.com/m/M_sn_qApmbNWkrVuw/c/sn/?amount=1000&currency=XOF";
const OM_QR_IMAGE = "/om-qr.jpeg";
const OM_USSD = "*144*1*1000*770902489#";
const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

interface Props {
  sellerId: string;
  onDone: () => void;
  onClose: () => void;
}

export default function SubscriptionModal({ sellerId, onDone, onClose }: Props) {
  const [step, setStep] = useState<"choice" | "payment" | "qr" | "confirm">("choice");
  const [paidAmount, setPaidAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartTrial = () => {
    onDone();
  };

  const handlePayWith = (m: "wave" | "om") => {
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
      onDone();
    } finally {
      setLoading(false);
    }
  };

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

  /* Étape choix */
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

        {/* Essai gratuit */}
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

        {/* Abonnement */}
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
