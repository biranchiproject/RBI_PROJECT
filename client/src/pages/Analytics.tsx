import Layout from "@/components/Layout";
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
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { motion } from "framer-motion";
import { Loader2, FileText, Layers, Hash } from "lucide-react";

export default function Analytics() {
  const { data, isLoading } = useAnalytics() as any;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const categoryData = data?.categories || [];
  const totalDocs = data?.total_documents || 0;
  const totalPages = data?.total_pages || 0;

  return (
    <Layout>
      <div className="p-8 overflow-y-auto h-full">
        <Header title="System Insights" />

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"><FileText className="text-primary" /></div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold">Total Documents</p>
              <p className="text-2xl font-bold text-white font-rajdhani">{totalDocs}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center"><Layers className="text-blue-400" /></div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold">Total Pages Analysed</p>
              <p className="text-2xl font-bold text-white font-rajdhani">{totalPages}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center"><Hash className="text-purple-400" /></div>
            <div>
              <p className="text-zinc-500 text-xs uppercase font-bold">Total Categories</p>
              <p className="text-2xl font-bold text-white font-rajdhani">{categoryData.length}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl h-[450px] border border-white/5"
          >
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6">Circulars by Category</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={5}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D0F14', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Volume Comparison Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl h-[450px] border border-white/5"
          >
            <h3 className="text-xl font-bold font-rajdhani text-white mb-6">Document Volume Trend</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#666" hide />
                <YAxis dataKey="name" type="category" stroke="#fff" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0D0F14', borderColor: '#333', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 4, 4, 0]} barSize={20}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00FF88" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#00FF88" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-zinc-400 leading-relaxed italic">
                💡 Insight: Most circulars analyzed belong to the <span className="text-primary font-bold">
                  {categoryData.length > 0 ? categoryData.sort((a: any, b: any) => b.count - a.count)[0].name : "General"}
                </span> category.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
