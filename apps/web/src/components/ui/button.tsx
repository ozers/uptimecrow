import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * DALGA 1 — değişenler:
 * · `loading` prop'u: spinner + disabled + aria-busy tek yerde. Sayfalarda
 *   `{loading ? "Saving..." : label}` tekrarını bitirir.
 * · motion token'ları (duration-1 / ease-out) hardcoded 150ms yerine.
 * · size="touch": mobilde 44px hedef gereken birincil aksiyonlar için.
 * · asChild + loading birlikte kullanılırsa spinner enjekte edilmez (Slot tek
 *   çocuk bekler) — bu durumda sadece aria-busy ve pointer kilidi uygulanır.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-[-0.01em] transition-all duration-1 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:shadow-md",
        brand:
          "bg-brand text-brand-foreground shadow-sm hover:-translate-y-px hover:shadow-md hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:-translate-y-px hover:shadow-md",
        outline:
          "border border-input bg-card/50 hover:bg-accent hover:text-accent-foreground hover:border-muted-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-[15px]",
        /** Mobil birincil aksiyon — 44px dokunma hedefi. */
        touch: "h-11 min-h-touch rounded-lg px-5 text-[15px]",
        icon: "h-9 w-9",
        /** İkon butonu, mobilde görünmez 44px hit alanı ile. */
        "icon-touch": "h-9 w-9 touch-target",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Spinner göster, tıklamayı kilitle, aria-busy ver. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-busy={loading || undefined}
        disabled={asChild ? undefined : disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin-slow" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
