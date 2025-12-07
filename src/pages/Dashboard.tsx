import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  GraduationCap, 
  Search, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Download, 
  Eye,
  LogOut,
  ChevronRight,
  Home
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Material {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "video";
  size?: string;
  uploadedAt?: string;
  parentId: string | null;
}

const mockMaterials: Material[] = [
  { id: "1", name: "Mathematics", type: "folder", parentId: null },
  { id: "2", name: "Physics", type: "folder", parentId: null },
  { id: "3", name: "Chemistry", type: "folder", parentId: null },
  { id: "4", name: "Biology", type: "folder", parentId: null },
  { id: "5", name: "Algebra Notes.pdf", type: "document", size: "2.4 MB", uploadedAt: "Dec 1, 2024", parentId: "1" },
  { id: "6", name: "Calculus Video.mp4", type: "video", size: "45 MB", uploadedAt: "Nov 28, 2024", parentId: "1" },
  { id: "7", name: "Graph Examples.png", type: "image", size: "1.2 MB", uploadedAt: "Nov 25, 2024", parentId: "1" },
  { id: "8", name: "Quantum Mechanics.pdf", type: "document", size: "5.1 MB", uploadedAt: "Dec 2, 2024", parentId: "2" },
  { id: "9", name: "Lab Experiments.mp4", type: "video", size: "120 MB", uploadedAt: "Nov 30, 2024", parentId: "2" },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Home" }
  ]);
  const [previewItem, setPreviewItem] = useState<Material | null>(null);
  const navigate = useNavigate();

  const currentMaterials = mockMaterials.filter(m => m.parentId === currentFolder);
  const filteredMaterials = currentMaterials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFolderClick = (folder: Material) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id);
  };

  const getIcon = (type: Material["type"]) => {
    switch (type) {
      case "folder": return <Folder className="h-10 w-10 text-primary" />;
      case "document": return <FileText className="h-10 w-10 text-destructive" />;
      case "image": return <Image className="h-10 w-10 text-accent" />;
      case "video": return <Video className="h-10 w-10 text-chart-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Liberty</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Mobile Search */}
        <div className="md:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id ?? "home"} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  index === breadcrumbs.length - 1 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                <span>{crumb.name}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* Materials Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMaterials.map((material) => (
            <Card 
              key={material.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
              onClick={() => material.type === "folder" ? handleFolderClick(material) : setPreviewItem(material)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="mb-3 p-3 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                  {getIcon(material.type)}
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{material.name}</h3>
                {material.size && (
                  <p className="text-xs text-muted-foreground">{material.size}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-16">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No materials found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "This folder is empty"}
            </p>
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewItem && getIcon(previewItem.type)}
              {previewItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
              {previewItem?.type === "image" && (
                <Image className="h-20 w-20 text-muted-foreground" />
              )}
              {previewItem?.type === "video" && (
                <Video className="h-20 w-20 text-muted-foreground" />
              )}
              {previewItem?.type === "document" && (
                <FileText className="h-20 w-20 text-muted-foreground" />
              )}
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Size: {previewItem?.size}</span>
              <span>Uploaded: {previewItem?.uploadedAt}</span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
