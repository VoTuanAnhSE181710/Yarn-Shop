import { useState } from "react";
import { Users, Package, ShoppingCart, Menu, X, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAdmin } from "../../context/AdminContext";
import { products } from "../../data/products";
import { DashboardAvatarMenu } from "../../components/DashboardAvatarMenu";
import { toast } from "sonner";

export function StaffPage() {
  const [activeTab, setActiveTab] = useState<"users" | "products" | "orders">("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const cashOrders = orders.filter((o) => o.paymentMethod === "cash" && o.paymentStatus === "pending");

  const navItems = [
    { id: "orders" as const, label: "Orders", icon: ShoppingCart },
    { id: "users" as const, label: "Users (View Only)", icon: Users },
    { id: "products" as const, label: "Products (View Only)", icon: Package },
  ];

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
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-secondary-foreground text-xl">🧶</span>
              </div>
              <div>
                <h2 className="font-semibold">Staff Panel</h2>
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

          {/* User info in sidebar */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-9 h-9 rounded-full border-2 border-secondary/20 object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <span className="text-xs text-secondary-foreground bg-secondary/20 px-2 py-0.5 rounded-full">
                Staff Member
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
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
                    <div
                      key={order.id}
                      className="bg-card rounded-2xl p-6 border border-border"
                    >
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
                  <p className="text-muted-foreground">
                    All cash payments have been processed
                  </p>
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
                  <div key={product.id} className="bg-card rounded-2xl overflow-hidden border border-border">
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
        </div>
      </main>
    </div>
  );
}
