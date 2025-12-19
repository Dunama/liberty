import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Home,
  Camera,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Material {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "video";
  size?: string;
  uploadedAt?: string;
  parentId: string | null;
  url?: string;
}

type FolderDto = { id: string; name: string; created_at?: string };
type FileDto = {
  id: string;
  name: string;
  folder_id?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string;
  url?: string;
};

function materialTypeFromMime(mime?: string | null): Material["type"] {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Home" },
  ]);
  const [previewItem, setPreviewItem] = useState<Material | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    // Load saved profile image from localStorage on initial render
    const saved = localStorage.getItem("profileImage");
    return saved || null;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  useEffect(() => {
    if (!session) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        const [foldersRes, filesRes] = await Promise.all([api.get("/folders"), api.get("/files")]);

        const folders: Material[] = (foldersRes.data as FolderDto[]).map((f) => ({
          id: f.id,
          name: f.name,
          type: "folder",
          parentId: null,
          uploadedAt: f.created_at,
        }));

        const files: Material[] = (filesRes.data as FileDto[]).map((f) => ({
          id: f.id,
          name: f.name,
          type: materialTypeFromMime(f.mime_type),
          parentId: f.folder_id ?? null,
          uploadedAt: f.created_at,
          size: typeof f.size_bytes === "number" ? `${Math.max(0, f.size_bytes)} bytes` : undefined,
          url: f.url,
        }));

        setMaterials([...folders, ...files]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };

    load();
  }, [navigate, session]);

  const currentMaterials = materials.filter((m) => m.parentId === currentFolder);
  const filteredMaterials = currentMaterials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFolderClick = (folder: Material) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setProfileImage(imageData);
        // Persist to localStorage so it survives navigation
        localStorage.setItem("profileImage", imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const getIcon = (type: Material["type"]) => {
    switch (type) {
      case "folder":
        return <Folder className="h-10 w-10 text-primary" />;
      case "document":
        return <FileText className="h-10 w-10 text-destructive" />;
      case "image":
        return <Image className="h-10 w-10 text-accent" />;
      case "video":
        return <Video className="h-10 w-10 text-chart-3" />;
    }
  };

  const userInitial = session?.user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold">Liberty</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium text-sm truncate max-w-[150px]">{session?.user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
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
              onClick={() =>
                material.type === "folder" ? handleFolderClick(material) : setPreviewItem(material)
              }
            >
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="mb-3 p-3 rounded-lg bg-secondary group-hover:bg-primary/10 transition-colors">
                  {getIcon(material.type)}
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{material.name}</h3>
                {material.size && <p className="text-xs text-muted-foreground">{material.size}</p>}
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
        <DialogContent className="max-w-lg sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewItem && getIcon(previewItem.type)}
              {previewItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Actual preview content */}
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
              {previewItem?.type === "image" && previewItem?.url ? (
                <img 
                  src={previewItem.url} 
                  alt={previewItem.name} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : previewItem?.type === "video" && previewItem?.url ? (
                <video 
                  src={previewItem.url} 
                  controls 
                  className="max-w-full max-h-full"
                />
              ) : previewItem?.type === "document" && previewItem?.url?.startsWith("data:application/pdf") ? (
                <iframe 
                  src={previewItem.url} 
                  className="w-full h-full min-h-[300px]" 
                  title={previewItem.name}
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Size: {previewItem?.size || "Unknown"}</span>
              <span>Uploaded: {previewItem?.uploadedAt ? new Date(previewItem.uploadedAt).toLocaleDateString() : "Unknown"}</span>
            </div>
            <div className="flex gap-3">
              {previewItem?.url && (
                <Button 
                  className="flex-1" 
                  variant="outline"
                  onClick={() => {
                    if (previewItem?.url) {
                      window.open(previewItem.url, "_blank");
                    }
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
              <Button 
                className="flex-1"
                onClick={() => {
                  if (previewItem?.url) {
                    const link = document.createElement("a");
                    link.href = previewItem.url;
                    link.download = previewItem.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!previewItem?.url}
              >
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
