import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, Check } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { updateClientLocation } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`;
    const res = await fetch(url);
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

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

const ClientSetupLocation = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "client") navigate("/auth/client", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const handleGPS = () => {
    if (!navigator.geolocation) { toast.error("Géolocalisation non supportée."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setAddress(addr);
        setLocating(false);
        toast.success("Position détectée !");
      },
      () => { toast.error("Impossible d'accéder à votre position."); setLocating(false); },
      { timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { toast.error("Veuillez entrer votre adresse."); return; }
    setSubmitting(true);
    try {
      const coords = await geocodeAddress(address);
      if (!coords) { toast.error("Adresse introuvable. Essayez : Quartier, Ville (ex: Almadies, Dakar)"); setSubmitting(false); return; }
      await updateClientLocation(user.id, address.trim(), coords.lat, coords.lng);
      toast.success("Localisation enregistrée !");
      navigate("/marketplace", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout mode="client">
      <div className="px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Où êtes-vous ?</h1>
          <p className="text-sm text-muted-foreground">Pour trouver les vendeurs les plus proches de vous</p>
        </div>

        {/* GPS */}
        <button
          type="button" onClick={handleGPS} disabled={locating}
          className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary py-3.5 rounded-2xl font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          <Navigation className="w-5 h-5" />
          {locating ? "Localisation..." : "Utiliser ma position GPS"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou entrez votre adresse</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Almadies, Dakar"
            className="w-full px-4 py-3 rounded-2xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button type="submit" disabled={submitting || !address.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-semibold disabled:opacity-60">
            <Check className="w-5 h-5" />
            {submitting ? "Enregistrement..." : "Confirmer ma localisation"}
          </button>
        </form>

        <button onClick={() => navigate("/marketplace", { replace: true })} className="w-full text-sm text-muted-foreground py-2 text-center">
          Passer pour l'instant
        </button>
      </div>
    </MobileLayout>
  );
};

export default ClientSetupLocation;
