import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, FolderOpen, Download, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-background" />
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <GraduationCap className="h-12 w-12 text-accent" />
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground">
              Liberty
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Your gateway to educational excellence. Access learning materials, documents, and resources all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link to="/login">Student Login</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/admin/login">Admin Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need to Learn
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Liberty provides a seamless experience for students and administrators to manage educational content.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FolderOpen className="h-8 w-8" />}
              title="Organized Content"
              description="Browse materials organized in folders. Find documents, images, and videos easily."
            />
            <FeatureCard
              icon={<Download className="h-8 w-8" />}
              title="Preview & Download"
              description="Preview materials before downloading. Access your learning resources anytime."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="User Management"
              description="Admins can manage users, assign roles, and control access to materials."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join Liberty today and access a world of learning materials at your fingertips.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/login">Access Materials</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-6 w-6" />
            <span className="font-bold text-lg">Liberty</span>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            © 2024 Liberty. Empowering education through technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card p-8 rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
