import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GraduationCap, 
  Search, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Upload,
  Users,
  FolderPlus,
  LogOut,
  Trash2,
  MoreVertical,
  ShieldCheck,
  UserX,
  UserCheck,
  Menu,
  X,
  File,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Material {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "video";
  size?: string;
  uploadedAt?: string;
  parentId?: string | null;
  url?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  isActive: boolean;
  joinedAt: string;
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

type UserDto = {
  id: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "pending" | "blocked";
  created_at?: string;
};

function materialTypeFromMime(mime?: string | null): Material["type"] {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

function safeJoinedAt(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

function nameFromEmail(email: string) {
  const local = (email || "").split("@")[0] || email;
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Extract user-friendly error message from API errors
function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === "object" && data !== null) {
      const maybe = data as { error?: unknown; message?: unknown };
      if (typeof maybe.error === "string" && maybe.error) return maybe.error;
      if (typeof maybe.message === "string" && maybe.message) return maybe.message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// Base64-in-JSON uploads are constrained (Vercel/serverless body limits + base64 overhead).
// Keep this conservative and nudge large uploads toward object storage.
const MAX_SINGLE_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const Admin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("none");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, logout } = useAuth();

  const folders = materials.filter((m) => m.type === "folder");

  useEffect(() => {
    if (!session || session.user.role !== "admin") {
      navigate("/admin/login");
      return;
    }

    const load = async () => {
      try {
        const [foldersRes, filesRes, usersRes] = await Promise.all([
          api.get("/folders"),
          api.get("/files"),
          api.get("/users"),
        ]);

        const foldersData: Material[] = (foldersRes.data as FolderDto[]).map((f) => ({
          id: f.id,
          name: f.name,
          type: "folder",
          uploadedAt: f.created_at,
          parentId: null,
        }));

        const filesData: Material[] = (filesRes.data as FileDto[]).map((f) => ({
          id: f.id,
          name: f.name,
          type: materialTypeFromMime(f.mime_type),
          size: typeof f.size_bytes === "number" ? formatBytes(f.size_bytes) : undefined,
          uploadedAt: f.created_at,
          parentId: f.folder_id ?? null,
          url: f.url,
        }));

        const mappedUsers: User[] = (usersRes.data as UserDto[]).map((u) => ({
          id: u.id,
          email: u.email,
          name: nameFromEmail(u.email),
          avatar: "",
          isAdmin: u.role === "admin",
          isActive: u.status === "active",
          joinedAt: safeJoinedAt(u.created_at),
        }));

        setMaterials([...foldersData, ...filesData]);
        setUsers(mappedUsers);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };

    load();
  }, [navigate, session]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post("/folders", { name: newFolderName.trim() });
      const f = res.data as FolderDto;
      const newFolder: Material = {
        id: f.id,
        name: f.name,
        type: "folder",
        uploadedAt: f.created_at,
        parentId: null,
      };
      setMaterials([newFolder, ...materials]);
      const createdName = newFolderName;
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      toast({ title: "Folder created", description: `"${createdName}" has been created successfully.` });
    } catch (err) {
      toast({ 
        title: "Couldn't create folder", 
        description: getErrorMessage(err, "Something went wrong. Please try again."), 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const material = materials.find((m) => m.id === id);
    if (!material) return;
    try {
      if (material.type === "folder") {
        await api.delete(`/folders/${id}`);
      } else {
        await api.delete(`/files/${id}`);
      }
      setMaterials(materials.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: `"${material.name}" has been removed successfully.` });
    } catch (err) {
      toast({ 
        title: "Couldn't delete", 
        description: getErrorMessage(err, "Something went wrong. Please try again."), 
        variant: "destructive" 
      });
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const nextRole = user.isAdmin ? "user" : "admin";
    try {
      await api.patch(`/users/${userId}`, { role: nextRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u)));
      toast({ 
        title: "Role updated", 
        description: `${user.name} is now ${user.isAdmin ? "a regular user" : "an admin"}.` 
      });
    } catch (err) {
      toast({ 
        title: "Couldn't update role", 
        description: getErrorMessage(err, "Something went wrong. Please try again."), 
        variant: "destructive" 
      });
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const nextStatus = user.isActive ? "blocked" : "active";
    try {
      await api.patch(`/users/${userId}`, { status: nextStatus });
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
      toast({
        title: user.isActive ? "Account deactivated" : "Account activated",
        description: `${user.name}'s account has been ${user.isActive ? "deactivated" : "activated"}.`,
      });
    } catch (err) {
      toast({ 
        title: "Couldn't update account", 
        description: getErrorMessage(err, "Something went wrong. Please try again."), 
        variant: "destructive" 
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const tooLarge = files.filter((f) => f.size > MAX_SINGLE_FILE_BYTES);
    const allowed = files.filter((f) => f.size <= MAX_SINGLE_FILE_BYTES);

    setSelectedFiles(allowed);

    if (tooLarge.length > 0) {
      const maxNames = 3;
      const names = tooLarge
        .slice(0, maxNames)
        .map((f) => `${f.name} (${formatBytes(f.size)})`)
        .join(", ");
      const more = tooLarge.length > maxNames ? ` +${tooLarge.length - maxNames} more` : "";

      toast({
        title: "File too large",
        description: `Some files were skipped because they exceed ${formatBytes(MAX_SINGLE_FILE_BYTES)}: ${names}${more}.`,
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({ title: "No files", description: "Please select files to upload.", variant: "destructive" });
      return;
    }

    const stillTooLarge = selectedFiles.filter((f) => f.size > MAX_SINGLE_FILE_BYTES);
    if (stillTooLarge.length > 0) {
      toast({
        title: "File too large",
        description: `Please remove files larger than ${formatBytes(MAX_SINGLE_FILE_BYTES)} and try again.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        // Convert file to base64 data URL (for demo; use cloud storage in production)
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.post("/files", {
          name: file.name,
          url: dataUrl,
          mime_type: file.type,
          size_bytes: file.size,
          folder_id: selectedFolderId === "none" ? null : selectedFolderId,
        });

        const f = res.data as FileDto;
        const newFile: Material = {
          id: f.id,
          name: f.name,
          type: materialTypeFromMime(f.mime_type),
          size: typeof f.size_bytes === "number" ? formatBytes(f.size_bytes) : undefined,
          uploadedAt: f.created_at,
          parentId: f.folder_id ?? null,
          url: f.url,
        };
        setMaterials((prev) => [newFile, ...prev]);
      }

      toast({
        title: "Upload complete",
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });
      setSelectedFiles([]);
      setSelectedFolderId("none");
      setIsUploadOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast({ 
        title: "Upload failed", 
        description: getErrorMessage(err, "The file couldn't be uploaded. It may be too large or there was a connection issue."), 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (type: Material["type"]) => {
    switch (type) {
      case "folder": return <Folder className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />;
      case "document": return <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />;
      case "image": return <Image className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />;
      case "video": return <Video className="h-5 w-5 sm:h-6 sm:w-6 text-chart-3" />;
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="text-lg sm:text-xl font-bold">Liberty Admin</span>
          </Link>
          
          {/* Desktop logout */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-primary-foreground/20 px-3 py-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="materials" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Tabs - full width on mobile */}
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
              <TabsTrigger value="materials" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Folder className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Materials</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Users</span>
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4 sm:space-y-6">
            {/* Action buttons - stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        placeholder="Enter folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateFolder} className="w-full">
                      Create Folder
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Folder selection */}
                    <div className="space-y-2">
                      <Label>Upload to folder (optional)</Label>
                      <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select folder" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No folder (root)</SelectItem>
                          {folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* File input */}
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Tap to select files
                      </p>
                      <p className="text-xs text-muted-foreground">
                          Images, Videos, PDFs, Documents (max {formatBytes(MAX_SINGLE_FILE_BYTES)} each)
                        </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        <Label>Selected files ({selectedFiles.length})</Label>
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-secondary rounded text-sm"
                          >
                            <File className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      className="w-full"
                      disabled={selectedFiles.length === 0 || isUploading}
                    >
                      {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Materials list */}
            <div className="grid gap-2 sm:gap-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-secondary flex-shrink-0">
                        {getIcon(material.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">{material.name}</h3>
                        {material.size && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {material.size}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteMaterial(material.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}

              {filteredMaterials.length === 0 && (
                <div className="text-center py-12 sm:py-16">
                  <Folder className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">No materials found</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a folder or upload files to get started
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  All Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 space-y-3 sm:space-y-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`p-3 sm:p-4 rounded-lg border ${
                      !user.isActive ? "bg-muted/50 opacity-75" : "bg-card"
                    }`}
                  >
                    {/* User info - stacks on mobile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <h3 className="font-medium text-sm sm:text-base truncate">{user.name}</h3>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                            {!user.isActive && (
                              <Badge variant="destructive" className="text-xs">Deactivated</Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">Joined {user.joinedAt}</p>
                        </div>
                      </div>

                      {/* Actions - row on mobile */}
                      <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-0 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`admin-${user.id}`} className="text-xs sm:text-sm text-muted-foreground">Admin</Label>
                          <Switch
                            id={`admin-${user.id}`}
                            checked={user.isAdmin}
                            onCheckedChange={() => handleToggleAdmin(user.id)}
                          />
                        </div>
                        <Button
                          variant={user.isActive ? "destructive" : "default"}
                          size="sm"
                          className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                          onClick={() => handleToggleActive(user.id)}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden xs:inline">Deactivate</span>
                              <span className="xs:hidden">Off</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden xs:inline">Activate</span>
                              <span className="xs:hidden">On</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base font-medium mb-2">No users found</h3>
                    <p className="text-sm text-muted-foreground">No users match your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
