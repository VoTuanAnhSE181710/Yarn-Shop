import type { UserRole } from "../../types/user";
import { getRoleMeta } from "../../utils/getRoleMeta";

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const { label, Icon, badgeClass } = getRoleMeta(role);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badgeClass}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
