import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    (<input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-slate-700 placeholder:text-slate-400 selection:bg-blue-500 selection:text-white flex h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-md",
        "hover:bg-white/70 hover:border-slate-300",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/20",
        className
      )}
      {...props} />)
  );
}

export { Input }
