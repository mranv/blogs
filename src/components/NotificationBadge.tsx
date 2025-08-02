import React from "react";
import { cn } from "@/utils/cn";

interface NotificationBadgeProps {
  count?: number;
  show?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  show = false,
  className,
  children,
}) => {
  if (!show && !count) return <>{children}</>;

  return (
    <div className="relative inline-flex">
      {children}
      {show && (
        <span
          className={cn("absolute -top-1 -right-1 flex h-3 w-3", className)}
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
      {count && count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full",
            className
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;
