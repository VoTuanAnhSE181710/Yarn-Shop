import { CheckCircle, Clock, XCircle } from "lucide-react";

type PaymentStatus = "pending" | "confirmed" | "cancelled";

interface OrderStatusBadgeProps {
  status: PaymentStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  if (status === "confirmed") {
    return (
      <span className="flex items-center gap-2 text-sm bg-secondary/20 text-secondary px-3 py-1 rounded-full">
        <CheckCircle className="w-4 h-4" />
        Confirmed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="flex items-center gap-2 text-sm bg-accent/20 text-accent px-3 py-1 rounded-full">
        <Clock className="w-4 h-4" />
        Pending
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm bg-destructive/20 text-destructive px-3 py-1 rounded-full">
      <XCircle className="w-4 h-4" />
      Cancelled
    </span>
  );
}
