import { Routes, Route } from "react-router";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsers } from "./AdminUsers";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";

export function AdminPage() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminOrders />} />
        <Route path="activity" element={<AdminDashboard />} />
      </Routes>
    </AdminLayout>
  );
}
