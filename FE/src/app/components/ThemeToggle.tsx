import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  size?: "sm" | "md";
}

export function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const btnSize = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`${btnSize} rounded-full flex items-center justify-center transition-colors duration-300 border border-border bg-card hover:bg-muted text-foreground`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={iconSize + " flex items-center justify-center"}
      >
        {isDark ? (
          <Sun className={iconSize + " text-amber-400"} />
        ) : (
          <Moon className={iconSize + " text-slate-600"} />
        )}
      </motion.span>
    </motion.button>
  );
}
