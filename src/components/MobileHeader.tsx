import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

interface MobileHeaderProps {
  title?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

const MobileHeader = ({ title, showLogo = false, rightAction }: MobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg safe-top">
      <div className="flex items-center justify-between h-14 px-4">
        {showLogo ? (
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">AlimConnect</span>
          </Link>
        ) : (
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
        )}
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
};

export default MobileHeader;
