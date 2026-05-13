import { useState } from "react";
import { Users, Package, ShoppingCart, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";
import { products } from "../../data/products";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { toast } from "sonner";

export function StaffPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "users" | "products">("orders");
  const { user } = useAuth();
  const { users, orders, confirmPayment, logActivity } = useAdmin();

  const handleConfirmCashPayment = (orderId: string) => {
    confirmPayment(orderId, user?.name || "Staff");
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      logActivity({
        type: "payment_confirmed",
        userId: user?.email || "staff",
        userName: user?.name || "Staff",
        description: `Confirmed cash payment for order ${orderId} at store`,
      });
    }
    toast.success("Cash payment confirmed");
  };

  const cashOrders = orders.filter(
    (o) => o.paymentMethod === "cash" && o.paymentStatus === "pending"
  );

  const navItems = [
    { id: "orders" as const, label: "Orders", icon: ShoppingCart },
    { id: "users" as const, label: "Users (View Only)", icon: Users },
    { id: "products" as const, label: "Products (View Only)", icon: Package },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      panelTitle="Staff Panel"
      roleLabel="Staff Member"
      roleBadgeClass="text-xs text-secondary-foreground bg-secondary/20 px-2 py-0.5 rounded-full"
      accentColor="secondary"
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as typeof activeTab)}
    >
      {activeTab === "orders" && (
        <div className="space-y-6">
          <div>
            <h1 className="mb-2">Cash Payment Orders</h1>
            <p className="text-muted-foreground">
              Confirm cash payments received at the store
            </p>
          </div>

          {cashOrders.length > 0 ? (
            <div className="grid gap-4">
              {cashOrders.map((order) => (
                <div key={order.id} className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">Order {order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.userName} • {order.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-xl">
                        ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Cash Payment</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.productName} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConfirmCashPayment(order.id)}
                    className="w-full bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Confirm Payment Received
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-12 text-center border border-border">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-2">No Pending Cash Orders</h3>
              <p className="text-muted-foreground">All cash payments have been processed</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div>
            <h1 className="mb-2">Users (Read Only)</h1>
            <p className="text-muted-foreground">View all registered users</p>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm">Name</th>
                  <th className="text-left px-6 py-4 text-sm">Email</th>
                  <th className="text-left px-6 py-4 text-sm">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4 capitalize">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-6">
          <div>
            <h1 className="mb-2">Products (Read Only)</h1>
            <p className="text-muted-foreground">View all available products</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-2xl overflow-hidden border border-border"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="mb-2">{product.name}</h4>
                  <p className="text-primary font-semibold">${product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
