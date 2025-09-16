import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-slate-400 selection:bg-blue-500 selection:text-white flex min-h-20 w-full rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-3 text-base shadow-sm transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
        "focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-md",
        "hover:bg-white/70 hover:border-slate-300",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }