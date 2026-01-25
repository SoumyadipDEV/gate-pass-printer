import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { GatePassForm } from "@/components/GatePassForm";
import { GatePassPrint } from "@/components/GatePassPrint";
import { GatePassData, GatePassWithMeta } from "@/types/gatepass";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, LogOut, LayoutGrid } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";


const Index = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { toast } = useToast();
  const [gatePassData, setGatePassData] = useState<GatePassWithMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: gatePassData ? `GatePass-${gatePassData.gatepassNo}` : "GatePass",
  });

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
              <Button onClick={() => handlePrint()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Gate Pass
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
                <GatePassPrint ref={printRef} data={gatePassData} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          header, .no-print {
            display: none !important;
          }
          
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
