import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, MapPin, Check, ImagePlus, Wallet } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { upsertSellerProfile, uploadProductImageWeb } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SHOP_TYPES = ["boutique", "supermarché", "supérette", "boulangerie", "épicerie"];

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ", Sénégal")}&format=json&limit=1&countrycodes=sn`;
    const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

const SellerOnboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [form, setForm] = useState({ name: "", type: "", address: "", paymentMethod: "", paymentNumber: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "seller") navigate("/auth/seller", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Veuillez entrer le nom de votre boutique."); return; }
    if (!form.type) { toast.error("Veuillez choisir un type de commerce."); return; }
    if (!form.address.trim()) { toast.error("Veuillez entrer l'adresse de votre boutique."); return; }
    if (!imageFile) { toast.error("Veuillez ajouter une photo de votre boutique."); return; }
    if (!form.paymentMethod) { toast.error("Veuillez choisir un moyen de paiement."); return; }
    if (!form.paymentNumber.trim()) { toast.error("Veuillez entrer votre numéro de compte."); return; }

    setSubmitting(true);
    setGeocoding(true);
    try {
      const coords = await geocodeAddress(form.address);
      setGeocoding(false);
      if (!coords) { toast.error("Adresse introuvable. Soyez plus précis (ex: Rue X, Dakar)."); setSubmitting(false); return; }

      const imageUrl = await uploadProductImageWeb(imageFile, user.id);
      await upsertSellerProfile(user.id, {
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim(),
        lat: coords.lat,
        lng: coords.lng,
        imageUrl,
        paymentMethod: form.paymentMethod,
        paymentNumber: form.paymentNumber.trim(),
      });
      toast.success("Boutique configurée !");
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la configuration.");
    } finally {
      setSubmitting(false);
      setGeocoding(false);
    }
  };

  return (
    <MobileLayout mode="seller">
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Configurez votre boutique</h1>
          <p className="text-sm text-muted-foreground">Ces informations seront visibles par les clients</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo boutique */}
          <div className="border-2 border-dashed rounded-2xl p-5 text-center">
            <label htmlFor="shop-image" className="cursor-pointer block">
              {imagePreview ? (
                <img src={imagePreview} alt="Boutique" className="mx-auto h-28 w-28 rounded-2xl object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Photo de votre boutique</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">{imagePreview ? "Changer la photo" : "Appuyez pour choisir"}</p>
            </label>
            <input id="shop-image" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Nom boutique */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Nom de la boutique</label>
            <input
              type="text" required value={form.name} onChange={(e) => update("name", e.target.value)}
              placeholder="Ex: Épicerie Chez Fatou"
              className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Type de commerce</label>
            <div className="flex flex-wrap gap-2">
              {SHOP_TYPES.map((t) => (
                <button type="button" key={t} onClick={() => update("type", t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${form.type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Adresse (Sénégal)
            </label>
            <input
              type="text" required value={form.address} onChange={(e) => update("address", e.target.value)}
              placeholder="Ex: Rue 10, Almadies, Dakar"
              className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground">Soyez précis pour apparaître sur la carte</p>
          </div>

          {/* Moyen de paiement */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Compte de réception des paiements
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => update("paymentMethod", "wave")}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${form.paymentMethod === "wave" ? "border-[#1352DE] bg-[#1352DE]/10 text-[#1352DE]" : "border-border text-muted-foreground"}`}>
                Wave
              </button>
              <button type="button" onClick={() => update("paymentMethod", "orange_money")}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${form.paymentMethod === "orange_money" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-border text-muted-foreground"}`}>
                Orange Money
              </button>
            </div>
            {form.paymentMethod && (
              <input
                type="tel"
                value={form.paymentNumber}
                onChange={(e) => update("paymentNumber", e.target.value)}
                placeholder={form.paymentMethod === "wave" ? "Ex: 77 123 45 67" : "Ex: 77 123 45 67"}
                className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mt-2"
              />
            )}
            <p className="text-[10px] text-muted-foreground">Ce numéro recevra vos paiements (95% de chaque vente)</p>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold disabled:opacity-60">
            {submitting ? (geocoding ? "Localisation en cours..." : "Enregistrement...") : <><Check className="w-5 h-5" /> Ouvrir ma boutique</>}
          </button>
        </form>
      </div>
    </MobileLayout>
  );
};

export default SellerOnboarding;
