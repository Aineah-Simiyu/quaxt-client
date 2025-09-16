import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-200",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:from-red-600 hover:to-rose-600 hover:shadow-xl transition-all duration-200 focus-visible:ring-red-500/20",
        outline:
          "border border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 text-slate-700 hover:text-slate-900",
        secondary:
          "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 shadow-sm hover:from-slate-200 hover:to-slate-300 hover:shadow-md transition-all duration-200",
        ghost:
          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 transition-colors duration-200",
        success:
          "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:from-green-600 hover:to-emerald-600 hover:shadow-xl transition-all duration-200",
        warning:
           "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 hover:shadow-xl transition-all duration-200",
       },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    (<Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />)
  );
}

export { Button, buttonVariants }
