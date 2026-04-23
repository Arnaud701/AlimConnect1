import { MapPin, Star, ChevronRight } from "lucide-react";
import { SellerProfile } from "@/lib/mock-data";
import { Link } from "react-router-dom";

interface SellerCardProps {
  seller: SellerProfile;
  index?: number;
}

const SellerCard = ({ seller, index = 0 }: SellerCardProps) => {
  return (
    <Link
      to={`/marketplace?seller=${seller.id}`}
      className="group flex gap-4 bg-card rounded-xl border p-4 shadow-sm hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <img
        src={seller.image || "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop"}
        alt={seller.name}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {seller.name}
            </h3>
            <span className="inline-block mt-1 text-xs font-medium text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full capitalize">
              {seller.type}
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
        </div>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
            <span className="font-medium text-foreground">{seller.rating}</span>
            <span>({seller.reviewCount})</span>
          </div>
          {seller.distance && seller.distance !== "—" && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{seller.distance}</span>
            </div>
          )}
        </div>
        {seller.address && <p className="text-xs text-muted-foreground mt-1 truncate">{seller.address}</p>}
      </div>
    </Link>
  );
};

export default SellerCard;
