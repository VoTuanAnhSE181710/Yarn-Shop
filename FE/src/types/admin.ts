export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "staff" | "user";
  createdAt: string;
  lastLogin?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "bank" | "cash";
  paymentStatus: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export type ActivityType =
  | "login"
  | "purchase"
  | "payment_confirmed"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "product_created"
  | "product_updated"
  | "product_deleted";

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: unknown;
}
