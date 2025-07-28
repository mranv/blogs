import { Button } from "./ui/button";
import { cn } from "@utils/cn";

export interface Props {
  href: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  children: React.ReactNode;
}

export default function LinkButtonReact({
  href,
  className,
  ariaLabel,
  title,
  disabled = false,
  variant = "link",
  children,
}: Props) {
  if (disabled) {
    return (
      <Button
        variant={variant}
        className={cn("group", className)}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        asChild
      >
        <span>{children}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      className={cn("group hover-lift", className)}
      aria-label={ariaLabel}
      title={title}
      asChild
    >
      <a href={href}>{children}</a>
    </Button>
  );
}
