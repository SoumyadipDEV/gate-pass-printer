import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GatePassForm } from "@/components/GatePassForm";
import { GatePassData } from "@/types/gatepass";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: GatePassData) => {
    const userName = localStorage.getItem("username") || user?.name;
    
    if (!userName) {
      setError("User name not found");
      toast({
        title: "Error",
        description: "User name not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { gatepassNo } = await GatePassService.createGatePass(data, userName);

      toast({
        title: "Success",
        description: `Gate pass ${gatepassNo} created successfully.`,
        variant: "default",
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create gate pass";
      setError(errorMessage);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50 py-1 mb-2">
        <div className="container mx-auto px-2 py-2 flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">SURAKSHA DIAGNOSTIC LIMITED</h1>
            <p className="text-sm text-muted-foreground">Gate Pass Management System</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewDashboard} className="flex gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <GatePassForm
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          error={error}
          submitLabel="Generate Gate Pass"
        />
      </main>

    </div>
  );
};

export default Index;
