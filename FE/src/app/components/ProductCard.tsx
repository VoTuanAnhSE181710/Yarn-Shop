import { Link } from "react-router";
import { Heart } from "lucide-react";
import { Product } from "../data/products";
import { useFavorites } from "../context/FavoritesContext";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isLiked = isFavorite(product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all relative"
    >
      <button
        onClick={handleFavoriteClick}
        className="absolute top-3 right-3 z-10 w-10 h-10 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
      >
        <motion.div
          initial={false}
          animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isLiked ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </motion.div>
      </button>

      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="line-clamp-2 flex-1">{product.name}</h4>
          {product.category === "kit" && product.difficulty && (
            <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full whitespace-nowrap">
              {product.difficulty}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-primary text-lg">
            ${product.price.toFixed(2)}
          </span>
          {product.color && (
            <span className="text-xs text-muted-foreground">{product.color}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
