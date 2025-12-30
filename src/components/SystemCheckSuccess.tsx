import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SystemCheckSuccessProps {
    show: boolean;
}

export function SystemCheckSuccess({ show }: SystemCheckSuccessProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            // Small delay before showing for smoother animation
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [show]);

    if (!show) return null;

    return (
        <div
            className={`
                bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3
                transition-all duration-500 ease-out
                ${isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-2'
                }
            `}
        >
            <CheckCircle2 className={`
                h-5 w-5 text-green-600 flex-shrink-0 mt-0.5
                transition-all duration-700 ease-out
                ${isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
            `} />
            <div>
                <p className="text-sm font-semibold text-green-900">
                    System Check Passed
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                    The document appears authentic.
                </p>
            </div>
        </div>
    );
}
