import { Routes, Route } from "react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
} from "lucide-react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsers } from "./AdminUsers";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { path: "/admin/payments", label: "Payments", icon: DollarSign },
  { path: "/admin/activity", label: "Activity Logs", icon: Activity },
];

export function AdminPage() {
  return (
    <DashboardLayout
      navItems={navItems}
      panelTitle="Admin Panel"
      roleLabel="Administrator"
      roleBadgeClass="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"
      accentColor="primary"
    >
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminOrders />} />
        <Route path="activity" element={<AdminDashboard />} />
      </Routes>
    </DashboardLayout>
  );
}
