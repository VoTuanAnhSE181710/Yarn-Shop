import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router";
import { motion } from "motion/react";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { AuthPanel } from "./components/AuthPanel";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Community } from "./pages/Community";
import { Learn } from "./pages/Learn";
import { Kits } from "./pages/Kits";
import { Profile } from "./pages/Profile";
import { Purchased } from "./pages/Purchased";
import { Love } from "./pages/Love";
import { Checkout } from "./pages/Checkout";
import { AdminPage } from "./pages/admin/AdminPage";
import { StaffPage } from "./pages/staff/StaffPage";

interface CartItem {
  productId: string;
  quantity: number;
}

interface AppContentProps {
  cartItems: CartItem[];
  authPanelOpen: boolean;
  authMode: "signin" | "signup";
  onAddToCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  cartCount: number;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onCloseAuth: () => void;
}

function AppContent({
  cartItems,
  authPanelOpen,
  authMode,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  cartCount,
  onOpenSignIn,
  onOpenSignUp,
  onCloseAuth,
}: AppContentProps) {
  const location = useLocation();
  const isDashboard =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff");

  return (
    <>
      <motion.div
        className="min-h-screen bg-background flex flex-col"
        animate={{
          scale: authPanelOpen && !isDashboard ? 0.95 : 1,
          filter: authPanelOpen && !isDashboard ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Show navigation only on store pages */}
        {!isDashboard && (
          <Navigation
            cartCount={cartCount}
            onSignIn={onOpenSignIn}
            onSignUp={onOpenSignUp}
          />
        )}

        <div className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home onSignIn={onOpenSignIn} />} />
            <Route path="/home" element={<Home onSignIn={onOpenSignIn} />} />
            <Route path="/community" element={<Community />} />
            <Route path="/learn" element={<Learn />} />

            {/* Protected user routes */}
            <Route
              path="/shop"
              element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kits"
              element={
                <ProtectedRoute>
                  <Kits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute>
                  <ProductDetail onAddToCart={onAddToCart} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart
                    cartItems={cartItems}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout cartItems={cartItems} onClearCart={onClearCart} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchased"
              element={
                <ProtectedRoute>
                  <Purchased />
                </ProtectedRoute>
              }
            />
            <Route
              path="/love"
              element={
                <ProtectedRoute>
                  <Love />
                </ProtectedRoute>
              }
            />

            {/* Admin dashboard routes — no store navbar/footer */}
            <Route
              path="/admin/*"
              element={
                <RoleProtectedRoute allowedRoles={["admin"]}>
                  <AdminPage />
                </RoleProtectedRoute>
              }
            />

            {/* Staff dashboard route — no store navbar/footer */}
            <Route
              path="/staff"
              element={
                <RoleProtectedRoute allowedRoles={["staff"]}>
                  <StaffPage />
                </RoleProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Show footer only on store pages */}
        {!isDashboard && <Footer />}
      </motion.div>

      <AuthPanel
        isOpen={authPanelOpen}
        onClose={onCloseAuth}
        initialMode={authMode}
      />
    </>
  );
}

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const handleAddToCart = (productId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <FavoritesProvider>
            <Toaster position="top-right" richColors />
            <BrowserRouter>
              <AppContent
                cartItems={cartItems}
                authPanelOpen={authPanelOpen}
                authMode={authMode}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                cartCount={cartCount}
                onOpenSignIn={() => {
                  setAuthMode("signin");
                  setAuthPanelOpen(true);
                }}
                onOpenSignUp={() => {
                  setAuthMode("signup");
                  setAuthPanelOpen(true);
                }}
                onCloseAuth={() => setAuthPanelOpen(false)}
              />
            </BrowserRouter>
          </FavoritesProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
