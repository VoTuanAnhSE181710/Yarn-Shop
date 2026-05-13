import { useState } from "react";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "yarn" | "tools" | "kit">("all");

  const filteredProducts = selectedCategory === "all"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const categories = [
    { id: "all", label: "All Products" },
    { id: "yarn", label: "Yarn" },
    { id: "tools", label: "Tools" },
    { id: "kit", label: "DIY Kits" },
  ] as const;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2">Shop All</h1>
          <p className="text-muted-foreground">
            Everything you need to start your cozy crochet journey
          </p>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
