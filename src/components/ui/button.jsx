import * as React from "react"
import { cn } from "lib/utils"
import { Loader2 } from "lucide-react"

const Button = React.forwardRef(({ 
    className, 
    variant = "default", 
    size, 
    asChild = false, 
    loading = false, 
    isLoading = false,
    disabled = false,
    onClick,
    type = "button",
    children,
    ...props 
}, ref) => {
    const [internalLoading, setInternalLoading] = React.useState(false);
    const Comp = asChild ? React.Fragment : "button"
    
    const isSpinning = loading || isLoading || internalLoading;

    const handleClick = (e) => {
        if (isSpinning || disabled) {
            e.preventDefault();
            return;
        }

        if (onClick) {
            try {
                const res = onClick(e);
                if (res && typeof res.then === 'function') {
                    setInternalLoading(true);
                    res.finally(() => {
                        setInternalLoading(false);
                    });
                }
            } catch (err) {
                console.error("Button action error:", err);
            }
        }
    };

    let variantStyles = "";
    if (variant === "default") {
        variantStyles = "bg-ot-action text-white hover:bg-ot-action-hover h-10 px-4 py-2";
    } else if (variant === "outline") {
        variantStyles = "border border-ot-border hover:bg-ot-surface-elev-bottom text-white h-10 px-4 py-2";
    } else if (variant === "ghost") {
        variantStyles = "bg-transparent hover:bg-ot-surface-elev-bottom";
    } else if (variant === "destructive") {
        variantStyles = "bg-red-600 hover:bg-red-700 text-white h-10 px-4 py-2";
    }

    let sizeStyles = "";
    if (size === "sm") {
        sizeStyles = "h-8 rounded-md px-3 text-xs";
    } else if (size === "lg") {
        sizeStyles = "h-11 rounded-md px-8";
    } else if (size === "icon") {
        sizeStyles = "h-9 w-9 p-0 flex items-center justify-center";
    }

    return (
        <Comp
            type={type}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius)] text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none relative",
                variantStyles,
                sizeStyles,
                className
            )}
            ref={ref}
            disabled={disabled || isSpinning}
            onClick={handleClick}
            {...props}
        >
            {isSpinning && (
                <Loader2 className={cn("w-4 h-4 animate-spin shrink-0", size !== "icon" && "mr-2")} />
            )}
            {(!isSpinning || size !== "icon") && children}
        </Comp>
    )
})
Button.displayName = "Button"

export { Button }


