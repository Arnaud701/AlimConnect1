import { useState, useEffect } from "react";
import { ArrowLeft, Download, Share, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import ScrollReveal from "@/components/ScrollReveal";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <MobileLayout mode="client">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg safe-top">
        <div className="flex items-center gap-3 h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Installer l'app</h1>
        </div>
      </header>

      <div className="px-4 py-8">
        <ScrollReveal>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>

            {isInstalled ? (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">App installée !</h2>
                <p className="text-sm text-muted-foreground">
                  AlimConnect est déjà installée sur votre appareil.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Installez AlimConnect</h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ajoutez l'application sur votre écran d'accueil pour un accès rapide.
                </p>
              </div>
            )}

            {!isInstalled && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-semibold active:scale-[0.97] transition-transform shadow-lg shadow-primary/20"
              >
                <Download className="w-5 h-5" />
                Installer
              </button>
            )}

            {!isInstalled && !deferredPrompt && (
              <div className="bg-card rounded-2xl border p-6 text-left space-y-4">
                <h3 className="font-semibold text-foreground text-sm">Comment installer :</h3>
                {isIOS ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                      <p>Appuyez sur le bouton <Share className="inline w-4 h-4" /> Partager en bas du navigateur</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                      <p>Faites défiler et sélectionnez "Sur l'écran d'accueil"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                      <p>Appuyez sur "Ajouter"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                      <p>Ouvrez le menu du navigateur (⋮)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                      <p>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </MobileLayout>
  );
};

export default Install;
