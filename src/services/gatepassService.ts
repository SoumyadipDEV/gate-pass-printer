import { GatePassData, GatePassWithMeta } from "@/types/gatepass";
import { generateGatePassNumber, getGatePassDateKey } from "@/utils/gatepassNumber";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URL}/api/gatepass`;

interface ApiPayload {
  id: string;
  gatepassNo: string;
  date: string;
  destination: string;
  carriedBy: string;
  through: string;
  mobileNo?: string;
  createdBy?: string;
  modifiedBy?: string | null;
  modifiedAt?: string | null;
  isEnable?: number;
  items: Array<{
    slNo: number;
    description: string;
    model: string;
    serialNo: string;
    qty: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  message: string;
  gatePassId: string;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

/**
 * Generate a unique ID using timestamp and random values
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Convert date to IST (Indian Standard Time - UTC+5:30) format
 */
function convertToIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // IST is UTC+5:30
  const istDate = new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000);
  return istDate.toISOString().replace('Z', '+05:30');
}

function formatApiDate(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  return convertToIST(date);
}

export class GatePassService {
  private static async fetchLastGatePassNoForDate(
    date: Date | string
  ): Promise<string | undefined> {
    const dateKey = getGatePassDateKey(date);
    const prefix = `SDLGP${dateKey}-`;

    const gatePasses = await this.fetchGatePasses();

    let maxSequence = 0;
    let lastGatePassNo: string | undefined;

    for (const gatePass of gatePasses) {
      const gatepassNo = gatePass.gatepassNo?.trim();
      if (!gatepassNo || !gatepassNo.startsWith(prefix)) {
        continue;
      }

      const rawSequence = gatepassNo.slice(prefix.length);
      const parsedSequence = Number.parseInt(rawSequence, 10);

      if (!Number.isFinite(parsedSequence)) {
        continue;
      }

      if (parsedSequence > maxSequence) {
        maxSequence = parsedSequence;
        lastGatePassNo = gatepassNo;
      }
    }

    return lastGatePassNo;
  }

  /**
   * Create a new gate pass in the database
   * @param data - Gate pass data from form
   * @param createdBy - Email of user creating the gate pass
   * @returns Promise with the created gate pass ID and gatepassNo
   * @throws Error if API call fails
   */
  static async createGatePass(
    data: GatePassData,
    createdBy: string
  ): Promise<{ id: string; gatepassNo: string }> {
    const id = generateId();

    let gatepassNo = "";
    try {
      const lastGatePassNo = await GatePassService.fetchLastGatePassNoForDate(
        data.date
      );
      gatepassNo = generateGatePassNumber(lastGatePassNo, data.date);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get last gate pass";
      throw new Error(`Failed to generate gate pass number: ${errorMessage}`);
    }
    
    // Format date to IST (Indian Standard Time)
    const dateString = convertToIST(data.date);

    // Prepare API payload
    const payload: ApiPayload = {
      id,
      gatepassNo,
      date: dateString,
      destination: data.destination,
      carriedBy: data.carriedBy,
      through: data.through,
      mobileNo: data.mobileNo,
      createdBy,
      isEnable: data.isEnable === undefined ? 1 : data.isEnable ? 1 : 0,
      items: data.items,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": createdBy,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse;

      if (!result.success) {
        throw new Error(result.message || "Failed to create gate pass");
      }

      return {
        id: result.gatePassId || id,
        gatepassNo,
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred";
      
      throw new Error(`Failed to create gate pass: ${errorMessage}`);
    }
  }

  /**
   * Rollback gate pass creation if needed
   * @param gatePassId - ID of the gate pass to delete
   * @returns Promise that resolves when rollback is complete
   */
  static async rollbackGatePass(gatePassId: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/${gatePassId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`Failed to rollback gate pass ${gatePassId}`);
      }
    } catch (error) {
      console.error("Rollback error:", error);
      // Silently fail rollback - log but don't throw to avoid masking original error
    }
  }

  /**
   * Fetch all gate passes
   * @returns Promise with array of gate passes
   */
  static async fetchGatePasses(): Promise<GatePassWithMeta[]> {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gate passes: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        return result.data.map((item: any) => ({
          gatepassNo: item.gatepassNo,
          date: item.date,
          items: item.items,
          destination: item.destination,
          carriedBy: item.carriedBy,
          through: item.through,
          mobileNo: item.mobileNo,
          id: item.id,
          createdBy: item.createdBy,
          createdAt: new Date(item.createdAt),
          modifiedBy: item.modifiedBy ?? null,
          modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : null,
          isEnable: (() => {
            const rawValue = item.isEnable;
            if (rawValue === undefined || rawValue === null) {
              return true;
            }
            if (typeof rawValue === "boolean") {
              return rawValue;
            }
            if (typeof rawValue === "number") {
              return rawValue !== 0;
            }
            if (typeof rawValue === "string") {
              return rawValue !== "0";
            }
            return Boolean(rawValue);
          })(),
          userName: item.userName,
        }));
      }

      throw new Error("Invalid API response format");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to load gate passes";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing gate pass
   * @param data - Updated gate pass data
   * @param updatedBy - Optional user name for audit header
   * @returns Promise that resolves when update is complete
   */
  static async updateGatePass(
    data: GatePassData & { id: string; gatepassNo: string },
    updatedBy?: string
  ): Promise<void> {
    const dateString = formatApiDate(data.date);
    const modifiedBy = updatedBy ?? data.modifiedBy ?? null;
    const modifiedAt = updatedBy ? new Date() : data.modifiedAt ?? null;
    const isEnable =
      data.isEnable === undefined ? undefined : data.isEnable ? 1 : 0;

    const payload: ApiPayload = {
      id: data.id,
      gatepassNo: data.gatepassNo,
      date: dateString,
      destination: data.destination,
      carriedBy: data.carriedBy,
      through: data.through,
      mobileNo: data.mobileNo,
      createdBy: data.createdBy,
      modifiedBy,
      modifiedAt: modifiedAt ? formatApiDate(modifiedAt) : null,
      ...(isEnable === undefined ? {} : { isEnable }),
      items: data.items,
    };

    try {
      const response = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(updatedBy ? { "x-user": updatedBy } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }

      const result = (await response.json()) as ApiResponse | ApiErrorResponse;

      if (!result.success) {
        throw new Error(result.message || "Failed to update gate pass");
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred";

      throw new Error(`Failed to update gate pass: ${errorMessage}`);
    }
  }
}
