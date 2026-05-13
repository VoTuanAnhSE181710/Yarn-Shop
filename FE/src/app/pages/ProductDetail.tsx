import { useParams, Link, useNavigate } from "react-router";
import { ArrowLeft, Heart, ShoppingCart } from "lucide-react";
import { products } from "../data/products";

interface ProductDetailProps {
  onAddToCart: (productId: string) => void;
}

export function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2>Product Not Found</h2>
          <Link to="/shop" className="text-primary hover:underline mt-4 inline-block">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    onAddToCart(product.id);
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1>{product.name}</h1>
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <Heart className="w-6 h-6" />
                </button>
              </div>
              <p className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</p>
            </div>

            <p className="text-lg text-muted-foreground">{product.description}</p>

            {product.category === "yarn" && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-2xl">
                <h3>Yarn Details</h3>
                {product.color && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span>{product.color}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span>{product.weight}</span>
                  </div>
                )}
                {product.yardage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yardage:</span>
                    <span>{product.yardage} yards</span>
                  </div>
                )}
              </div>
            )}

            {product.category === "kit" && (
              <div className="space-y-3">
                {product.difficulty && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm capitalize">
                      {product.difficulty}
                    </span>
                  </div>
                )}
                {product.materials && product.materials.length > 0 && (
                  <div>
                    <h3 className="mb-2">What's Included:</h3>
                    <ul className="space-y-2">
                      {product.materials.map((material, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="w-full bg-card text-foreground py-4 rounded-full border border-border hover:bg-muted transition-colors">
                Add to Wishlist
              </button>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                ✨ Free shipping on orders over $50 • 30-day returns • Made with love
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="mb-6">You Might Also Like</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products
              .filter((p) => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((related) => (
                <Link
                  key={related.id}
                  to={`/product/${related.id}`}
                  className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={related.image}
                      alt={related.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="line-clamp-1">{related.name}</h4>
                    <p className="text-primary font-semibold mt-2">
                      ${related.price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
