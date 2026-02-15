import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useCirculars } from "@/hooks/use-circulars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye, FileText, Calendar, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Library() {
  const [search, setSearch] = useState("");
  const { data: circulars, isLoading } = useCirculars(search);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Circular Library" />

        <div className="glass-panel rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
          {/* Toolbar */}
          <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 rounded-xl" 
                placeholder="Search by title, ID, or keywords..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                Filter by Date
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 p-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : circulars?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-16 h-16 mb-4 opacity-20" />
                <p>No circulars found matching your criteria.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-right text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {circulars?.map((circular, i) => (
                      <motion.tr 
                        key={circular.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-white/10 hover:bg-white/5 transition-colors group"
                      >
                        <TableCell className="font-medium text-white/90">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            {circular.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="w-3 h-3" />
                            {circular.category}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(circular.date), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium border
                            ${circular.status === 'Active' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                          `}>
                            {circular.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
