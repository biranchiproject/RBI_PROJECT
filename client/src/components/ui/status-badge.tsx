import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status?: "online" | "offline" | "processing";
    label?: string;
    className?: string;
}

export function StatusBadge({
    status = "online",
    label = "System Active",
    className
}: StatusBadgeProps) {
    const statusColors = {
        online: "bg-primary", // Neon Green
        offline: "bg-red-500",
        processing: "bg-yellow-500",
    };

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm",
            className
        )}>
            <span className={cn(
                "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]",
                statusColors[status]
            )} />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                {label}
            </span>
        </div>
    );
}
