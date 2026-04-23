import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Leaf, ShoppingBag, Store, ArrowRight, TrendingDown, MapPin, Clock } from "lucide-react";
import heroPanier from "@/assets/panier.png";
import heroFood from "@/assets/hero-food.jpg";
import ScrollReveal from "@/components/ScrollReveal";
import MobileLayout from "@/components/MobileLayout";
import MobileHeader from "@/components/MobileHeader";

const heroImages = [
  { src: heroPanier, alt: "Panier de courses anti-gaspi" },
  { src: heroFood, alt: "Produits frais" },
  { src: "https://images.unsplash.com/photo-1601598851547-4302969d0614?w=800&h=500&fit=crop", alt: "Rayon supermarché" },
  { src: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=500&fit=crop", alt: "Épicerie fraîche" },
];

const Index = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <MobileLayout mode="client">
      <MobileHeader showLogo />

      {/* Hero */}
      <section className="px-4 pt-4 pb-8">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ animation: "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          {/* Carousel images */}
          {heroImages.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              className="w-full h-56 sm:h-72 object-cover absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0, position: i === 0 ? "relative" : "absolute" }}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Indicateurs */}
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
              />
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" />
              Jusqu'à -70%
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight" style={{ lineHeight: "1.15" }}>
              Sauvez des aliments, faites des économies
            </h1>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="grid grid-cols-2 gap-3 mt-5"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards", opacity: 0 }}
        >
          <Link
            to="/auth/client"
            className="flex items-center gap-3 bg-primary text-primary-foreground p-4 rounded-2xl active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Acheter</p>
              <p className="text-xs opacity-80">Invendus dispo</p>
            </div>
          </Link>
          <Link
            to="/auth/seller"
            className="flex items-center gap-3 bg-card border p-4 rounded-2xl active:scale-[0.97] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Vendre</p>
              <p className="text-xs text-muted-foreground">Espace pro</p>
            </div>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-8">
        <ScrollReveal>
          <h2 className="text-xl font-bold text-foreground mb-5">Comment ça marche</h2>
        </ScrollReveal>
        <div className="space-y-3">
          {[
            { icon: MapPin, title: "Trouvez un commerce", desc: "Localisez les vendeurs proches de vous", color: "bg-accent" },
            { icon: ShoppingBag, title: "Réservez vos produits", desc: "Choisissez des invendus à prix réduits", color: "bg-accent" },
            { icon: Clock, title: "Récupérez & savourez", desc: "Passez au magasin et repartez heureux", color: "bg-accent" },
          ].map((step, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="flex items-center gap-4 bg-card rounded-2xl border p-4 active:scale-[0.98] transition-transform">
                <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0`}>
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Impact */}
      <section className="px-4 py-6">
        <ScrollReveal>
          <div className="bg-primary rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-primary-foreground/70 uppercase tracking-wider mb-4">
              Notre impact
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { value: "12,430", label: "Produits sauvés" },
                { value: "847", label: "Commerces" },
                { value: "38,200", label: "Utilisateurs" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-xl font-bold text-primary-foreground font-display tabular-nums">
                    {stat.value}
                  </div>
                  <p className="text-[10px] text-primary-foreground/70 mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="px-4 py-6">
        <ScrollReveal>
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Prêt à agir ?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Rejoignez AlimConnect et luttez contre le gaspillage alimentaire.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl text-sm font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-primary/20"
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 AlimConnect. Ensemble contre le gaspillage.</p>
      </footer>
    </MobileLayout>
  );
};

export default Index;
