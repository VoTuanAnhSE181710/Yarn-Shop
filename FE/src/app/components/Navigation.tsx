import { useState } from "react";
import { ShoppingCart, Heart, Menu, X } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";

interface NavigationProps {
  cartCount: number;
  onSignIn: () => void;
  onSignUp: () => void;
}

export function Navigation({ cartCount, onSignIn, onSignUp }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { favorites } = useFavorites();

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground">🧶</span>
            </div>
            <span className="font-semibold text-xl text-foreground">CozyStitch</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <Link to="/shop" className="text-foreground hover:text-primary transition-colors">
                Shop
              </Link>
            ) : (
              <button
                onClick={onSignIn}
                className="text-foreground hover:text-primary transition-colors"
              >
                Shop
              </button>
            )}
            {isAuthenticated ? (
              <Link to="/kits" className="text-foreground hover:text-primary transition-colors">
                DIY Kits
              </Link>
            ) : (
              <button
                onClick={onSignIn}
                className="text-foreground hover:text-primary transition-colors"
              >
                DIY Kits
              </button>
            )}
            <Link to="/community" className="text-foreground hover:text-primary transition-colors">
              Community
            </Link>
            <Link to="/learn" className="text-foreground hover:text-primary transition-colors">
              Learn
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <Link to="/love" className="relative text-foreground hover:text-primary transition-colors">
                <Heart className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/cart" className="relative text-foreground hover:text-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {!isAuthenticated && (
              <Link to="/cart" className="relative text-foreground hover:text-primary transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Avatar left, ThemeToggle right for users */}
                <UserMenu />
                <ThemeToggle size="sm" />
              </div>
            ) : (
              <>
                <ThemeToggle size="sm" />
                <button
                  onClick={onSignIn}
                  className="hidden sm:block text-foreground hover:text-primary transition-colors px-4 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignUp}
                  className="hidden sm:block bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-foreground hover:text-primary transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-foreground hover:text-primary transition-colors py-2"
              >
                Shop
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignIn();
                }}
                className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
              >
                Shop
              </button>
            )}
            {isAuthenticated ? (
              <Link
                to="/kits"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-foreground hover:text-primary transition-colors py-2"
              >
                DIY Kits
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignIn();
                }}
                className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
              >
                DIY Kits
              </button>
            )}
            <Link
              to="/community"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-foreground hover:text-primary transition-colors py-2"
            >
              Community
            </Link>
            <Link
              to="/learn"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-foreground hover:text-primary transition-colors py-2"
            >
              Learn
            </Link>
            {!isAuthenticated && (
              <div className="pt-3 border-t border-border space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignIn();
                  }}
                  className="block w-full text-left text-foreground hover:text-primary transition-colors py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignUp();
                  }}
                  className="block w-full bg-primary text-primary-foreground px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
