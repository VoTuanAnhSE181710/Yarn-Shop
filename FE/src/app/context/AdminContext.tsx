import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "../data/products";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "user";
  createdAt: string;
  lastLogin?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  paymentMethod: "bank" | "cash";
  paymentStatus: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface Activity {
  id: string;
  type: "login" | "purchase" | "payment_confirmed" | "user_created" | "product_created" | "product_updated" | "product_deleted";
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface AdminContextType {
  users: AdminUser[];
  orders: Order[];
  activities: Activity[];
  createUser: (user: Omit<AdminUser, "id" | "createdAt">) => void;
  updateUser: (id: string, user: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  createOrder: (order: Omit<Order, "id" | "createdAt">) => string;
  confirmPayment: (orderId: string, confirmedBy: string) => void;
  cancelOrder: (orderId: string) => void;
  logActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const initialUsers: AdminUser[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@gmail.com",
    phone: "123456789",
    role: "admin",
    createdAt: "2026-05-01T08:00:00Z",
    lastLogin: "2026-05-12T09:30:00Z",
  },
  {
    id: "2",
    name: "Staff User",
    email: "staff@gmail.com",
    phone: "987654321",
    role: "staff",
    createdAt: "2026-05-02T08:00:00Z",
    lastLogin: "2026-05-12T08:00:00Z",
  },
  {
    id: "3",
    name: "Tran Ngoc",
    email: "tranngoc5979@gmail.com",
    phone: "0703339186",
    role: "user",
    createdAt: "2026-05-03T10:00:00Z",
    lastLogin: "2026-05-11T14:20:00Z",
  },
  {
    id: "4",
    name: "Kamui Katz",
    email: "kamuikatzzz@gmail.com",
    phone: "0909315708",
    role: "user",
    createdAt: "2026-05-04T11:00:00Z",
    lastLogin: "2026-05-10T16:45:00Z",
  },
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem("cozyStitch_users");
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("cozyStitch_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem("cozyStitch_activities");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cozyStitch_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("cozyStitch_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("cozyStitch_activities", JSON.stringify(activities));
  }, [activities]);

  const createUser = (user: Omit<AdminUser, "id" | "createdAt">) => {
    const newUser: AdminUser = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = (id: string, updatedUser: Partial<AdminUser>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updatedUser } : user))
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const createOrder = (order: Omit<Order, "id" | "createdAt">): string => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder.id;
  };

  const confirmPayment = (orderId: string, confirmedBy: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: "confirmed",
              confirmedAt: new Date().toISOString(),
              confirmedBy,
            }
          : order
      )
    );
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: "cancelled" } : order
      )
    );
  };

  const logActivity = (activity: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 100));
  };

  return (
    <AdminContext.Provider
      value={{
        users,
        orders,
        activities,
        createUser,
        updateUser,
        deleteUser,
        createOrder,
        confirmPayment,
        cancelOrder,
        logActivity,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
