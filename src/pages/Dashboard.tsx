import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogOut, Search, Printer, Plus, Trash2, Pencil } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassWithMeta } from "@/types/gatepass";
import { GatePassPrint } from "@/components/GatePassPrint";
import { useReactToPrint } from "react-to-print";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [gatePassList, setGatePassList] = useState<GatePassWithMeta[]>([]);
  const [selectedGatePass, setSelectedGatePass] = useState<GatePassWithMeta | null>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch gate passes from API using service
  useEffect(() => {
    const fetchGatePasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await GatePassService.fetchGatePasses();
        setGatePassList(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load gate passes";
        setError(errorMessage);
        setGatePassList([]);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGatePasses();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedGatePass ? `GatePass-${selectedGatePass.gatepassNo}` : "GatePass",
    onAfterPrint: () => {
      setShouldPrint(false);
    },
  });

  // Trigger print when shouldPrint flag is set
  useEffect(() => {
    if (shouldPrint && selectedGatePass) {
      handlePrint();
    }
  }, [shouldPrint, selectedGatePass, handlePrint]);

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

  const handleDeleteGatePass = async (id: string) => {
    try {
      // Call API to delete gate pass
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/gatepassdelete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete gate pass");
      }

      // Update local state
      const updated = gatePassList.filter((gp) => gp.id !== id);
      setGatePassList(updated);
      
      if (selectedGatePass?.id === id) {
        setSelectedGatePass(null);
      }

      toast({
        title: "Success",
        description: "Gate pass deleted successfully",
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete gate pass";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePrintGatePass = (gatePass: GatePassWithMeta) => {
    setSelectedGatePass(gatePass);
    setShouldPrint(true);
  };

  const handleEditGatePass = (gatePass: GatePassWithMeta) => {
    navigate(`/edit/${gatePass.id}`, { state: { gatePass } });
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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
            <Button variant="outline" onClick={handleCreateNew} className="flex gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create New</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive/50">
              <p className="text-destructive text-sm">{error}</p>
            </Card>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {/* Skeleton loader for stats */}
              <div className="flex items-end justify-between gap-4">
                <Card className="bg-muted/50 border-muted p-4 flex-1 h-20 animate-pulse" />
                <div className="w-80 h-10 bg-muted rounded-lg animate-pulse" />
              </div>
              {/* Skeleton loaders for rows */}
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Card
                    key={i}
                    className="p-4 bg-muted/50 border-muted h-24 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar with Search and Stats */}
              <div className="flex items-end justify-between gap-4">
                {/* Stats Card */}
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 p-4 flex-1">
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

                {/* Search Bar - Right Aligned */}
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Gate Pass Grid - Full Width */}
              <div className="space-y-2">
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
                  <div className="hidden md:grid grid-cols-11 gap-3 px-4 py-2 bg-muted/30 rounded-lg font-semibold text-sm text-foreground sticky top-0 z-10">
                    <div className="col-span-2">GatePass No</div>
                    <div className="col-span-2">Destination</div>
                    <div className="col-span-2">Carried By</div>
                    <div className="col-span-2">Created Date</div>
                    <div className="col-span-1">Created By</div>
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
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintGatePass(gatePass);
                              }}
                              className="gap-1"
                            >
                              <Printer className="w-4 h-4" />
                              <span className="text-xs">Print</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditGatePass(gatePass);
                              }}
                              className="gap-1"
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="text-xs">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGatePass(gatePass.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                              {formatDate(gatePass.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created By</p>
                            <p className="text-foreground font-medium truncate">{gatePass.userName || gatePass.createdBy}</p>
                          </div>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:grid grid-cols-11 gap-3 items-center py-2">
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
                            {formatDate(gatePass.createdAt)}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-foreground truncate text-sm">{gatePass.userName || gatePass.createdBy}</p>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintGatePass(gatePass);
                            }}
                            className="gap-1 flex-1"
                          >
                            <Printer className="w-4 h-4" />
                            <span className="text-xs">Print</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditGatePass(gatePass);
                            }}
                            className="gap-1 flex-1"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="text-xs">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGatePass(gatePass.id);
                            }}
                            className="gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            </>
          )}
        </div>

        {/* Hidden Print Component */}
        {selectedGatePass && (
          <div style={{ display: "none" }}>
            <GatePassPrint ref={printRef} data={selectedGatePass} />
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

export default Dashboard;
