export interface Destination {
  id: string | number;
  destinationName: string;
  destinationCode: string;
  emailID?: string | null;
  isActive?: number | boolean | null;
}

interface DestinationCacheRecord {
  userKey: string;
  destinations: Destination[];
  updatedAt: number;
}

interface FetchDestinationOptions {
  userKey?: string | null;
  forceRefresh?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE_URL}/api/dest`;
const DESTINATION_CACHE_NAMESPACE = "gate-pass-printer:destinations:v1";
const DESTINATION_CACHE_FALLBACK_USER_KEY = "__destination_cache__";

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

const normalizeUserKey = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const getStoredUserKey = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const fromEmail = normalizeUserKey(localStorage.getItem("email"));
  if (fromEmail) {
    return fromEmail;
  }

  const rawUser = localStorage.getItem("user");
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as { email?: string };
    return normalizeUserKey(parsed?.email ?? null);
  } catch {
    return null;
  }
};

const normalizeDestinationCode = (value?: string | null): string =>
  value?.toString().trim().toLowerCase() ?? "";

const getDestinationCacheStorageKey = (userKey: string): string =>
  `${DESTINATION_CACHE_NAMESPACE}:${userKey}`;

export class DestinationService {
  private static inflightFetches = new Map<string, Promise<Destination[]>>();

  private static resolveUserKey(
    userKey?: string | null,
    allowFallback = true
  ): string | null {
    const resolved = normalizeUserKey(userKey) ?? getStoredUserKey();
    if (resolved) {
      return resolved;
    }

    return allowFallback ? DESTINATION_CACHE_FALLBACK_USER_KEY : null;
  }

  private static async fetchDestinationsFromApi(): Promise<Destination[]> {
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

  private static async readCachedDestinations(
    userKey: string
  ): Promise<Destination[] | null> {
    if (typeof window === "undefined") {
      return null;
    }

    const storageKey = getDestinationCacheStorageKey(userKey);
    try {
      const rawRecord = window.localStorage.getItem(storageKey);
      if (!rawRecord) {
        return null;
      }

      const record = JSON.parse(rawRecord) as DestinationCacheRecord;
      if (!record || !Array.isArray(record.destinations)) {
        return null;
      }

      return record.destinations.map(normalizeDestination);
    } catch {
      return null;
    }
  }

  private static async writeCachedDestinations(
    userKey: string,
    destinations: Destination[]
  ): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getDestinationCacheStorageKey(userKey);
    const payload: DestinationCacheRecord = {
      userKey,
      destinations: destinations.map(normalizeDestination),
      updatedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota / privacy mode issues and keep API path functional.
    }
  }

  private static async deleteCachedDestinations(userKey: string): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = getDestinationCacheStorageKey(userKey);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage API errors.
    }
  }

  private static async upsertCachedDestination(
    userKey: string,
    destination: Destination
  ): Promise<void> {
    const cachedDestinations = await this.readCachedDestinations(userKey);
    if (cachedDestinations === null) {
      return;
    }

    const normalizedDestination = normalizeDestination(destination, 0);
    const normalizedDestinationId =
      normalizedDestination.id?.toString().trim() ?? "";
    const normalizedDestinationCode = normalizeDestinationCode(
      normalizedDestination.destinationCode
    );

    const existingIndex = cachedDestinations.findIndex((item) => {
      const normalizedItemId = item.id?.toString().trim() ?? "";
      if (
        normalizedDestinationId &&
        normalizedItemId &&
        normalizedDestinationId === normalizedItemId
      ) {
        return true;
      }

      return (
        normalizeDestinationCode(item.destinationCode) ===
        normalizedDestinationCode
      );
    });

    if (existingIndex >= 0) {
      cachedDestinations[existingIndex] = {
        ...cachedDestinations[existingIndex],
        ...normalizedDestination,
      };
    } else {
      cachedDestinations.push(normalizedDestination);
    }

    await this.writeCachedDestinations(userKey, cachedDestinations);
  }

  static async fetchDestinations(
    options: FetchDestinationOptions = {}
  ): Promise<Destination[]> {
    const resolvedUserKey = this.resolveUserKey(options.userKey);

    if (!options.forceRefresh && resolvedUserKey) {
      const cachedDestinations = await this.readCachedDestinations(
        resolvedUserKey
      );
      if (cachedDestinations !== null) {
        return cachedDestinations;
      }
    }

    const requestKey = `${resolvedUserKey ?? "anonymous"}:${
      options.forceRefresh ? "refresh" : "default"
    }`;
    const existingRequest = this.inflightFetches.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    const fetchRequest = (async () => {
      const destinations = await this.fetchDestinationsFromApi();
      if (resolvedUserKey) {
        await this.writeCachedDestinations(resolvedUserKey, destinations);
      }
      return destinations;
    })().finally(() => {
      this.inflightFetches.delete(requestKey);
    });

    this.inflightFetches.set(requestKey, fetchRequest);
    return fetchRequest;
  }

  static async warmDestinationCache(userKey?: string | null): Promise<void> {
    const resolvedUserKey = this.resolveUserKey(userKey);
    if (!resolvedUserKey) {
      return;
    }

    const cachedDestinations = await this.readCachedDestinations(resolvedUserKey);
    if (cachedDestinations !== null) {
      return;
    }

    await this.fetchDestinations({ userKey: resolvedUserKey });
  }

  static async clearDestinationCache(userKey?: string | null): Promise<void> {
    const keysToClear = new Set<string>();
    const explicitUserKey = normalizeUserKey(userKey);
    const storedUserKey = getStoredUserKey();

    if (explicitUserKey) {
      keysToClear.add(explicitUserKey);
    }
    if (storedUserKey) {
      keysToClear.add(storedUserKey);
    }
    keysToClear.add(DESTINATION_CACHE_FALLBACK_USER_KEY);

    for (const cacheUserKey of keysToClear) {
      for (const requestKey of this.inflightFetches.keys()) {
        if (requestKey.startsWith(`${cacheUserKey}:`)) {
          this.inflightFetches.delete(requestKey);
        }
      }

      await this.deleteCachedDestinations(cacheUserKey);
    }
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

    const id =
      data?.id ??
      data?.Id ??
      data?.insertedId ??
      data?.recordset?.[0]?.Id ??
      null;

    const resolvedUserKey = this.resolveUserKey();
    if (resolvedUserKey) {
      await this.upsertCachedDestination(resolvedUserKey, {
        id: id ?? payload.destinationCode,
        destinationName: payload.destinationName,
        destinationCode: payload.destinationCode,
        emailID: payload.emailID,
        isActive: payload.isActive,
      }).catch(() => undefined);
    }

    return {
      success: true,
      message: data?.message,
      id,
    };
  }
}
