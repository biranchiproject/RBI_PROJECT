import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "cyan" | "purple" | "blue" | "default";
  delay?: number;
}

export function StatsCard({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  color = "default",
  delay = 0 
}: StatsCardProps) {
  const colorMap = {
    cyan: "text-primary border-primary/30 bg-primary/5",
    purple: "text-secondary border-secondary/30 bg-secondary/5",
    blue: "text-blue-500 border-blue-500/30 bg-blue-500/5",
    default: "text-white border-white/10 bg-white/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "glass-panel p-6 rounded-2xl border transition-all duration-300 hover:border-opacity-50 hover:bg-opacity-80 group",
        colorMap[color]
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-xl transition-colors duration-300",
          color === "cyan" && "bg-primary/10 text-primary group-hover:bg-primary/20",
          color === "purple" && "bg-secondary/10 text-secondary group-hover:bg-secondary/20",
          color === "blue" && "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
          color === "default" && "bg-white/10 text-white"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full border",
            trendUp 
              ? "bg-green-500/10 text-green-400 border-green-500/20" 
              : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">
          {label}
        </p>
        <h3 className="text-3xl font-bold font-rajdhani text-white">
          {value}
        </h3>
      </div>
    </motion.div>
  );
}
