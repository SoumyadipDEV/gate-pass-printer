import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GatePassForm } from "@/components/GatePassForm";
import { GatePassPrint } from "@/components/GatePassPrint";
import { GatePassData, GatePassWithMeta } from "@/types/gatepass";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, LogOut, LayoutGrid } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";

type PrintStatus = "idle" | "checking" | "ready" | "generating";


const Index = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { toast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [gatePassData, setGatePassData] = useState<GatePassWithMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<PrintStatus>("idle");

  const pdfUrlFor = (gatePassId: string) => `${API_BASE_URL}/api/gatepass/${gatePassId}/pdf`;

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const isPdfReady = async (url: string) => {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      return response.ok || response.status === 304;
    } catch {
      return false;
    }
  };

  const ensurePdfReady = async (
    gatePass: GatePassWithMeta,
    {
      openOnReady = false,
      silent = false,
      maxAttempts = 3,
    }: { openOnReady?: boolean; silent?: boolean; maxAttempts?: number } = {}
  ) => {
    if (!gatePass.id) return false;

    setPdfStatus("checking");
    const url = pdfUrlFor(gatePass.id);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const ready = await isPdfReady(url);
      if (ready) {
        setPdfStatus("ready");
        if (openOnReady) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
        return true;
      }
      if (attempt < maxAttempts - 1) {
        await wait(1100);
      }
    }

    setPdfStatus("generating");
    if (!silent) {
      toast({
        title: "Generating PDF",
        description: "The gate pass PDF is being prepared. Please try again shortly.",
        variant: "default",
      });
    }
    setTimeout(() => setPdfStatus("idle"), 1500);
    return false;
  };

  useEffect(() => {
    if (!gatePassData?.id) {
      setPdfStatus("idle");
      return;
    }

    ensurePdfReady(gatePassData, { silent: true, openOnReady: false, maxAttempts: 2 });
  }, [gatePassData]);

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
      // Call API to create gate pass
      const { id: gatePassId, gatepassNo } = await GatePassService.createGatePass(data, userName);

      // Prepare the response data to display
      const responseData: GatePassWithMeta = {
        ...data,
        id: gatePassId,
        gatepassNo,
        createdBy: userName,
        createdAt: new Date(),
        userName: userName,
        isEnable: true,
        modifiedBy: null,
        modifiedAt: null,
      };

      setGatePassData(responseData);

      toast({
        title: "Success",
        description: "Gate pass created successfully!",
        variant: "default",
      });
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

  const handleSaveAndReturn = async () => {
    if (!gatePassData || !gatePassData.id) {
      setError("Gate pass data is missing");
      toast({
        title: "Error",
        description: "Gate pass data is incomplete",
        variant: "destructive",
      });
      return;
    }

    try {
      // Navigate to dashboard - data is already saved in the database
      toast({
        title: "Success",
        description: "Redirecting to dashboard...",
        variant: "default",
      });
      navigate("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process request";
      setError(errorMessage);

      // Attempt rollback if something went wrong
      try {
        await GatePassService.rollbackGatePass(gatePassData.id);
        console.log("Rollback completed successfully");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePrintPdf = async () => {
    if (!gatePassData) return;
    await ensurePdfReady(gatePassData, { openOnReady: true });
  };

  const handleBack = () => {
    setGatePassData(null);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  const printLabel =
    pdfStatus === "checking"
      ? "Checking..."
      : pdfStatus === "generating"
        ? "Generating..."
        : "Print Gate Pass";
  const isPrintDisabled = !gatePassData || pdfStatus === "checking" || pdfStatus === "generating";

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
        {!gatePassData ? (
          <GatePassForm onSubmit={handleFormSubmit} isLoading={isLoading} error={error} />
        ) : (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-center gap-4 flex-wrap">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
              <Button onClick={handlePrintPdf} disabled={isPrintDisabled}>
                <Printer className="w-4 h-4 mr-2" />
                {printLabel}
              </Button>
              <Button 
                onClick={handleSaveAndReturn}
                className="bg-green-600 hover:bg-green-700 hidden"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Save & Go to Dashboard
              </Button>
            </div>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="shadow-xl rounded-lg overflow-hidden">
                <GatePassPrint data={gatePassData} />
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
};

export default Index;
