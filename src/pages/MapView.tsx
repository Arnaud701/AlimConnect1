import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { fetchAllSellersFromDB, getClientLocation, haversineKm, SellerProfile } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Star, ExternalLink, Navigation } from "lucide-react";

// Fix icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const sellerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [14.6937, -17.4441];

const MapView = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [clientPos, setClientPos] = useState<[number, number] | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataReady, setDataReady] = useState(false);

  // Charger les données
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth/client", { replace: true }); return; }

    const load = async () => {
      try {
        const [allSellers, clientLoc] = await Promise.all([
          fetchAllSellersFromDB(),
          getClientLocation(user.id),
        ]);

        let pos: [number, number] | null = null;
        if (clientLoc) {
          pos = [clientLoc.lat, clientLoc.lng];
          setClientPos(pos);
        }

        const withDistance = allSellers.map((s) => {
          if (clientLoc && s.lat && s.lng) {
            const km = haversineKm(clientLoc.lat, clientLoc.lng, s.lat, s.lng);
            return { ...s, distance: km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km` };
          }
          return s;
        });
        withDistance.sort((a, b) => parseFloat(a.distance ?? "999") - parseFloat(b.distance ?? "999"));
        setSellers(withDistance);
      } finally {
        setLoadingData(false);
        setDataReady(true);
      }
    };
    load();
  }, [loading, user, navigate]);

  // Initialiser la carte Leaflet après que les données sont prêtes et le DOM monté
  useEffect(() => {
    if (!dataReady || !mapDivRef.current) return;
    if (mapRef.current) return; // déjà initialisée

    const center = clientPos ?? DEFAULT_CENTER;

    const map = L.map(mapDivRef.current, {
      center,
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const points: L.LatLng[] = [];

    // Marqueur client
    if (clientPos) {
      L.marker(clientPos, { icon: clientIcon })
        .addTo(map)
        .bindPopup("<strong>Ma position</strong>");
      points.push(L.latLng(clientPos[0], clientPos[1]));
    }

    // Marqueurs vendeurs
    sellers.filter((s) => s.lat && s.lng).forEach((seller) => {
      const popup = `
        <div style="min-width:150px;font-family:sans-serif;font-size:13px">
          <p style="font-weight:600;margin:0 0 2px">${seller.name}</p>
          <p style="color:#666;margin:0 0 4px;text-transform:capitalize">${seller.type ?? ""}</p>
          ${seller.rating > 0 ? `<p style="margin:0 0 2px">⭐ ${seller.rating}/5</p>` : ""}
          ${seller.distance ? `<p style="color:#16a34a;font-weight:600;margin:0 0 4px">${seller.distance}</p>` : ""}
          <a href="https://www.google.com/maps/search/?api=1&query=${seller.lat},${seller.lng}"
             target="_blank" style="color:#2563eb;font-size:12px">Voir l'itinéraire →</a>
        </div>`;
      L.marker([seller.lat, seller.lng], { icon: sellerIcon }).addTo(map).bindPopup(popup);
      points.push(L.latLng(seller.lat, seller.lng));
    });

    // Ajuster la vue sur tous les points
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }

    // Forcer le recalcul de taille
    setTimeout(() => map.invalidateSize(), 100);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [dataReady, sellers, clientPos]);

  return (
    <MobileLayout mode="client">
      <MobileHeader title="Carte" />

      {loadingData ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {/* Conteneur carte */}
          <div
            ref={mapDivRef}
            style={{ height: "300px", width: "100%", position: "relative", zIndex: 1 }}
          />

          {/* Légende */}
          <div className="flex items-center gap-4 px-4 py-2 bg-card border-b border-t text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Vous
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Vendeurs
            </span>
            {sellers.length > 0 && (
              <span>{sellers.length} vendeur{sellers.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {/* Liste vendeurs */}
          <div className="px-4 py-3 space-y-3">
            {sellers.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                  <MapPin className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Il n'y a pas de vendeur pour le moment</p>
                <p className="text-xs text-muted-foreground">Les vendeurs inscrits apparaîtront ici</p>
              </div>
            ) : (
              sellers.map((seller) => (
                <div key={seller.id} className="bg-card rounded-2xl border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{seller.name}</h3>
                      <span className="text-xs text-muted-foreground capitalize">{seller.type}</span>
                    </div>
                    {seller.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{seller.rating}/5</span>
                      </div>
                    )}
                  </div>
                  {seller.address && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{seller.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    {seller.distance && seller.distance !== "—" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <Navigation className="w-3 h-3" /> {seller.distance}
                      </span>
                    )}
                    {seller.lat && seller.lng && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${seller.lat},${seller.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary font-medium ml-auto"
                      >
                        Itinéraire <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default MapView;
