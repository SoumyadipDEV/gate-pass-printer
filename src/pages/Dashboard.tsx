import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogOut, Search, Printer, Plus } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassData } from "@/types/gatepass";
import { GatePassPrint } from "@/components/GatePassPrint";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [gatePassList, setGatePassList] = useState<(GatePassData & { id: string; createdBy: string; createdAt: Date })[]>(
    () => {
      const stored = localStorage.getItem("gatePassList");
      return stored ? JSON.parse(stored) : [];
    }
  );
  const [selectedGatePass, setSelectedGatePass] = useState<(GatePassData & { id: string; createdBy: string; createdAt: Date }) | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedGatePass ? `GatePass-${selectedGatePass.gatepassNo}` : "GatePass",
  });

  // Filter gate passes based on search query
  const filteredGatePasses = useMemo(() => {
    if (!searchQuery.trim()) return gatePassList;
    
    const query = searchQuery.toLowerCase();
    return gatePassList.filter((gatePass) => {
      return (
        gatePass.gatepassNo.toLowerCase().includes(query) ||
        gatePass.destination.toLowerCase().includes(query) ||
        gatePass.carriedBy.toLowerCase().includes(query) ||
        gatePass.createdBy.toLowerCase().includes(query)
      );
    });
  }, [gatePassList, searchQuery]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreateNew = () => {
    navigate("/index");
  };

  const handleDeleteGatePass = (id: string) => {
    const updated = gatePassList.filter((gp) => gp.id !== id);
    setGatePassList(updated);
    localStorage.setItem("gatePassList", JSON.stringify(updated));
    if (selectedGatePass?.id === id) {
      setSelectedGatePass(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">SURAKSHA DIAGNOSTIC LIMITED</h1>
            <p className="text-sm text-muted-foreground">Gate Pass Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dashboard Grid Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by GatePass No, Destination, Carried By, or Created By..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-2 text-sm"
              />
            </div>

            {/* Stats Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gate Passes</p>
                  <p className="text-2xl font-bold text-foreground">{gatePassList.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Showing</p>
                  <p className="text-2xl font-bold text-primary">{filteredGatePasses.length}</p>
                </div>
              </div>
            </Card>

            {/* Gate Pass Grid */}
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
              {filteredGatePasses.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <p className="text-muted-foreground text-lg">
                    {gatePassList.length === 0 ? "No gate passes created yet" : "No results found"}
                  </p>
                  {gatePassList.length === 0 && (
                    <Button onClick={handleCreateNew} className="mt-4">
                      Create Your First Gate Pass
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 bg-muted/30 rounded-lg font-semibold text-sm text-foreground sticky top-0 z-10">
                    <div className="col-span-2">GatePass No</div>
                    <div className="col-span-2">Destination</div>
                    <div className="col-span-2">Carried By</div>
                    <div className="col-span-2">Created Date</div>
                    <div className="col-span-2">Created By</div>
                    <div className="col-span-2">Action</div>
                  </div>

                  {/* Table Rows */}
                  {filteredGatePasses.map((gatePass) => (
                    <Card
                      key={gatePass.id}
                      onClick={() => setSelectedGatePass(gatePass)}
                      className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 hover:bg-card/80 group"
                    >
                      {/* Mobile View */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-lg">{gatePass.gatepassNo}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGatePass(gatePass);
                            }}
                            className="gap-1"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="text-xs">Print</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Destination</p>
                            <p className="text-foreground font-medium truncate">{gatePass.destination}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Carried By</p>
                            <p className="text-foreground font-medium truncate">{gatePass.carriedBy}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created Date</p>
                            <p className="text-foreground font-medium">
                              {new Date(gatePass.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created By</p>
                            <p className="text-foreground font-medium truncate">{gatePass.createdBy}</p>
                          </div>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:grid grid-cols-12 gap-3 items-center py-2">
                        <div className="col-span-2">
                          <p className="font-semibold text-foreground truncate">{gatePass.gatepassNo}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-foreground truncate">{gatePass.destination}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-foreground truncate">{gatePass.carriedBy}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(gatePass.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-foreground truncate">{gatePass.createdBy}</p>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGatePass(gatePass);
                            }}
                            className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="text-xs">Print</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Print Preview Section */}
          <div className="lg:col-span-1">
            {selectedGatePass ? (
              <div className="sticky top-24 space-y-4">
                <Card className="p-4 bg-card border-primary/20">
                  <h3 className="font-semibold text-foreground mb-3">Preview & Print</h3>
                  <div className="border border-border rounded-lg overflow-hidden bg-background p-3 mb-4">
                    <div className="bg-white rounded max-h-72 overflow-hidden shadow-sm">
                      <div className="scale-50 origin-top-left">
                        <GatePassPrint ref={printRef} data={selectedGatePass} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePrint()}
                      className="w-full gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Printer className="w-4 h-4" />
                      Print Gate Pass
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteGatePass(selectedGatePass.id)}
                      className="w-full text-xs"
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedGatePass(null)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </Card>

                {/* Details */}
                <Card className="p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gate Pass No</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.gatepassNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Destination</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.destination}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Carried By</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.carriedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Through</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.through}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created Date</p>
                    <p className="font-semibold text-foreground">
                      {new Date(selectedGatePass.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Items Count</p>
                    <p className="font-semibold text-foreground">{selectedGatePass.items.length}</p>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-6 text-center border-dashed sticky top-24">
                <p className="text-muted-foreground mb-4">Select a gate pass to preview and print</p>
                <div className="text-4xl opacity-20 mb-4">📋</div>
              </Card>
            )}
          </div>
        </div>
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

export default Dashboard;
