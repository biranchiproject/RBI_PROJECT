import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-white/10 bg-white/5",
            className
        )}>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-rajdhani">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    className="bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all duration-300"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
