import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { GatePassForm } from "@/components/GatePassForm";
import { GatePassPrint } from "@/components/GatePassPrint";
import { GatePassData } from "@/types/gatepass";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import surakshaLogo from "@/assets/suraksha-logo.jpg";

const Index = () => {
  const [gatePassData, setGatePassData] = useState<GatePassData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: gatePassData ? `GatePass-${gatePassData.gatepassNo}` : "GatePass",
  });

  const handleFormSubmit = (data: GatePassData) => {
    setGatePassData(data);
  };

  const handleBack = () => {
    setGatePassData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4">
          <img src={surakshaLogo} alt="Suraksha Diagnostic Limited" className="h-12 object-contain" />
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">SURAKSHA DIAGNOSTIC LIMITED</h1>
            <p className="text-sm text-muted-foreground">Gate Pass Management System</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!gatePassData ? (
          <GatePassForm onSubmit={handleFormSubmit} />
        ) : (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
              <Button onClick={() => handlePrint()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Gate Pass
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
