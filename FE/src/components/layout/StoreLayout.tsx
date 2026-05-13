import { Outlet } from "react-router";
import { Navigation } from "../../app/components/Navigation";
import { Footer } from "../../app/components/Footer";
import { useCart } from "../../hooks/useCart";

interface StoreLayoutProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export function StoreLayout({ onSignIn, onSignUp }: StoreLayoutProps) {
  const { cartCount } = useCart();

  return (
    <>
      <Navigation
        cartCount={cartCount}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
      />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
