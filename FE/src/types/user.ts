export type UserRole = "admin" | "staff" | "user";

export interface User {
  email: string;
  phone: string;
  name: string;
  avatar: string;
  role: UserRole;
}
