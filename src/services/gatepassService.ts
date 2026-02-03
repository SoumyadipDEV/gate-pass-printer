import { GatePassData, GatePassWithMeta } from "@/types/gatepass";
import { generateGatePassNumber } from "@/utils/gatepassNumber";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URL}/api/gatepass`;

interface ApiPayload {
  id: string;
  gatepassNo: string;
  date: string;
  destination: string;
  carriedBy: string;
  through: string;
  createdBy: string;
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

export class GatePassService {
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
    const gatepassNo = generateGatePassNumber();
    
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
      createdBy,
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
          date: new Date(item.date),
          items: item.items,
          destination: item.destination,
          carriedBy: item.carriedBy,
          through: item.through,
          id: item.id,
          createdBy: item.createdBy,
          createdAt: new Date(item.createdAt),
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
}
