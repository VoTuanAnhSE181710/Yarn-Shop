import { Package, Calendar } from "lucide-react";

export function Purchased() {
  const mockOrders = [
    {
      id: "ORD-001",
      date: "May 8, 2026",
      status: "Delivered",
      total: 49.99,
      items: [
        {
          name: "Cozy Blanket Starter Kit",
          image: "https://images.unsplash.com/photo-1649680748668-0ed757752dc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
      ],
    },
    {
      id: "ORD-002",
      date: "May 3, 2026",
      status: "Delivered",
      total: 34.99,
      items: [
        {
          name: "Rainbow Pastel Yarn Bundle",
          image: "https://images.unsplash.com/photo-1678443087150-4a40aa2f250a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="mb-8">Order History</h1>

        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-6 bg-muted/30 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Order {order.id}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{order.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold text-primary">${order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-6">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <span className="inline-block mt-2 text-sm bg-secondary/20 text-secondary px-3 py-1 rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <button className="text-primary hover:underline">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {mockOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="mb-3">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your cozy journey and create something amazing!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
