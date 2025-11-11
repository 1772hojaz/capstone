import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm hover:shadow-md hover:from-primary-600 hover:to-primary-700",
        secondary:
          "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-sm hover:shadow-md hover:from-secondary-600 hover:to-secondary-700",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm hover:shadow-md hover:from-red-600 hover:to-red-700",
        outline:
          "border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800",
        success:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm hover:shadow-md hover:from-green-600 hover:to-green-700",
        warning:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:from-amber-600 hover:to-amber-700",
        info:
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700",
        premium:
          "bg-gradient-to-r from-accent-500 via-primary-500 to-accent-600 text-white shadow-lg hover:shadow-glow hover:shadow-accent-500/30 animate-gradient-shift bg-[length:200%_100%]",
        ghost:
          "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
      },
      size: {
        default: "px-3 py-1.5 text-xs rounded-lg",
        sm: "px-2 py-1 text-[10px] rounded-md",
        lg: "px-4 py-2 text-sm rounded-xl",
        xl: "px-5 py-2.5 text-base rounded-xl",
      },
      shape: {
        rounded: "rounded-lg",
        pill: "rounded-full",
        square: "rounded-none",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "relative [&::after]:content-[''] [&::after]:absolute [&::after]:inset-0 [&::after]:rounded-[inherit] [&::after]:bg-current [&::after]:animate-ping [&::after]:opacity-75",
        glow: "shadow-glow animate-pulse-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rounded",
      animation: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean
  onRemove?: () => void
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Badge({
  className,
  variant,
  size,
  shape,
  animation,
  removable,
  onRemove,
  leftIcon,
  rightIcon,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size, shape, animation }),
        className
      )}
      {...props}
    >
      {leftIcon && (
        <span className="inline-flex shrink-0 -ml-0.5">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="inline-flex shrink-0 -mr-0.5">{rightIcon}</span>
      )}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="inline-flex shrink-0 -mr-1 ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// Dot Badge for status indicators
export function DotBadge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const dotColor = {
    default: "bg-primary-500",
    secondary: "bg-secondary-500",
    destructive: "bg-red-500",
    success: "bg-green-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
    outline: "bg-neutral-500",
    premium: "bg-gradient-to-r from-accent-500 to-primary-500",
    ghost: "bg-neutral-400",
  }[variant as string] || "bg-primary-500"

  return (
    <Badge
      variant={variant}
      className={cn("pl-2", className)}
      leftIcon={
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full animate-pulse",
            dotColor
          )}
        />
      }
      {...props}
    >
      {children}
    </Badge>
  )
}

export { Badge, badgeVariants }
