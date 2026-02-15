import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useUploadCircular, useCreateCircular } from "@/hooks/use-circulars";
import { UploadCloud, File as FileIcon, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  
  const uploadMutation = useUploadCircular();
  const createMutation = useCreateCircular();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleSubmit = async () => {
    if (!file || !title || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields and upload a file.",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await uploadMutation.mutateAsync(formData);

      // 2. Create Record
      await createMutation.mutateAsync({
        title,
        category,
        fileUrl: uploadRes.url,
        fileSize: uploadRes.size,
        status: "Active",
        summary: "Pending analysis..."
      });

      toast({
        title: "Success",
        description: "Circular uploaded and processing started.",
      });

      // Reset
      setFile(null);
      setTitle("");
      setCategory("");

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload circular. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isSubmitting = uploadMutation.isPending || createMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Header title="Upload Circular" />

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Upload Zone */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                  flex flex-col items-center justify-center min-h-[300px]
                  ${isDragActive 
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,255,255,0.2)]" 
                    : "border-white/10 hover:border-primary/50 hover:bg-white/5"}
                `}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                  <UploadCloud className={`w-10 h-10 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="text-xl font-bold font-rajdhani text-white mb-2">
                  {isDragActive ? "Drop file here" : "Drag & Drop Circular"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Supports PDF, DOC, DOCX up to 50MB. <br/> 
                  Analysis will start automatically.
                </p>
              </div>
            </motion.div>

            {/* Right: Form Details */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-8 rounded-2xl h-fit"
            >
              <h3 className="text-xl font-bold font-rajdhani text-white mb-6 flex items-center gap-2">
                <FileIcon className="w-5 h-5 text-primary" />
                Metadata Details
              </h3>

              <div className="space-y-6">
                <AnimatePresence>
                  {file && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">PDF</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{file.name}</p>
                          <p className="text-xs text-primary/80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Circular Title</label>
                  <Input 
                    placeholder="e.g. Master Direction on KYC" 
                    className="bg-black/20 border-white/10 focus:border-primary"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-black/20 border-white/10 focus:ring-primary/20">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0e0e1a] border-white/10 text-white">
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="Lending">Lending</SelectItem>
                      <SelectItem value="Forex">Forex</SelectItem>
                      <SelectItem value="Payments">Payments</SelectItem>
                      <SelectItem value="Risk Management">Risk Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !file}
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-300 rounded-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Process & Analyze
                    </div>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
