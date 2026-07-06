import * as React from "react"
import { cn } from "lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    
    let variantStyles = "";
    if (variant === "default") {
        variantStyles = "bg-ot-action text-white hover:bg-ot-action-hover h-10 px-4 py-2";
    } else if (variant === "outline") {
        variantStyles = "border border-ot-border hover:bg-ot-surface-elev-bottom text-white h-10 px-4 py-2";
    } else if (variant === "ghost") {
        variantStyles = "bg-transparent hover:bg-ot-surface-elev-bottom";
    }

    return (
        <Comp
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                variantStyles,
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
