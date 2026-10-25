import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-colors " +
  "min-h-11 px-5 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50 " +
  "whitespace-nowrap";

const sizes: Record<Size, string> = {
  md: "text-[0.95rem] py-2.5",
  lg: "text-body py-3.5 px-7",
};

const variants: Record<Variant, string> = {
  // Accent is used on ~5% of the surface: primary actions only.
  primary: "bg-accent text-white dark:text-ink hover:bg-accent-deep",
  secondary:
    "border border-rule bg-raised text-ink hover:border-accent hover:text-accent",
  ghost: "text-ink hover:bg-accent-tint",
  danger: "bg-danger text-white hover:opacity-90",
};

const buttonClasses = (variant: Variant, size: Size, className?: string) =>
  `${base} ${sizes[size]} ${variants[variant]} ${className ?? ""}`;

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
