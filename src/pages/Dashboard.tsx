import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, Search, Printer, Plus, Trash2, Pencil, FileSpreadsheet } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassWithMeta } from "@/types/gatepass";
import { GatePassPrint } from "@/components/GatePassPrint";
import { useReactToPrint } from "react-to-print";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
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
        (gatePass.mobileNo ? gatePass.mobileNo.toLowerCase().includes(query) : false) ||
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

  const parseLocalDate = (value: string): Date | null => {
    const parts = value.split("-").map((part) => Number(part));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
      return null;
    }
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleExport = () => {
    const fromDate = parseLocalDate(exportFromDate);
    const toDate = parseLocalDate(exportToDate);

    if (!fromDate || !toDate) {
      toast({
        title: "Missing dates",
        description: "Please select both From Date and To Date.",
        variant: "destructive",
      });
      return;
    }

    if (fromDate > toDate) {
      toast({
        title: "Invalid date range",
        description: "From Date cannot be later than To Date.",
        variant: "destructive",
      });
      return;
    }

    const toDateEnd = new Date(toDate);
    toDateEnd.setHours(23, 59, 59, 999);

    const filtered = gatePassList.filter((gatePass) => {
      const createdAt = gatePass.createdAt ? new Date(gatePass.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        return false;
      }
      return createdAt >= fromDate && createdAt <= toDateEnd;
    });

    if (filtered.length === 0) {
      toast({
        title: "No gate passes found",
        description: "No gate passes were created in the selected date range.",
        variant: "default",
      });
      return;
    }

    const rows = filtered.flatMap((gatePass) => {
      const headerData = {
        "GatePass No": gatePass.gatepassNo,
        "GatePass Date": gatePass.date ? formatDate(gatePass.date) : "",
        Destination: gatePass.destination,
        "Carried By": gatePass.carriedBy,
        Through: gatePass.through,
        "Mobile No": gatePass.mobileNo || "",
        "Created By": gatePass.userName || gatePass.createdBy || "",
        "Created Date": gatePass.createdAt ? formatDate(gatePass.createdAt) : "",
      };

      if (!gatePass.items || gatePass.items.length === 0) {
        return [
          {
            ...headerData,
            "Item Sl No": "",
            "Item Description": "",
            "Item Model": "",
            "Item Serial No": "",
            "Item Qty": "",
          },
        ];
      }

      return gatePass.items.map((item) => ({
        ...headerData,
        "Item Sl No": item.slNo,
        "Item Description": item.description,
        "Item Model": item.model,
        "Item Serial No": item.serialNo,
        "Item Qty": item.qty,
      }));
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GatePasses");

    const fileName = `gatepasses_${exportFromDate}_to_${exportToDate}.xlsx`;
    XLSX.writeFile(workbook, fileName, { compression: true });

    toast({
      title: "Export ready",
      description: `Downloaded ${filtered.length} gate pass${filtered.length === 1 ? "" : "es"} in Excel format.`,
    });
    setExportOpen(false);
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
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Gate Passes</DialogTitle>
                  <DialogDescription>
                    Select a date range to export gate passes created between those dates.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-from-date">From Date</Label>
                    <Input
                      id="export-from-date"
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-to-date">To Date</Label>
                    <Input
                      id="export-to-date"
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setExportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport}>Download Excel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                  <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 bg-muted/30 rounded-lg font-semibold text-sm text-foreground sticky top-0 z-10">
                    <div className="col-span-2">GatePass No</div>
                    <div className="col-span-2">Destination</div>
                    <div className="col-span-2">Carried By</div>
                    <div className="col-span-2">Mobile No</div>
                    <div className="col-span-1">Created Date</div>
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
                            <p className="text-muted-foreground text-xs">Mobile No</p>
                            <p className="text-foreground font-medium truncate">{gatePass.mobileNo || "-"}</p>
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
                          <p className="text-foreground truncate">{gatePass.mobileNo || "-"}</p>
                        </div>
                        <div className="col-span-1">
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
