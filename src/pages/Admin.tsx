import { useState } from "react";
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
  GraduationCap, 
  Search, 
  Folder, 
  FileText, 
  Image, 
  Video, 
  Upload,
  Plus,
  Users,
  FolderPlus,
  LogOut,
  Trash2,
  MoreVertical,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  name: string;
  type: "folder" | "document" | "image" | "video";
  size?: string;
  uploadedAt?: string;
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

const mockMaterials: Material[] = [
  { id: "1", name: "Mathematics", type: "folder" },
  { id: "2", name: "Physics", type: "folder" },
  { id: "3", name: "Chemistry", type: "folder" },
  { id: "4", name: "Welcome Guide.pdf", type: "document", size: "1.2 MB", uploadedAt: "Dec 1, 2024" },
];

const mockUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@university.edu", avatar: "", isAdmin: false, isActive: true, joinedAt: "Nov 15, 2024" },
  { id: "2", name: "Bob Smith", email: "bob@university.edu", avatar: "", isAdmin: false, isActive: true, joinedAt: "Nov 20, 2024" },
  { id: "3", name: "Carol Williams", email: "carol@university.edu", avatar: "", isAdmin: true, isActive: true, joinedAt: "Oct 10, 2024" },
  { id: "4", name: "David Brown", email: "david@university.edu", avatar: "", isAdmin: false, isActive: false, joinedAt: "Nov 25, 2024" },
  { id: "5", name: "Eva Martinez", email: "eva@university.edu", avatar: "", isAdmin: false, isActive: true, joinedAt: "Dec 1, 2024" },
];

const Admin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState(mockMaterials);
  const [users, setUsers] = useState(mockUsers);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: Material = {
      id: Date.now().toString(),
      name: newFolderName,
      type: "folder",
    };
    setMaterials([...materials, newFolder]);
    setNewFolderName("");
    setIsCreateFolderOpen(false);
    toast({ title: "Folder created", description: `"${newFolderName}" has been created.` });
  };

  const handleDeleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
    toast({ title: "Deleted", description: "Material has been removed." });
  };

  const handleToggleAdmin = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u
    ));
    toast({ title: "Role updated", description: "User role has been changed." });
  };

  const handleToggleActive = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
    const user = users.find(u => u.id === userId);
    toast({ 
      title: user?.isActive ? "Account deactivated" : "Account activated",
      description: `${user?.name}'s account has been ${user?.isActive ? "deactivated" : "activated"}.`
    });
  };

  const getIcon = (type: Material["type"]) => {
    switch (type) {
      case "folder": return <Folder className="h-6 w-6 text-primary" />;
      case "document": return <FileText className="h-6 w-6 text-destructive" />;
      case "image": return <Image className="h-6 w-6 text-accent" />;
      case "video": return <Video className="h-6 w-6 text-chart-3" />;
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            <span className="text-xl font-bold">Liberty Admin</span>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/admin/login")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="materials" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <TabsList>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Materials
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <div className="flex gap-3">
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
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
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, PNG, JPG, MP4 (max 100MB)
                      </p>
                      <Input type="file" className="hidden" />
                    </div>
                    <Button className="w-full" onClick={() => {
                      setIsUploadOpen(false);
                      toast({ title: "File uploaded", description: "Your file has been uploaded successfully." });
                    }}>
                      Upload
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-secondary">
                        {getIcon(material.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
                        {material.size && (
                          <p className="text-sm text-muted-foreground">
                            {material.size} • {material.uploadedAt}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      !user.isActive ? "bg-muted/50 opacity-75" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.name}</h3>
                          {user.isAdmin && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="destructive">Deactivated</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Joined {user.joinedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`admin-${user.id}`} className="text-sm text-muted-foreground">Admin</Label>
                        <Switch
                          id={`admin-${user.id}`}
                          checked={user.isAdmin}
                          onCheckedChange={() => handleToggleAdmin(user.id)}
                        />
                      </div>
                      <Button
                        variant={user.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
