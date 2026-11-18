import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
/**
 * The single entry point of the product. There is intentionally no separate
 * "sign up" button: registration happens automatically on first sign-in.
 */
export function EnterButton({ label = "Entrar", size = "md", variant = "default", className }) {
  return (
    <Link
      to="/auth"
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm",
        variant === "hero" && "pdf-enter-hero",
        className,
      )}
    >
      <span aria-hidden="true" className={size === "lg" ? "text-xl" : "text-base"}>
        🏛️
      </span>
      {label}
    </Link>
  );
}
