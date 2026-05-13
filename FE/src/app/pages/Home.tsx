import { Link, useNavigate } from "react-router";
import { Sparkles, Heart, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HomeProps {
  onSignIn?: () => void;
}

export function Home({ onSignIn }: HomeProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/shop");
    } else if (onSignIn) {
      onSignIn();
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 py-32 px-4 min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold text-foreground leading-tight">
              Find Your{" "}
              <span className="text-primary">Cozy</span>{" "}
              <span className="text-secondary">Corner</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Handcrafted yarn, beginner-friendly kits, and a community that gets it.
              Because crocheting isn't just a hobby—it's your escape from the chaos.
            </p>
            <div className="pt-4">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground px-12 py-5 rounded-full text-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Link
                to="/kits"
                className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                Browse DIY Kits
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                to="/community"
                className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                Join Community
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3>Beginner-Friendly</h3>
              <p className="text-muted-foreground mt-2">
                Never crocheted before? Our kits include everything you need plus easy video tutorials.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-secondary" />
              </div>
              <h3>Stress-Relief Approved</h3>
              <p className="text-muted-foreground mt-2">
                Join thousands who found their calm in the rhythm of crochet. It's basically meditation with yarn.
              </p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3>Creative Community</h3>
              <p className="text-muted-foreground mt-2">
                Share your makes, get inspired, and connect with fellow Gen Z crafters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why CozyStitch Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="mb-4">Why CozyStitch?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            We're not just another craft store. We're building a space where Gen Z can slow down,
            create something with their hands, and actually enjoy the process. No pressure,
            no perfection—just you, some yarn, and good vibes.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <div className="p-6 bg-card rounded-2xl border border-border">
              <h4>🎨 Curated for You</h4>
              <p className="text-muted-foreground mt-2">
                Every product is chosen with Gen Z aesthetics in mind. Think pastels, modern patterns, and Instagram-worthy results.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border">
              <h4>📚 Learn at Your Pace</h4>
              <p className="text-muted-foreground mt-2">
                Step-by-step video tutorials made by real people, not intimidating experts. We remember what it's like to be a total beginner.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border">
              <h4>💬 Join the Community</h4>
              <p className="text-muted-foreground mt-2">
                Share your works-in-progress, celebrate finished projects, or just vibe with people who get why you'd rather crochet than scroll.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border">
              <h4>🌱 Sustainable Choices</h4>
              <p className="text-muted-foreground mt-2">
                We prioritize eco-friendly materials and ethical sourcing because caring about the planet is non-negotiable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
