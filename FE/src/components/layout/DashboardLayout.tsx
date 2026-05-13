import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../app/context/AuthContext";
import { DashboardAvatarMenu } from "../../app/components/DashboardAvatarMenu";

export interface DashboardNavItem {
  path?: string;
  id?: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: DashboardNavItem[];
  panelTitle: string;
  roleLabel: string;
  roleBadgeClass: string;
  accentColor?: "primary" | "secondary";
  /** For tab-based dashboards (StaffPage), pass activeTab + onTabChange instead of path-based nav */
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

export function DashboardLayout({
  children,
  navItems,
  panelTitle,
  roleLabel,
  roleBadgeClass,
  accentColor = "primary",
  activeTab,
  onTabChange,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const accentBg = accentColor === "secondary" ? "bg-secondary" : "bg-primary";
  const accentText =
    accentColor === "secondary" ? "text-secondary-foreground" : "text-primary-foreground";
  const activeClass =
    accentColor === "secondary"
      ? "bg-secondary text-secondary-foreground"
      : "bg-primary text-primary-foreground";

  const isActive = (item: DashboardNavItem) => {
    if (onTabChange && item.id) return activeTab === item.id;
    if (item.path) return location.pathname === item.path;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 lg:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${accentBg} rounded-full flex items-center justify-center`}>
                <span className={`${accentText} text-xl`}>🧶</span>
              </div>
              <div>
                <h2 className="font-semibold">{panelTitle}</h2>
                <p className="text-xs text-muted-foreground">CozyStitch</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className={`w-9 h-9 rounded-full border-2 ${
                accentColor === "secondary" ? "border-secondary/20" : "border-primary/20"
              } object-cover`}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadgeClass}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              const key = item.path ?? item.id ?? item.label;

              if (onTabChange && item.id) {
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onTabChange(item.id!);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      active ? activeClass : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={key}
                  to={item.path!}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active ? activeClass : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-foreground hover:text-primary transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-auto">
            <DashboardAvatarMenu accentColor={accentColor} />
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
