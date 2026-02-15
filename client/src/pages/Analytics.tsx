import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from "recharts";
import { motion } from "framer-motion";

export default function Analytics() {
  const { data: analytics } = useAnalytics();

  const data = [
    { name: 'Mon', queries: 40, compliance: 24 },
    { name: 'Tue', queries: 30, compliance: 13 },
    { name: 'Wed', queries: 20, compliance: 98 },
    { name: 'Thu', queries: 27, compliance: 39 },
    { name: 'Fri', queries: 18, compliance: 48 },
    { name: 'Sat', queries: 23, compliance: 38 },
    { name: 'Sun', queries: 34, compliance: 43 },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="System Analytics" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl h-[400px]"
          >
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6">Weekly Query Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#0e0e1a', borderColor: '#333', borderRadius: '8px' }}
                />
                <Bar dataKey="queries" fill="#00FFFF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compliance" fill="#9D00FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl h-[400px]"
          >
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6">Response Accuracy Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0e0e1a', borderColor: '#333', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="queries" 
                  stroke="#00FFFF" 
                  strokeWidth={3}
                  dot={{fill: '#00FFFF', strokeWidth: 2}}
                  activeDot={{r: 6, fill: '#fff'}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
