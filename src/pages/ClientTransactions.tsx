import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, TrendingDown, Store, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";
import { fetchClientOrders, Order } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import { formatPriceFcfa } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

function groupByDate(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, o) => {
    const date = new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    (acc[date] = acc[date] ?? []).push(o);
    return acc;
  }, {});
}

function groupBySeller(orders: Order[]): Record<string, { name: string; count: number; total: number; orders: Order[] }> {
  return orders.reduce<Record<string, { name: string; count: number; total: number; orders: Order[] }>>((acc, o) => {
    if (!acc[o.sellerId]) acc[o.sellerId] = { name: o.sellerName, count: 0, total: 0, orders: [] };
    acc[o.sellerId].count  += o.quantity;
    acc[o.sellerId].total  += o.totalAmount;
    acc[o.sellerId].orders.push(o);
    return acc;
  }, {});
}

const ClientTransactions = () => {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab,      setTab]      = useState<"history" | "dashboard">("dashboard");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "client") { navigate("/auth/client", { replace: true }); return; }

    fetchClientOrders(user.id).then((o) => { setOrders(o); setFetching(false); });

    const channel = supabase
      .channel(`client-orders-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `client_id=eq.${user.id}` },
        () => { fetchClientOrders(user.id).then(setOrders); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loading, user, navigate]);

  const totalSpent  = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalItems  = orders.reduce((s, o) => s + o.quantity, 0);
  const byDate      = groupByDate(orders);
  const bySeller    = groupBySeller(orders);
  const sellerCount = Object.keys(bySeller).length;

  return (
    <MobileLayout mode="client">
      <MobileHeader title="Mes achats" />

      <div className="px-4 py-4 space-y-4">
        {/* Onglets */}
        <div className="flex bg-muted rounded-2xl p-1 gap-1">
          {(["dashboard", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {t === "dashboard" ? "Tableau de bord" : "Historique"}
            </button>
          ))}
        </div>

        {fetching ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Aucun achat pour l'instant</p>
            <p className="text-xs text-muted-foreground">Vos commandes apparaîtront ici</p>
            <button onClick={() => navigate("/marketplace")} className="mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold">
              Explorer le marché
            </button>
          </div>
        ) : tab === "dashboard" ? (
          /* ── DASHBOARD ─────────────────────────────────────────── */
          <div className="space-y-4">
            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShoppingBag, label: "Articles", value: totalItems, color: "bg-blue-50 text-blue-600" },
                { icon: Store,       label: "Vendeurs", value: sellerCount, color: "bg-purple-50 text-purple-600" },
                { icon: TrendingDown, label: "Économies", value: `${Math.round((orders.reduce((s, o) => s + o.quantity, 0))*100/Math.max(orders.length,1))}%`, color: "bg-green-50 text-green-600" },
              ].map((stat, i) => (
                <div key={i} className="bg-card rounded-2xl border p-3 text-center space-y-1">
                  <div className={`w-8 h-8 rounded-xl ${stat.color} flex items-center justify-center mx-auto`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Total dépensé */}
            <div className="bg-primary rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-primary-foreground/70 font-semibold uppercase tracking-wider">Total dépensé</p>
                <p className="text-2xl font-bold text-primary-foreground tabular-nums mt-1">{formatPriceFcfa(totalSpent)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>

            {/* Par vendeur */}
            <p className="text-sm font-bold text-foreground">Achats par vendeur</p>
            {Object.entries(bySeller)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([sid, s]) => (
                <div key={sid} className="bg-card rounded-2xl border overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === sid ? null : sid)}
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.count} article{s.count > 1 ? "s" : ""} · {s.orders.length} commande{s.orders.length > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary tabular-nums">{formatPriceFcfa(s.total)}</p>
                      {expanded === sid ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto mt-1" />}
                    </div>
                  </button>

                  {expanded === sid && (
                    <div className="border-t divide-y">
                      {s.orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between px-4 py-3 bg-muted/30">
                          <div>
                            <p className="text-xs font-medium text-foreground">{o.productName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString("fr-FR")} · ×{o.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-foreground tabular-nums">{formatPriceFcfa(o.totalAmount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          /* ── HISTORIQUE ─────────────────────────────────────────── */
          <div className="space-y-5">
            {Object.entries(byDate).map(([date, dayOrders]) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{date}</span>
                </div>
                {dayOrders.map((o) => (
                  <div key={o.id} className="bg-card rounded-2xl border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{o.productName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{o.sellerName} · ×{o.quantity}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-primary tabular-nums">{formatPriceFcfa(o.totalAmount)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatPriceFcfa(o.unitPrice)}/u</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default ClientTransactions;
