import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5",
        outline:
          "border-2 border-neutral-200 dark:border-neutral-700 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md",
        secondary:
          "bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg hover:shadow-xl hover:from-secondary-600 hover:to-secondary-700 hover:-translate-y-0.5",
        ghost:
          "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100",
        link:
          "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline hover:text-primary-700 dark:hover:text-primary-300",
        premium:
          "relative bg-gradient-to-r from-accent-500 via-primary-500 to-accent-600 text-white shadow-lg hover:shadow-glow hover:-translate-y-0.5 before:absolute before:inset-0 before:bg-gradient-to-r before:from-accent-600 before:via-primary-600 before:to-accent-700 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:rounded-[inherit] overflow-hidden [&>*]:relative [&>*]:z-10",
        success:
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5",
        warning:
          "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-amber-700 hover:-translate-y-0.5",
        info:
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2.5 text-sm rounded-xl [&_svg]:size-4",
        sm: "h-9 px-4 py-2 text-xs rounded-lg [&_svg]:size-3.5",
        lg: "h-13 px-8 py-3 text-base rounded-xl [&_svg]:size-5",
        xl: "h-15 px-10 py-4 text-lg rounded-2xl [&_svg]:size-6",
        icon: "h-10 w-10 rounded-xl [&_svg]:size-4",
        "icon-sm": "h-8 w-8 rounded-lg [&_svg]:size-3.5",
        "icon-lg": "h-12 w-12 rounded-xl [&_svg]:size-5",
      },
      elevation: {
        none: "",
        sm: "shadow-sm hover:shadow-md",
        md: "shadow-md hover:shadow-lg",
        lg: "shadow-lg hover:shadow-xl",
        xl: "shadow-xl hover:shadow-2xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      elevation: "md",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      elevation,
      fullWidth,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    const content = (
      <>
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </>
    )
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, elevation, fullWidth, className })
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
