import { useState } from "react";
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { toast } from "sonner";

export function AdminOrders() {
  const { orders, confirmPayment, cancelOrder, logActivity } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || order.paymentStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleConfirmPayment = (orderId: string) => {
    confirmPayment(orderId, "Admin");
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      logActivity({
        type: "payment_confirmed",
        userId: "admin",
        userName: "Admin",
        description: `Confirmed payment for order ${orderId}`,
      });
    }
    toast.success("Payment confirmed");
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      cancelOrder(orderId);
      toast.success("Order cancelled");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Order Management</h1>
        <p className="text-muted-foreground">View and manage all orders</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {["all", "pending", "confirmed", "cancelled"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors capitalize ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground border border-border hover:bg-muted"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold mb-1">Order {order.id}</h3>
                  <p className="text-sm text-muted-foreground">{order.userName} • {order.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {order.paymentStatus === "confirmed" && (
                    <span className="flex items-center gap-2 text-sm bg-secondary/20 text-secondary px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Confirmed
                    </span>
                  )}
                  {order.paymentStatus === "pending" && (
                    <span className="flex items-center gap-2 text-sm bg-accent/20 text-accent px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  )}
                  {order.paymentStatus === "cancelled" && (
                    <span className="flex items-center gap-2 text-sm bg-destructive/20 text-destructive px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4" />
                      Cancelled
                    </span>
                  )}
                </div>

                {order.paymentStatus === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmPayment(order.id)}
                      className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-sm bg-destructive/10 text-destructive px-4 py-2 rounded-full hover:bg-destructive/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No orders found</div>
          )}
        </div>
      </div>
    </div>
  );
}
