import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Mail, Lock, Shield, Eye, EyeOff, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && typeof err.message === "string" && err.message) return err.message;

  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === "object" && data !== null) {
      const maybe = data as { error?: unknown; message?: unknown };
      if (typeof maybe.error === "string" && maybe.error) return maybe.error;
      if (typeof maybe.message === "string" && maybe.message) return maybe.message;
    }
  }

  return fallback;
}

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"auth" | "access" | "general">("general");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setSession } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data?.user?.role !== "admin") {
        setError("Access Denied: Only administrators can access this portal. If you believe you should have admin access, please contact your system administrator.");
        setErrorType("access");
        toast({
          title: "Access Denied",
          description: "This account does not have administrator privileges.",
          variant: "destructive",
        });
        return;
      }
      setSession(response.data);
      toast({ title: "Welcome, Admin!", description: "You have successfully logged in." });
      navigate("/admin");
    } catch (err) {
      const errorMessage = getErrorMessage(err, "Login failed. Please check your credentials.");
      
      // Determine error type for better UI feedback
      if (errorMessage.toLowerCase().includes("password")) {
        setErrorType("auth");
        setError(`Incorrect Password: ${errorMessage}`);
      } else if (errorMessage.toLowerCase().includes("not found") || errorMessage.toLowerCase().includes("no account")) {
        setErrorType("auth");
        setError(`Account Not Found: ${errorMessage}`);
      } else if (errorMessage.toLowerCase().includes("blocked") || errorMessage.toLowerCase().includes("deactivated")) {
        setErrorType("access");
        setError(`Account Blocked: ${errorMessage}`);
      } else if (errorMessage.toLowerCase().includes("pending") || errorMessage.toLowerCase().includes("awaiting")) {
        setErrorType("access");
        setError(`Account Pending: ${errorMessage}`);
      } else {
        setErrorType("general");
        setError(errorMessage);
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent/80 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="h-10 w-10 text-primary-foreground" />
          <span className="text-3xl font-bold text-primary-foreground">Liberty</span>
        </Link>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>Manage content and users</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  {errorType === "access" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle className="ml-2">
                    {errorType === "access" ? "Access Denied" : errorType === "auth" ? "Authentication Error" : "Error"}
                  </AlertTitle>
                  <AlertDescription className="ml-2 mt-1">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@liberty.edu"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Access Admin Panel"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Student Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
