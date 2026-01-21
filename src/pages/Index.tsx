import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { GatePassForm } from "@/components/GatePassForm";
import { GatePassPrint } from "@/components/GatePassPrint";
import { GatePassData } from "@/types/gatepass";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, LogOut, LayoutGrid } from "lucide-react";
import { useUser } from "@/contexts/UserContext";


const Index = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const [gatePassData, setGatePassData] = useState<GatePassData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: gatePassData ? `GatePass-${gatePassData.gatepassNo}` : "GatePass",
  });

  const handleFormSubmit = (data: GatePassData) => {
    setGatePassData(data);
  };

  const handleSaveAndReturn = () => {
    if (gatePassData) {
      // Get existing gate passes from localStorage
      const existingList = localStorage.getItem("gatePassList");
      const gatePassList = existingList ? JSON.parse(existingList) : [];
      
      // Create simple ID using timestamp and random number
      const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new entry with additional metadata
      const newEntry = {
        ...gatePassData,
        id: newId,
        createdBy: user?.email || "Unknown",
        createdAt: new Date(),
      };
      
      // Add to list and save
      gatePassList.push(newEntry);
      localStorage.setItem("gatePassList", JSON.stringify(gatePassList));
      
      // Navigate to dashboard
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    setGatePassData(null);
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
          <GatePassForm onSubmit={handleFormSubmit} />
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
                className="bg-green-600 hover:bg-green-700"
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
