import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Printer } from "lucide-react";
import { GatePassItem, GatePassData } from "@/types/gatepass";
import { Destination, DestinationService } from "@/services/destinationService";

interface GatePassFormProps {
  onSubmit: (data: GatePassData) => void;
  initialData?: Partial<GatePassData>;
  submitLabel?: string;
  submitIcon?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
}

const throughOptions = [
  "By Hand",
  "Car",
  "Logistics",
  "House Keeping"
];

const TEXT_FIELD_MAX_LENGTH = 500;
const MAX_ITEMS = 3;

const EMPTY_ITEM: GatePassItem = { slNo: 1, description: "", makeItem: "", model: "", serialNo: "", qty: 1 };

const normalizeItems = (items?: GatePassItem[]) => {
  if (!items || items.length === 0) {
    return [EMPTY_ITEM];
  }
  return items.map((item, index) => ({
    ...item,
    slNo: index + 1,
    makeItem: item.makeItem ?? "",
  }));
};

const toBoolean = (value: unknown, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
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

export function GatePassForm({
  onSubmit,
  initialData,
  submitLabel = "Generate & Print Gate Pass",
  submitIcon,
  isLoading = false,
  error,
}: GatePassFormProps) {
  const [items, setItems] = useState<GatePassItem[]>(normalizeItems(initialData?.items));
  const [destination, setDestination] = useState(initialData?.destination ?? "");
  const [destinationId, setDestinationId] = useState<string | number | undefined>(initialData?.destinationId);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [carriedBy, setCarriedBy] = useState(initialData?.carriedBy ?? "");
  const [through, setThrough] = useState(initialData?.through ?? "");
  const [mobileNo, setMobileNo] = useState(initialData?.mobileNo ?? "");
  const [returnable, setReturnable] = useState<boolean>(toBoolean(initialData?.returnable));
  const resolvedSubmitIcon = submitIcon ?? <Printer className="w-5 h-5 mr-2" />;

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setItems(normalizeItems(initialData.items));
    setDestination(initialData.destination ?? "");
    setDestinationId(initialData.destinationId);
    setCarriedBy(initialData.carriedBy ?? "");
    setThrough(initialData.through ?? "");
    setMobileNo(initialData.mobileNo ?? "");
    setReturnable(toBoolean(initialData.returnable));
  }, [initialData]);

  useEffect(() => {
    const loadDestinations = async () => {
      setIsLoadingDestinations(true);
      setDestinationError(null);
      try {
        const data = await DestinationService.fetchDestinations();
        const activeDestinations = data.filter((item) =>
          toBoolean(item.isActive, false)
        );

        const selected =
          (destinationId !== undefined && destinationId !== null
            ? data.find((item) => item.id?.toString() === destinationId.toString())
            : undefined) ||
          (destination
            ? data.find(
                (item) =>
                  item.destinationCode?.toString().toLowerCase() ===
                  destination.toString().toLowerCase()
              )
            : undefined) ||
          (destination
            ? data.find(
                (item) =>
                  item.destinationName?.toString().toLowerCase() ===
                  destination.toString().toLowerCase()
              )
            : undefined);

        const allDestinations =
          selected && !activeDestinations.some((item) => item.id === selected.id)
            ? [...activeDestinations, selected]
            : activeDestinations;

        setDestinations(allDestinations);

        if (selected) {
          setDestination(selected.destinationCode);
          setDestinationId(selected.id);
        } else if (!destination && activeDestinations.length > 0) {
          setDestination(activeDestinations[0].destinationCode);
          setDestinationId(activeDestinations[0].id);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load destinations";
        setDestinationError(message);
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    void loadDestinations();
    // We intentionally run this only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = () => {
    if (items.length >= MAX_ITEMS) {
      return;
    }
    setItems([
      ...items,
      { slNo: items.length + 1, description: "", makeItem: "", model: "", serialNo: "", qty: 1 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        slNo: i + 1
      }));
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof GatePassItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedDestinationId =
      destinationId ??
      destinations.find((item) => item.destinationCode === destination)?.id;
    
    const gatepassData: GatePassData = {
      date: initialData?.date ?? new Date(),
      items,
      destination,
      destinationId: resolvedDestinationId,
      carriedBy,
      through,
      mobileNo,
      returnable,
      gatepassNo: initialData?.gatepassNo,
      id: initialData?.id,
      createdBy: initialData?.createdBy,
    };
    
    onSubmit(gatepassData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-primary/5 border-b border-border p-4">
        <CardTitle className="text-2xl font-bold text-center text-foreground">
          Gate Pass Entry Form
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-foreground">Items</Label>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                disabled={items.length >= MAX_ITEMS}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/30 font-semibold text-sm">
                <div className="col-span-1">SI No</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Make Item</div>
                <div className="col-span-2">Model/MT</div>
                <div className="col-span-2">SRL No</div>
                <div className="col-span-1 text-center">QTY</div>
                <div className="col-span-1"></div>
              </div>
              
              <div className="h-36 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t border-border items-center">
                  <div className="col-span-1">
                    <Input
                      value={item.slNo}
                      disabled
                      className="text-center bg-muted/20"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Item description"
                      maxLength={TEXT_FIELD_MAX_LENGTH}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.makeItem ?? ""}
                      onChange={(e) => updateItem(index, "makeItem", e.target.value)}
                      placeholder="Make / Item"
                      maxLength={TEXT_FIELD_MAX_LENGTH}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.model}
                      onChange={(e) => updateItem(index, "model", e.target.value)}
                      placeholder="Model"
                      maxLength={TEXT_FIELD_MAX_LENGTH}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={item.serialNo}
                      onChange={(e) => updateItem(index, "serialNo", e.target.value)}
                      placeholder="Serial number"
                      maxLength={TEXT_FIELD_MAX_LENGTH}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => updateItem(index, "qty", parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Other Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Select
                value={destination}
                onValueChange={(value) => {
                  setDestination(value);
                  const match = destinations.find(
                    (item) => item.destinationCode === value
                  );
                  setDestinationId(match?.id);
                }}
                required
                disabled={isLoadingDestinations || destinations.length === 0}
              >
                <SelectTrigger id="destination">
                  <SelectValue
                    placeholder={
                      isLoadingDestinations
                        ? "Loading destinations..."
                        : "Select destination"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDestinations && (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  )}
                  {!isLoadingDestinations && destinations.length === 0 && (
                    <SelectItem value="no-destination" disabled>
                      No active destinations
                    </SelectItem>
                  )}
                  {destinations.map((item) => (
                    <SelectItem
                      key={item.destinationCode}
                      value={item.destinationCode}
                    >
                      {item.destinationCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destinationError && (
                <p className="text-xs text-destructive">
                  {destinationError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carriedBy">Carried By</Label>
              <Input
                id="carriedBy"
                value={carriedBy}
                onChange={(e) => setCarriedBy(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="through">Through</Label>
              <Select value={through} onValueChange={setThrough} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {throughOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNo">Mobile No</Label>
              <Input
                id="mobileNo"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="returnable"
              checked={returnable}
              onCheckedChange={(checked) => setReturnable(Boolean(checked))}
            />
            <Label htmlFor="returnable" className="text-sm font-medium leading-none">
              Returnable Items
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" className="px-8" disabled={isLoading}>
              {resolvedSubmitIcon}
              {isLoading ? "Working..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
