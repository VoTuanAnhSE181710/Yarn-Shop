import { Link } from "react-router";
import { products } from "../data/products";
import { ProductCard } from "../components/ProductCard";

export function Kits() {
  const kits = products.filter((p) => p.category === "kit");

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="mb-4">DIY Kits</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need in one box. Just add your creativity (and maybe some
            lo-fi music).
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 mb-12 border border-border">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <h4>Complete Kits</h4>
              <p className="text-sm text-muted-foreground mt-2">
                All materials, tools, and instructions included. No guessing what to buy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎥</span>
              </div>
              <h4>Video Guides</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Step-by-step videos you can pause, rewind, and watch at your own pace.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <h4>Community Support</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Join other kit makers in our community to share progress and get help.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => (
            <ProductCard key={kit.id} product={kit} />
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
          <h2 className="mb-4">Not Sure Which Kit to Choose?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Take our 2-minute quiz to find the perfect project for your skill level and
            style. We'll match you with a kit you'll actually finish!
          </p>
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors">
            Take the Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
