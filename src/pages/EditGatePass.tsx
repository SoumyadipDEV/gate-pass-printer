import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GatePassForm } from "@/components/GatePassForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutGrid, LogOut, Save } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassService } from "@/services/gatepassService";
import { GatePassData, GatePassWithMeta } from "@/types/gatepass";
import { useToast } from "@/hooks/use-toast";

interface LocationState {
  gatePass?: GatePassWithMeta;
}

const EditGatePass = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { toast } = useToast();
  const { id } = useParams();
  const location = useLocation();
  const locationState = location.state as LocationState | undefined;

  const [gatePass, setGatePass] = useState<GatePassWithMeta | null>(
    locationState?.gatePass ?? null
  );
  const [isLoading, setIsLoading] = useState(!locationState?.gatePass);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGatePass = async () => {
      if (!id) {
        setError("Gate Pass ID is missing");
        setIsLoading(false);
        return;
      }

      if (gatePass?.id === id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await GatePassService.fetchGatePasses();
        const found = data.find((item) => item.id === id);

        if (!found) {
          throw new Error("Gate pass not found");
        }

        setGatePass(found);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load gate pass";
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

    void loadGatePass();
  }, [gatePass?.id, id, toast]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  const handleFormSubmit = async (data: GatePassData) => {
    if (!gatePass?.id || !gatePass.gatepassNo) {
      const message = "Gate pass data is missing";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (gatePass.isEnable === false) {
      const message = "This gate pass is disabled and cannot be edited.";
      setError(message);
      toast({
        title: "Action blocked",
        description: message,
        variant: "destructive",
      });
      return;
    }

    const userName = localStorage.getItem("username") || user?.name || gatePass.createdBy;

    setIsSaving(true);
    setError(null);

    try {
      await GatePassService.updateGatePass(
        {
          ...data,
          id: gatePass.id,
          gatepassNo: gatePass.gatepassNo,
          createdBy: gatePass.createdBy ?? userName,
          isEnable: gatePass.isEnable ?? true,
        },
        userName
      );

      toast({
        title: "Success",
        description: "Gate pass updated successfully",
        variant: "default",
      });

      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update gate pass";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
      <main className="container mx-auto p-4 space-y-4">
        {error && !gatePass && (
          <Card className="p-4 bg-destructive/10 border-destructive/50">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Card className="bg-muted/50 border-muted p-4 h-20 animate-pulse" />
            <Card className="bg-muted/50 border-muted p-4 h-96 animate-pulse" />
          </div>
        ) : gatePass ? (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Editing Gate Pass</p>
                  <p className="text-xl font-bold text-foreground">{gatePass.gatepassNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Created By</p>
                  <p className="text-sm text-foreground truncate max-w-[200px]">
                    {gatePass.userName || gatePass.createdBy}
                  </p>
                </div>
              </div>
            </Card>

            {gatePass.isEnable === false ? (
              <Card className="p-6 border-destructive/40 bg-destructive/10">
                <p className="text-destructive text-sm">
                  This gate pass is disabled. Enable it from the dashboard to make changes.
                </p>
                <Button onClick={handleViewDashboard} className="mt-4">
                  Back to Dashboard
                </Button>
              </Card>
            ) : (
            <GatePassForm
              initialData={gatePass}
              onSubmit={handleFormSubmit}
              submitLabel="Update Gate Pass"
              submitIcon={<Save className="w-5 h-5 mr-2" />}
              isLoading={isSaving}
              error={error ?? undefined}
            />
            )}
          </div>
        ) : !error ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-lg">Gate pass not found</p>
            <Button onClick={handleViewDashboard} className="mt-4">
              Back to Dashboard
            </Button>
          </Card>
        ) : null}
      </main>
    </div>
  );
};

export default EditGatePass;
