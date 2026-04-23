import { Clock, Star } from "lucide-react";
import { Product, sellers, getDaysUntilExpiry, getExpiryLabel, getDiscountPercentage } from "@/lib/mock-data";
import { formatPriceFcfa } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
  onAddToCart?: (product: Product) => void;
}

const ProductCard = ({ product, index = 0, onAddToCart }: ProductCardProps) => {
  const days = getDaysUntilExpiry(product.expiryDate);
  const expiry = getExpiryLabel(days);
  const discount = getDiscountPercentage(product.originalPrice, product.reducedPrice);
  const seller = sellers.find((s) => s.id === product.sellerId);

  return (
    <div
      className="group bg-card rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Discount badge */}
        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
          -{discount}%
        </div>
        {/* Expiry badge */}
        <div
          className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
            expiry.urgent
              ? "bg-destructive text-destructive-foreground"
              : "bg-card/90 backdrop-blur-sm text-foreground"
          }`}
        >
          <Clock className="w-3 h-3" />
          {expiry.text}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {product.category}
          </p>
          <h3 className="font-semibold text-foreground mt-1 leading-snug">{product.name}</h3>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

        {/* Seller */}
        {seller && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="font-medium text-foreground">{seller.rating}</span>
            </div>
            <span>·</span>
            <span>{seller.name}</span>
            <span>·</span>
            <span>{seller.distance}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between pt-2 border-t">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">{formatPriceFcfa(product.reducedPrice)}</span>
            <span className="text-sm text-muted-foreground line-through">
              {formatPriceFcfa(product.originalPrice)}
            </span>
          </div>
          <button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
