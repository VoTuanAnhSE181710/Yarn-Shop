import { Shield, Users, User } from "lucide-react";
import type { UserRole } from "../types/user";

export interface RoleMeta {
  label: string;
  Icon: typeof User;
  badgeClass: string;
}

export function getRoleMeta(role: UserRole): RoleMeta {
  switch (role) {
    case "admin":
      return {
        label: "Administrator",
        Icon: Shield,
        badgeClass: "bg-destructive/10 text-destructive",
      };
    case "staff":
      return {
        label: "Staff Member",
        Icon: Users,
        badgeClass: "bg-secondary/20 text-secondary-foreground",
      };
    default:
      return {
        label: "Member",
        Icon: User,
        badgeClass: "bg-primary/10 text-primary",
      };
  }
}
