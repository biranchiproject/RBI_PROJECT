import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
    size?: number;
    text?: string;
}

export function Loader({ className, size = 24, text }: LoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2
                className={cn("animate-spin text-primary", className)}
                size={size}
            />
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                    {text}
                </p>
            )}
        </div>
    );
}
