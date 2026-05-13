import { useState } from "react";
import { Users, Package, ShoppingCart, Activity, TrendingUp, DollarSign } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { products } from "../../data/products";

export function AdminDashboard() {
  const { users, orders, activities } = useAdmin();

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "confirmed")
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = orders.filter((o) => o.paymentStatus === "pending").length;
  const confirmedOrders = orders.filter((o) => o.paymentStatus === "confirmed").length;

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "bg-primary/10 text-primary",
      change: "+12%",
    },
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      color: "bg-secondary/10 text-secondary",
      change: "+3",
    },
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      color: "bg-accent/10 text-accent",
      change: `${pendingOrders} pending`,
    },
    {
      title: "Total Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-primary/10 text-primary",
      change: "+18%",
    },
  ];

  const recentActivities = activities.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm text-secondary">{stat.change}</span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2>Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <h2>Order Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Confirmed Orders</span>
              <span className="font-semibold text-lg">{confirmedOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pending Orders</span>
              <span className="font-semibold text-lg text-accent">{pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cancelled Orders</span>
              <span className="font-semibold text-lg text-destructive">
                {orders.filter((o) => o.paymentStatus === "cancelled").length}
              </span>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">Total Revenue</span>
                <span className="font-bold text-xl text-primary">${totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
