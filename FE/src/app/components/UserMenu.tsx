import { useState, useRef, useEffect } from "react";
import { User, ShoppingBag, LogOut, ChevronDown, Shield, Users as UsersIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    signOut();
    setIsOpen(false);
    navigate("/");
    toast.success("You've been signed out", {
      description: "Come back soon for more cozy crafting!",
    });
  };

  const roleLabel =
    user.role === "admin" ? "Administrator" : user.role === "staff" ? "Staff Member" : "Member";
  const RoleIcon = user.role === "admin" ? Shield : user.role === "staff" ? UsersIcon : User;
  const roleBadgeClass =
    user.role === "admin"
      ? "bg-destructive/10 text-destructive"
      : user.role === "staff"
      ? "bg-secondary/20 text-secondary-foreground"
      : "bg-primary/10 text-primary";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full border-2 border-primary/20 object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card"></span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50"
          >
            {/* User info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-border object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full ${roleBadgeClass}`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="py-2">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-foreground"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span>My Profile</span>
              </Link>

              <Link
                to="/purchased"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-foreground"
              >
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-secondary" />
                </div>
                <span>Purchased Orders</span>
              </Link>

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors text-foreground group"
                >
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="w-4 h-4 text-destructive" />
                  </div>
                  <span className="text-destructive">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
