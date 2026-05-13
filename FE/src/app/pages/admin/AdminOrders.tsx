import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { toast } from "sonner";
import { SearchInput } from "../../../components/common/SearchInput";
import { FilterTabBar } from "../../../components/common/FilterTabBar";
import { OrderStatusBadge } from "../../../components/admin/OrderStatusBadge";

type OrderFilter = "all" | "pending" | "confirmed" | "cancelled";

const filterOptions = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "cancelled", label: "Cancelled" },
];

export function AdminOrders() {
  const { orders, confirmPayment, cancelOrder, logActivity } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<OrderFilter>("all");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || order.paymentStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const handleConfirmPayment = (orderId: string) => {
    confirmPayment(orderId, "Admin");
    logActivity({
      type: "payment_confirmed",
      userId: "admin",
      userName: "Admin",
      description: `Confirmed payment for order ${orderId}`,
    });
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

      <FilterTabBar
        options={filterOptions}
        value={filter}
        onChange={(v) => setFilter(v as OrderFilter)}
      />

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search orders..."
          />
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
                <OrderStatusBadge status={order.paymentStatus} />

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
