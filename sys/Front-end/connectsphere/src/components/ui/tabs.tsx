import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-neutral-500 dark:text-neutral-400",
  {
    variants: {
      variant: {
        default: "h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1.5",
        pills: "gap-2 bg-transparent",
        underline: "h-12 gap-6 border-b-2 border-neutral-200 dark:border-neutral-700 bg-transparent rounded-none",
        solid: "h-12 gap-1 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl p-1",
        gradient: "h-12 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 p-1.5 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      fullWidth: false,
    },
  }
)

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, fullWidth, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant, fullWidth }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "rounded-lg px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 data-[state=active]:shadow-sm",
        pills:
          "rounded-xl px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent-500 data-[state=active]:to-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md",
        underline:
          "rounded-none px-1 py-2 border-b-2 border-transparent hover:text-neutral-700 dark:hover:text-neutral-300 data-[state=active]:border-accent-500 data-[state=active]:text-accent-600 dark:data-[state=active]:text-accent-400",
        solid:
          "rounded-lg px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-500 data-[state=active]:to-primary-600 data-[state=active]:text-white data-[state=active]:shadow-md",
        gradient:
          "rounded-lg px-4 py-2 hover:bg-white/50 dark:hover:bg-neutral-700/50 data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 data-[state=active]:shadow-md",
      },
      size: {
        default: "h-9",
        sm: "h-8 text-xs",
        lg: "h-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, size, icon, children, ...props }, ref) => {
  const triggerVariant = variant || "default"
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant: triggerVariant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
      "data-[state=active]:animate-fadeIn",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
