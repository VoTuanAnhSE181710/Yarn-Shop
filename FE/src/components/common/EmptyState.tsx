import { Link } from "react-router";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
        <h2 className="mb-3">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        {actionLabel && actionHref && (
          <Link
            to={actionHref}
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
