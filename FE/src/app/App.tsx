import { useState } from "react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AdminProvider } from "./context/AdminContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "../context/CartContext";
import { AppRouter } from "../router/AppRouter";

export default function App() {
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <FavoritesProvider>
            <CartProvider>
              <Toaster position="top-right" richColors />
              <BrowserRouter>
                <AppRouter
                  authPanelOpen={authPanelOpen}
                  authMode={authMode}
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
            </CartProvider>
          </FavoritesProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
