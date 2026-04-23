import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  sendPhoneOTP,
  verifyPhoneOTP,
  UserRole,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { getSellerProfile, getClientLocation } from "@/lib/mock-data";

type AuthMethod = "email" | "phone";

const Auth = () => {
  const navigate = useNavigate();
  const params = useParams<{ role: UserRole }>();
  const role: UserRole =
    params.role === "client" || params.role === "seller" ? params.role : "client";
  const { loading: authLoading, setUserDirectly } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<AuthMethod>("email");
  const [otpStep, setOtpStep] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      const user = getCurrentUser();
      if (user && user.role === role) {
        navigate(user.role === "seller" ? "/seller/dashboard" : "/marketplace", { replace: true });
      }
    }
  }, [authLoading, navigate, role]);

  const nav = async (user: { id: string; role: UserRole }) => {
    if (user.role === "seller") {
      const profile = await getSellerProfile(user.id);
      navigate(profile ? "/seller/dashboard" : "/seller/onboarding", { replace: true });
    } else {
      const loc = await getClientLocation(user.id);
      navigate(loc ? "/marketplace" : "/client/location", { replace: true });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const user = await loginUser(role, email, "", password);
        setUserDirectly(user);
        nav(user);
      } else {
        const user = await registerUser(role, firstName, lastName, email, "", password);
        setUserDirectly(user);
        nav(user);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'authentification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPhoneOTP(phone);
      setOtpStep(true);
      setSuccess("Code envoyé par SMS.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi du SMS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await verifyPhoneOTP(phone, otp, role);
      setUserDirectly(user);
      nav(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code invalide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    localStorage.setItem("alimconnect-pending-role", role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/" + role },
    });
    if (error) setError(error.message);
  };

  const inputCls =
    "w-full mt-1 px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <MobileLayout mode={role === "seller" ? "seller" : "client"}>
      <MobileHeader title={role === "seller" ? "Espace vendeur" : "Espace client"} />
      <div className="px-4 py-5 space-y-4">

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full rounded-xl border bg-card py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          Continuer avec Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Méthode */}
        <div className="flex gap-2">
          {(["email", "phone"] as AuthMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMethod(m); setOtpStep(false); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                method === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {m === "email" ? "Email + mot de passe" : "Téléphone (SMS)"}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-foreground">
            {mode === "login" ? "Connexion" : "Création de compte"}
          </h2>

          {/* ── EMAIL ───────────────────────────────────────── */}
          {method === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Prénom</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Nom</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className={inputCls} />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@domain.com" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls + " pr-10"} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-semibold disabled:opacity-60">
                {isSubmitting ? "Traitement..." : mode === "login" ? "Se connecter" : "Créer un compte"}
              </button>
            </form>
          )}

          {/* ── TÉLÉPHONE ────────────────────────────────────── */}
          {method === "phone" && !otpStep && (
            <form onSubmit={handlePhoneSend} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Prénom</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Nom</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" className={inputCls} />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Numéro de téléphone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+221 77 000 00 00" className={inputCls} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-semibold disabled:opacity-60">
                {isSubmitting ? "Envoi..." : "Recevoir le code SMS"}
              </button>
            </form>
          )}

          {/* ── OTP ─────────────────────────────────────────── */}
          {method === "phone" && otpStep && (
            <form onSubmit={handleOtpVerify} className="space-y-3">
              <p className="text-sm text-muted-foreground">Code envoyé au {phone}</p>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase">Code SMS</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} className={inputCls} />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary text-primary-foreground py-2 text-sm font-semibold disabled:opacity-60">
                {isSubmitting ? "Vérification..." : "Valider le code"}
              </button>
              <button type="button" onClick={() => { setOtpStep(false); setError(null); }} className="text-xs text-primary font-medium w-full text-center">
                Changer le numéro
              </button>
            </form>
          )}
        </div>

        <div className="flex justify-between items-center text-xs">
          {method === "email" && (
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} className="text-primary font-medium">
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          )}
          <Link to={role === "seller" ? "/auth/client" : "/auth/seller"} className="text-primary font-medium ml-auto">
            {role === "seller" ? "Passer au client" : "Passer au vendeur"}
          </Link>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Auth;
