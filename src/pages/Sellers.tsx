import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import SellerCard from "@/components/SellerCard";
import { fetchAllSellersFromDB, getClientLocation, haversineKm, SellerProfile } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";

const Sellers = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth/client", { replace: true }); return; }

    const load = async () => {
      const [allSellers, clientLoc] = await Promise.all([
        fetchAllSellersFromDB(),
        user ? getClientLocation(user.id) : Promise.resolve(null),
      ]);

      const withDistance = allSellers.map((s) => {
        if (clientLoc && s.lat && s.lng) {
          const km = haversineKm(clientLoc.lat, clientLoc.lng, s.lat, s.lng);
          return { ...s, distance: km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km` };
        }
        return { ...s, distance: "—" };
      });

      withDistance.sort((a, b) => {
        const dA = parseFloat(a.distance ?? "999");
        const dB = parseFloat(b.distance ?? "999");
        return dA - dB;
      });

      setSellers(withDistance);
      setLoadingSellers(false);
    };
    load();
  }, [loading, user, navigate]);

  return (
    <MobileLayout mode="client">
      <MobileHeader title="Vendeurs partenaires" />
      <div className="px-4 py-4 space-y-3">
        {loadingSellers ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sellers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">Aucun vendeur disponible pour le moment.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{sellers.length} commerce{sellers.length > 1 ? "s" : ""} près de vous</p>
            {sellers.map((seller, i) => (
              <SellerCard key={seller.id} seller={seller} index={i} />
            ))}
          </>
        )}
      </div>
    </MobileLayout>
  );
};

export default Sellers;
