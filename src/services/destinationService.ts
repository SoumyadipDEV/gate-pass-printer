export interface Destination {
  id: string | number;
  destinationName: string;
  destinationCode: string;
  emailID?: string | null;
  isActive?: number | boolean | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URL}/api/dest`;

const coerceBoolean = (value: unknown, defaultValue = false): boolean => {
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

const normalizeDestination = (item: any, index: number): Destination => ({
  id: item?.Id ?? item?.id ?? index,
  destinationName: item?.DestinationName ?? item?.destinationName ?? "",
  destinationCode: item?.DestinationCode ?? item?.destinationCode ?? "",
  emailID: item?.EmailID ?? item?.emailID ?? null,
  isActive: item?.IsActive ?? item?.isActive ?? null,
});

export class DestinationService {
  static async fetchDestinations(): Promise<Destination[]> {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      const message = data?.message || "Failed to fetch destinations";
      throw new Error(message);
    }

    const list =
      (Array.isArray(data?.data) ? data.data : null) ??
      (Array.isArray(data?.recordset) ? data.recordset : null) ??
      [];

    return list.map(normalizeDestination);
  }

  static async createDestination(input: {
    destinationName: string;
    destinationCode: string;
    emailID?: string;
    isActive?: boolean | number;
  }): Promise<{ success: boolean; message?: string; id?: string | number }> {
    const payload = {
      destinationName: input.destinationName.trim(),
      destinationCode: input.destinationCode.trim(),
      emailID: input.emailID?.trim() || null,
      isActive: coerceBoolean(
        input.isActive === undefined ? true : input.isActive,
        true
      )
        ? 1
        : 0,
    };

    const response = await fetch(`${API_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      const message = data?.message || "Failed to create destination";
      throw new Error(message);
    }

    return {
      success: true,
      message: data?.message,
      id:
        data?.id ??
        data?.Id ??
        data?.insertedId ??
        data?.recordset?.[0]?.Id ??
        null,
    };
  }
}
