import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { detectXSS } from "@/utils/sanitization"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        const hasXss = React.useMemo(() =>
            typeof props.value === 'string' && detectXSS(props.value),
            [props.value]
        );

        return (
            <div className="relative w-full">
                <textarea
                    className={cn(
                        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        (hasXss || error) && "border-red-500 ring-red-500 focus-visible:ring-red-500 pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {(hasXss || error) && (
                    <div className="absolute right-3 top-3 text-red-500 pointer-events-none group" title={error || "XSS Red Flag: Potential security risk detected"}>
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
Textarea.displayName = "Textarea"

export { Textarea }
