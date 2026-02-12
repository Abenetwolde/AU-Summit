import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { detectXSS } from "@/utils/sanitization"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        const hasXss = React.useMemo(() =>
            typeof props.value === 'string' && detectXSS(props.value),
            [props.value]
        );

        return (
            <div className="relative w-full">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        (hasXss || error) && "border-red-500 ring-red-500 focus-visible:ring-red-500 pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {(hasXss || error) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none group" title={error || "XSS Red Flag: Potential security risk detected"}>
                        <AlertCircle className="h-5 w-5 animate-pulse" />
                    </div>
                )}
                {error && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
