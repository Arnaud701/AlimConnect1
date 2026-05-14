import { ReactNode, useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomTabBar from "./BottomTabBar";

interface MobileLayoutProps {
  children: ReactNode;
  mode: "client" | "seller";
}

const clientRoutes = ["/marketplace", "/sellers", "/", "/map", "/client/transactions"];
const sellerRoutes = ["/seller/dashboard", "/seller/add", "/marketplace"];

const MobileLayout = ({ children, mode }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);
  const navDirection = useRef<"left" | "right" | null>(null);

  const [dragX, setDragX] = useState(0);
  const [animClass, setAnimClass] = useState("");

  const routes = mode === "client" ? clientRoutes : sellerRoutes;

  // Quand la route change, jouer l'animation d'entrée
  useEffect(() => {
    if (!navDirection.current) return;
    const cls = navDirection.current === "left" ? "slide-in-right" : "slide-in-left";
    setAnimClass(cls);
    navDirection.current = null;
    const t = setTimeout(() => setAnimClass(""), 300);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setDragX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontal.current === null) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;

    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex === -1) return;

    // Résistance aux bords
    if (dx < 0 && currentIndex >= routes.length - 1) { setDragX(dx * 0.15); return; }
    if (dx > 0 && currentIndex <= 0) { setDragX(dx * 0.15); return; }

    setDragX(dx * 0.45);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;

    if (!isHorizontal.current || Math.abs(dx) < 60) {
      setDragX(0);
      return;
    }

    const currentIndex = routes.indexOf(location.pathname);
    if (currentIndex === -1) { setDragX(0); return; }

    if (dx < 0 && currentIndex < routes.length - 1) {
      navDirection.current = "left";
      setDragX(0);
      navigate(routes[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      navDirection.current = "right";
      setDragX(0);
      navigate(routes[currentIndex - 1]);
    } else {
      setDragX(0);
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-background overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex-1 overflow-y-auto ${animClass}`}
        style={{
          transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
          transition: dragX !== 0 ? "none" : "transform 0.18s ease-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>
      <BottomTabBar mode={mode} />
    </div>
  );
};

export default MobileLayout;
