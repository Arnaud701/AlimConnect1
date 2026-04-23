import { ReactNode, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";

interface MobileLayoutProps {
  children: ReactNode;
  mode: "client" | "seller";
}

const clientRoutes = ["/marketplace", "/sellers", "/", "/map"];
const sellerRoutes = ["/seller/dashboard", "/seller/add", "/marketplace"];

const MobileLayout = ({ children, mode }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const routes = mode === "client" ? clientRoutes : sellerRoutes;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Ignorer si le mouvement est plus vertical qu'horizontal
    if (Math.abs(dy) > Math.abs(dx)) return;
    // Ignorer les petits mouvements
    if (Math.abs(dx) < 60) return;

    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < routes.length - 1) {
      // Swipe gauche → onglet suivant
      navigate(routes[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe droite → onglet précédent
      navigate(routes[currentIndex - 1]);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="flex flex-col h-full bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <BottomTabBar mode={mode} />
    </div>
  );
};

export default MobileLayout;
