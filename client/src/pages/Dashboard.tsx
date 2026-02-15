import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { useCirculars } from "@/hooks/use-circulars";
import { useQueries } from "@/hooks/use-queries";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  FileText, 
  MessageSquare, 
  Activity, 
  BrainCircuit, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: circulars } = useCirculars();
  const { data: queries } = useQueries();
  const { data: analytics } = useAnalytics();

  // Mock data for charts if no analytics data yet
  const chartData = analytics?.length ? analytics.map(a => ({
    name: new Date(a.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    value: a.value
  })) : [
    { name: '09:00', value: 240 },
    { name: '10:00', value: 139 },
    { name: '11:00', value: 980 },
    { name: '12:00', value: 390 },
    { name: '13:00', value: 480 },
    { name: '14:00', value: 380 },
    { name: '15:00', value: 430 },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Dashboard Overview" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            label="Total Circulars" 
            value={circulars?.length || 0} 
            icon={FileText} 
            color="cyan" 
            delay={0.1}
          />
          <StatsCard 
            label="Queries Processed" 
            value={queries?.length || 0} 
            icon={MessageSquare} 
            trend="+12.5%" 
            trendUp={true} 
            color="purple" 
            delay={0.2}
          />
          <StatsCard 
            label="System Accuracy" 
            value="98.2%" 
            icon={Activity} 
            color="blue" 
            delay={0.3}
          />
          <StatsCard 
            label="Active Model" 
            value="GPT-4o" 
            icon={BrainCircuit} 
            color="default" 
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2 glass-panel p-6 rounded-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-rajdhani text-white">
                Query Traffic Volume
              </h3>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-muted-foreground outline-none focus:border-primary/50">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0e0e1a', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#00FFFF' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#00FFFF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1 flex-shrink-0">
                    {i % 2 === 0 ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-secondary" />}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">
                      {i % 2 === 0 ? "New circular processed" : "System query executed"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {i * 15 + 5} minutes ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
