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
import { LogOut, Search, Printer, Plus, Trash2, Pencil, FileSpreadsheet, ToggleLeft, ToggleRight, UserPlus } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { GatePassWithMeta } from "@/types/gatepass";
import { GatePassPrint } from "@/components/GatePassPrint";
import { useReactToPrint } from "react-to-print";
import { GatePassService } from "@/services/gatepassService";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Switch } from "@/components/ui/switch";

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useUser();
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isUserActive, setIsUserActive] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
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
    if (!isGatePassEnabled(gatePass.isEnable)) {
      toast({
        title: "Action blocked",
        description: "Disabled gate passes cannot be printed.",
        variant: "destructive",
      });
      return;
    }
    setSelectedGatePass(gatePass);
    setShouldPrint(true);
  };

  const handleEditGatePass = (gatePass: GatePassWithMeta) => {
    if (!isGatePassEnabled(gatePass.isEnable)) {
      toast({
        title: "Action blocked",
        description: "Disabled gate passes cannot be edited.",
        variant: "destructive",
      });
      return;
    }
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

  const resolveUserName = (fallback?: string) =>
    localStorage.getItem("username") || user?.name || fallback || "";

  const isGatePassEnabled = (value?: boolean | number | string | null) => {
    if (value === undefined || value === null) {
      return true;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return value !== "0";
    }
    return Boolean(value);
  };

  const isReturnablePass = (value?: boolean | number | string | null) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    if (typeof value === "string") {
      return value !== "0";
    }
    return Boolean(value);
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString?: string | Date | null): string => {
    if (!dateString) {
      return "-";
    }
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleExport = () => {
    type ExportRow = {
      "GatePass No": string;
      "GatePass Date": string;
      Destination: string;
      "Carried By": string;
      Through: string;
      "Mobile No": string;
      "Created By": string;
      "Created Date": string;
      "Modified By": string;
      "Modified Date": string;
      "Is Enabled": "Yes" | "No";
      Returnable: "Yes" | "No";
      "Item Sl No": string | number;
      "Item Description": string;
      "Item Make": string;
      "Item Model": string;
      "Item Serial No": string;
      "Item Qty": string | number;
    };

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

    const rows = filtered.flatMap<ExportRow>((gatePass) => {
      const headerData: Omit<
        ExportRow,
        "Item Sl No" | "Item Description" | "Item Model" | "Item Serial No" | "Item Qty"
      > = {
        "GatePass No": gatePass.gatepassNo || "",
        "GatePass Date": gatePass.date ? formatDate(gatePass.date) : "",
        Destination: gatePass.destination,
        "Carried By": gatePass.carriedBy,
        Through: gatePass.through,
        "Mobile No": gatePass.mobileNo || "",
        "Created By": gatePass.userName || gatePass.createdBy || "",
        "Created Date": gatePass.createdAt ? formatDate(gatePass.createdAt) : "",
        "Modified By": gatePass.modifiedBy || "",
        "Modified Date": gatePass.modifiedAt ? formatDate(gatePass.modifiedAt) : "",
        "Is Enabled": isGatePassEnabled(gatePass.isEnable) ? "Yes" : "No",
        Returnable: isReturnablePass(gatePass.returnable) ? "Yes" : "No",
      };

      if (!gatePass.items || gatePass.items.length === 0) {
        return [
          {
            ...headerData,
            "Item Sl No": "",
            "Item Description": "",
            "Item Make": "",
            "Item Model": "",
            "Item Serial No": "",
            "Item Qty": "",
          },
        ];
      }

      return gatePass.items.map<ExportRow>((item) => ({
        ...headerData,
        "Item Sl No": item.slNo,
        "Item Description": item.description,
        "Item Make": item.makeItem ?? "",
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

  const handleToggleGatePass = async (gatePass: GatePassWithMeta) => {
    const userName = resolveUserName(gatePass.createdBy);
    if (!userName) {
      toast({
        title: "User not found",
        description: "Please login again to update gate pass status.",
        variant: "destructive",
      });
      return;
    }

    const nextIsEnabled = !isGatePassEnabled(gatePass.isEnable);
    setUpdatingId(gatePass.id);
    const gatepassNo = gatePass.gatepassNo;

    if (!gatepassNo) {
      toast({
        title: "Missing gate pass number",
        description: "Cannot update gate pass status because gatepassNo is missing.",
        variant: "destructive",
      });
      setUpdatingId(null);
      return;
    }

    try {
      await GatePassService.updateGatePass(
        {
          ...gatePass,
          gatepassNo,
          isEnable: nextIsEnabled,
        },
        userName
      );

      const updatedGatePass = {
        ...gatePass,
        isEnable: nextIsEnabled,
        modifiedBy: userName,
        modifiedAt: new Date(),
      };

      setGatePassList((prev) =>
        prev.map((item) => (item.id === gatePass.id ? updatedGatePass : item))
      );

      if (selectedGatePass?.id === gatePass.id) {
        setSelectedGatePass(updatedGatePass);
      }

      toast({
        title: "Status updated",
        description: `Gate pass ${nextIsEnabled ? "enabled" : "disabled"} successfully.`,
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update gate pass status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const resetUserForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPassword("");
    setIsUserActive(true);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword.trim()) {
      toast({
        title: "Missing details",
        description: "Email, user name and password are required.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/createlogin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          userName: newUserName.trim(),
          password: newUserPassword,
          isActive: isUserActive ? 1 : 0,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        const message = data?.message || "Failed to create user";
        throw new Error(message);
      }

      toast({
        title: "User created",
        description: data?.message || "User created successfully.",
        variant: "default",
      });
      resetUserForm();
      setUserDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
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
            <Dialog
              open={userDialogOpen}
              onOpenChange={(open) => {
                setUserDialogOpen(open);
                if (!open) {
                  resetUserForm();
                  setIsCreatingUser(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">New User</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a login by providing email, user name and password. Users are active by default.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateUser();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">Email</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-name">User Name</Label>
                    <Input
                      id="new-user-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-password">Password</Label>
                    <Input
                      id="new-user-password"
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active user</p>
                      <p className="text-xs text-muted-foreground">Toggle off to create an inactive login.</p>
                    </div>
                    <Switch
                      id="new-user-active"
                      checked={isUserActive}
                      onCheckedChange={setIsUserActive}
                    />
                  </div>
                  <DialogFooter className="sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUserDialogOpen(false)}
                      disabled={isCreatingUser}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreatingUser}>
                      {isCreatingUser ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                  <div className="hidden md:grid grid-cols-[1.2fr_0.9fr_1.2fr_1.2fr_1fr_1fr_1fr_1fr_1fr_1.8fr] gap-3 px-4 py-2 bg-muted/30 rounded-lg font-semibold text-sm text-foreground sticky top-0 z-10">
                    <div>GatePass No</div>
                    <div>Returnable</div>
                    <div>Destination</div>
                    <div>Carried By</div>
                    <div>Mobile No</div>
                    <div>Created Date</div>
                    <div>Created By</div>
                    <div>Modified Date</div>
                    <div>Modified By</div>
                    <div>Action</div>
                  </div>

                  {/* Table Rows */}
                  {filteredGatePasses.map((gatePass) => {
                    const isEnabled = isGatePassEnabled(gatePass.isEnable);
                    const isReturnable = isReturnablePass(gatePass.returnable);
                    const isUpdating = updatingId === gatePass.id;
                    return (
                    <Card
                      key={gatePass.id}
                      onClick={() => {
                        if (!isEnabled) {
                          return;
                        }
                        setSelectedGatePass(gatePass);
                      }}
                      className={`p-4 transition-all duration-200 group ${
                        isEnabled
                          ? "cursor-pointer hover:shadow-md hover:border-primary/50 hover:bg-card/80"
                          : "cursor-not-allowed opacity-70"
                      }`}
                    >
                      {/* Mobile View */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground text-lg">{gatePass.gatepassNo}</p>
                            <span
                              className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${
                                isReturnable
                                  ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                  : "text-muted-foreground border-border bg-muted/40"
                              }`}
                            >
                              {isReturnable ? "Returnable" : "Non-returnable"}
                            </span>
                            {!isEnabled && (
                              <span className="text-xs font-semibold text-destructive border border-destructive/40 px-2 py-0.5 rounded-full">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isEnabled}
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
                              disabled={!isEnabled}
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
                              variant="outline"
                              disabled={isUpdating}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGatePass(gatePass);
                              }}
                              className="gap-1"
                            >
                              {isEnabled ? (
                                <ToggleLeft className="w-4 h-4" />
                              ) : (
                                <ToggleRight className="w-4 h-4" />
                              )}
                              <span className="text-xs">{isEnabled ? "Disable" : "Enable"}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled
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
                            <p className="text-muted-foreground text-xs">Returnable</p>
                            <p className="text-foreground font-medium">{isReturnable ? "Yes" : "No"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created Date</p>
                            <p className="text-foreground font-medium">
                              {formatDate(gatePass.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Created By</p>
                            <p className="text-foreground font-medium whitespace-normal break-words">
                              {gatePass.userName || gatePass.createdBy}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Modified Date</p>
                            <p className="text-foreground font-medium">
                              {formatDate(gatePass.modifiedAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Modified By</p>
                            <p className="text-foreground font-medium whitespace-normal break-words">
                              {gatePass.modifiedBy || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:grid grid-cols-[1.2fr_0.9fr_1.2fr_1.2fr_1fr_1fr_1fr_1fr_1fr_1.8fr] gap-3 items-center py-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{gatePass.gatepassNo}</p>
                            {!isEnabled && (
                              <span className="text-xs font-semibold text-destructive border border-destructive/40 px-2 py-0.5 rounded-full">
                                Disabled
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                              isReturnable
                                ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                                : "text-muted-foreground border-border bg-muted/40"
                            }`}
                          >
                            {isReturnable ? "Returnable" : "Non-returnable"}
                          </span>
                        </div>
                        <div>
                          <p className="text-foreground truncate">{gatePass.destination}</p>
                        </div>
                        <div>
                          <p className="text-foreground truncate">{gatePass.carriedBy}</p>
                        </div>
                        <div>
                          <p className="text-foreground truncate">{gatePass.mobileNo || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(gatePass.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground text-sm whitespace-normal break-words">
                            {gatePass.userName || gatePass.createdBy}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(gatePass.modifiedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground text-sm whitespace-normal break-words">
                            {gatePass.modifiedBy || "-"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isEnabled}
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
                            disabled={!isEnabled}
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
                            variant="outline"
                            disabled={isUpdating}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleGatePass(gatePass);
                            }}
                            className="gap-1"
                          >
                            {isEnabled ? (
                              <ToggleLeft className="w-4 h-4" />
                            ) : (
                              <ToggleRight className="w-4 h-4" />
                            )}
                            <span className="text-xs">{isEnabled ? "Disable" : "Enable"}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled
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
                  )})}
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
