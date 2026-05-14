import { useState } from "react";
import { Gift, ShieldCheck, Clock, AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react";
import { startTrial, activateSubscription } from "@/lib/subscription";

const WAVE_URL = "https://pay.wave.com/m/M_sn_qApmbNWkrVuw/c/sn/?amount=1000&currency=XOF";
const OM_QR_IMAGE = "/om-qr.jpeg";
const OM_USSD = "*144*1*1000*770902489#";
const PRICE = 1000;

const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

type Step = "welcome" | "payment" | "confirm";

interface Props {
  sellerId: string;
  /** Appelé après que l'utilisateur a choisi essai ou payé */
  onDone: (newTrialStartAt: string) => void;
}

export default function TrialWelcomeModal({ sellerId, onDone }: Props) {
  const [step, setStep] = useState<Step>("welcome");
  const [method, setMethod] = useState<"wave" | "om" | null>(null);
  const [showOMQR, setShowOMQR] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinueTrial = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    try {
      await startTrial(sellerId);
    } finally {
      setLoading(false);
      onDone(now);
    }
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
      setShowOMQR(true);
    }
  };

  const handleConfirmPayment = async () => {
    const paid = Number(paidAmount.trim());
    if (!paidAmount.trim() || isNaN(paid)) {
      setAmountError("Veuillez entrer le montant que vous avez payé.");
      return;
    }
    if (paid < PRICE) {
      setAmountError(`Montant insuffisant. L'abonnement coûte ${PRICE} F CFA.`);
      return;
    }
    setLoading(true);
    const now = new Date().toISOString();
    try {
      await startTrial(sellerId);
      await activateSubscription(sellerId, now);
    } finally {
      setLoading(false);
      onDone(now);
    }
  };

  /* ── QR Code Orange Money ───────────────────────────────────── */
  if (showOMQR) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setShowOMQR(false)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Orange Money</h1>
          </div>
        </header>
        <div className="flex-1 px-4 py-8 flex flex-col items-center gap-6">
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Scannez ce QR code avec Orange Money</p>
            <p className="text-xs text-muted-foreground">Montant : <span className="font-bold text-orange-500">1 000 F CFA</span></p>
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
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
          >
            J'ai scanné et payé
          </button>
        </div>
      </div>
    );
  }

  /* ── Confirmation paiement ─────────────────────────────────── */
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
        <div className="px-4 py-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">En attente de confirmation</p>
            </div>
            <p className="text-xs text-amber-700">
              {method === "wave"
                ? "Vérifiez l'application Wave et validez le paiement de 1 000 F CFA."
                : isMobile()
                  ? "Complétez le paiement via Orange Money."
                  : "Confirmez après avoir scanné le QR code Orange Money."}
            </p>
          </div>

          <div className="bg-card rounded-2xl border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Récapitulatif</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Abonnement AlimConnect Vendeur</span>
              <span className="text-sm font-bold text-primary tabular-nums">1 000 F</span>
            </div>
            <p className="text-[11px] text-muted-foreground">30 jours · démarrage à la fin de l'essai gratuit</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground px-1">Montant que vous avez payé (F CFA)</label>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => { setPaidAmount(e.target.value); setAmountError(null); }}
              placeholder="1000"
              className="w-full border rounded-2xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {amountError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{amountError}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-green-500/20 disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            <ShieldCheck className="w-5 h-5" />
            {loading ? "Activation en cours..." : "J'ai effectué le paiement"}
          </button>
          <button onClick={() => setStep("payment")} className="w-full text-sm text-muted-foreground py-2 text-center">
            Changer de méthode
          </button>
        </div>
      </div>
    );
  }

  /* ── Choix de la méthode de paiement ──────────────────────── */
  if (step === "payment") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="flex items-center gap-3 h-14 px-4">
            <button onClick={() => setStep("welcome")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Abonnement — 1 000 F CFA / mois</h1>
          </div>
        </header>
        <div className="px-4 py-6 space-y-4">
          <div className="bg-card rounded-2xl border p-5 space-y-1">
            <p className="text-base font-bold text-foreground">Abonnement AlimConnect Vendeur</p>
            <p className="text-xs text-muted-foreground">30 jours · démarre à la fin de vos 7 jours d'essai</p>
            <p className="text-3xl font-bold text-primary mt-2 tabular-nums">1 000 F CFA</p>
          </div>

          <p className="text-sm font-semibold text-foreground px-1">Choisissez votre méthode</p>

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

          <button
            onClick={() => handlePayWith("om")}
            className="w-full flex items-center gap-4 bg-orange-500 text-white p-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-orange-500 font-black text-lg">OM</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base">Orange Money</p>
              <p className="text-xs text-white/80">QR Code ou USSD</p>
            </div>
            <ExternalLink className="w-5 h-5 text-white/70 flex-shrink-0" />
          </button>
        </div>
      </div>
    );
  }

  /* ── Écran d'accueil (welcome) ─────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 px-6 py-10 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bienvenue sur AlimConnect !</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vous bénéficiez d'un <span className="font-bold text-foreground">essai gratuit de 7 jours</span> pour vendre vos produits sans restriction.
          </p>
        </div>

        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <p className="text-sm font-bold text-foreground">Ce que vous obtenez :</p>
          {[
            "7 jours d'accès complet gratuit",
            "Publiez autant de produits que vous voulez",
            "Recevez des commandes en temps réel",
            "Après l'essai : 1 000 F CFA / mois",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3 h-3 text-primary" />
              </div>
              <p className="text-sm text-foreground">{item}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-800">Payer maintenant = plus avantageux</p>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            Si vous payez maintenant, votre abonnement de 30 jours <span className="font-semibold">démarrera à la fin de l'essai</span>. Vous profitez donc de 7 jours gratuits + 30 jours payés.
          </p>
        </div>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={() => setStep("payment")}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          Payer maintenant — 1 000 F CFA
        </button>
        <button
          onClick={handleContinueTrial}
          disabled={loading}
          className="w-full bg-muted text-foreground py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? "Chargement..." : "Continuer avec les 7 jours d'essai"}
        </button>
      </div>
    </div>
  );
}
