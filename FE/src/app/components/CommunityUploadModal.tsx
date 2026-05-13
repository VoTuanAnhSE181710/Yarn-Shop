import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

interface CommunityUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: {
    image: string;
    title: string;
    description: string;
    tags: string[];
  }) => void;
}

export function CommunityUploadModal({
  isOpen,
  onClose,
  onSubmit,
}: CommunityUploadModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload a valid image file");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      toast.error("Please upload an image");
      return;
    }

    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }

    const tagArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onSubmit({
      image: imagePreview,
      title: title.trim(),
      description: description.trim(),
      tags: tagArray,
    });

    setTitle("");
    setDescription("");
    setTags("");
    setImagePreview(null);
    onClose();
    toast.success("Your creation has been shared!", {
      description: "Check it out in the community feed!",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center rounded-t-3xl">
              <h2>Share Your Creation</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block mb-3 text-sm">Upload Image *</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary hover:bg-muted/50"
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground mb-1">
                          Drag & drop your image here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm">Title *</label>
                <input
                  type="text"
                  placeholder="Give your creation a title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Description</label>
                <textarea
                  placeholder="Tell us about your project, how you made it, or what inspired you..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Tags (Optional)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g., cozy, blanket, beginner (comma-separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Separate tags with commas
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border border-border rounded-full hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground px-6 py-4 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Share Creation
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
