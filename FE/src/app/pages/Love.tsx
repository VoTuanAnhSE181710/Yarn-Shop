import { Link } from "react-router";
import { Heart } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function Love() {
  const { favorites } = useFavorites();
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  if (favoriteProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="mb-3">Your Wishlist is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding products you love by clicking the heart icon on any product!
          </p>
          <Link
            to="/shop"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <h1>My Wishlist</h1>
          </div>
          <p className="text-muted-foreground">
            {favoriteProducts.length} {favoriteProducts.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
