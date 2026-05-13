import { Routes, Route, Navigate } from "react-router";
import { motion } from "motion/react";
import { StoreLayout } from "../components/layout/StoreLayout";
import { ProtectedRoute } from "../app/components/ProtectedRoute";
import { RoleProtectedRoute } from "../app/components/RoleProtectedRoute";
import { AuthPanel } from "../app/components/AuthPanel";
import { Home } from "../app/pages/Home";
import { Shop } from "../app/pages/Shop";
import { ProductDetail } from "../app/pages/ProductDetail";
import { Cart } from "../app/pages/Cart";
import { Community } from "../app/pages/Community";
import { Learn } from "../app/pages/Learn";
import { Kits } from "../app/pages/Kits";
import { Profile } from "../app/pages/Profile";
import { Purchased } from "../app/pages/Purchased";
import { Love } from "../app/pages/Love";
import { Checkout } from "../app/pages/Checkout";
import { AdminPage } from "../app/pages/admin/AdminPage";
import { StaffPage } from "../app/pages/staff/StaffPage";

interface AppRouterProps {
  authPanelOpen: boolean;
  authMode: "signin" | "signup";
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onCloseAuth: () => void;
}

export function AppRouter({
  authPanelOpen,
  authMode,
  onOpenSignIn,
  onOpenSignUp,
  onCloseAuth,
}: AppRouterProps) {
  return (
    <>
      <motion.div
        className="min-h-screen bg-background flex flex-col"
        animate={{
          scale: authPanelOpen ? 0.95 : 1,
          filter: authPanelOpen ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          {/* Store layout routes (with Navigation + Footer) */}
          <Route
            element={
              <StoreLayout onSignIn={onOpenSignIn} onSignUp={onOpenSignUp} />
            }
          >
            <Route path="/" element={<Home onSignIn={onOpenSignIn} />} />
            <Route path="/community" element={<Community />} />
            <Route path="/learn" element={<Learn />} />

            {/* Protected user routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/shop" element={<Shop />} />
              <Route path="/kits" element={<Kits />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/purchased" element={<Purchased />} />
              <Route path="/love" element={<Love />} />
            </Route>
          </Route>

          {/* Dashboard routes (no Navigation/Footer) */}
          <Route
            path="/admin/*"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <RoleProtectedRoute allowedRoles={["staff"]}>
                <StaffPage />
              </RoleProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>

      <AuthPanel
        isOpen={authPanelOpen}
        onClose={onCloseAuth}
        initialMode={authMode}
      />
    </>
  );
}
