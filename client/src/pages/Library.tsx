import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/utils";
import Layout from "@/components/Layout";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming available or standard check
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Calendar,
  Loader2,
  Trash2,
  File as FileIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: number;
  filename: string;
  title: string;
  category: string;
  upload_date: string;
  file_path: string;
}

export default function Library() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/circulars`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data);
      setSelectedIds([]); // Clear selection on refresh
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredDocs.map(doc => doc.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete documents");
      }

      toast({
        title: "Success",
        description: "Selected documents deleted successfully.",
      });

      fetchDocuments();

    } catch (error) {
      console.error("Delete Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (doc.filename?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesCategory = category === "All" || doc.category === category;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Compliance": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Lending": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Forex": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Risk Management": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-white/10 text-gray-400 border-white/20";
    }
  };

  const isAllSelected = filteredDocs.length > 0 && selectedIds.length === filteredDocs.length;

  return (
    <Layout>
      <div className="p-8 h-full overflow-y-auto">
        <Header title="Circular Library" />

        <div className="glass-panel rounded-2xl overflow-hidden min-h-[600px] flex flex-col">
          {/* Toolbar */}
          <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-10 bg-black/20 border-white/10 focus:border-primary/50 rounded-xl"
                placeholder="Search title or filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filters & Actions */}
            <div className="flex gap-2 w-full md:w-auto items-center">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full md:w-[200px] bg-black/20 border-white/10">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0e0e1a] border-white/10 text-white">
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                  <SelectItem value="Lending">Lending</SelectItem>
                  <SelectItem value="Forex">Forex</SelectItem>
                  <SelectItem value="Payments">Payments</SelectItem>
                  <SelectItem value="Risk Management">Risk Management</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>

              {selectedIds.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="ml-2 gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedIds.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0e0e1a] border-white/10 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the selected documents from the database and storage.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </motion.div>
              ) : filteredDocs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center"
                >
                  <EmptyState
                    icon={FileText}
                    title="No Circulars Found"
                    description={search || category !== "All" ? "Try adjusting your filters." : "No documents available."}
                  />
                </motion.div>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="w-[50px] text-center">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                          />
                        </TableHead>
                        <TableHead className="text-white w-[30%]">Title</TableHead>
                        <TableHead className="text-white w-[15%]">Category</TableHead>
                        <TableHead className="text-white w-[25%]">Filename</TableHead>
                        <TableHead className="text-white w-[15%]">Upload Date</TableHead>
                        <TableHead className="text-white w-[15%] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocs.map((doc, i) => (
                        <motion.tr
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`border-white/10 hover:bg-white/5 transition-colors ${selectedIds.includes(doc.id) ? 'bg-primary/5' : ''}`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.includes(doc.id)}
                              onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-white/90">
                            {doc.title}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(doc.category)}`}>
                              {doc.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground flex items-center gap-2">
                            <FileIcon className="w-4 h-4 text-primary/50" />
                            <span className="truncate max-w-[200px]">{doc.filename}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {formatDate(doc.upload_date)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                                onClick={() => window.open(doc.file_path.startsWith("http") ? doc.file_path : `${API_BASE_URL}${doc.file_path}`, '_blank')}
                                title="View PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.file_path.startsWith("http") ? doc.file_path : `${API_BASE_URL}${doc.file_path}`;
                                  link.download = doc.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                title="Download"
                              >
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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
