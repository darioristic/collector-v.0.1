import { getApiUrl } from "@/src/lib/fetch-utils";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json"
} as const;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let message = "Unexpected error.";
    try {
      const body = (await response.json()) as { error?: string; message?: string; details?: unknown };
      if (body?.error) {
        message = body.error;
      } else if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
};

const buildQueryString = (params: Record<string, string | number | string[] | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  category: string | null;
  active: boolean;
  relatedSalesOrders: string[];
};

export type ProductListResponse = {
  data: Product[];
  meta: {
    total: number;
    limit?: number | null;
    offset?: number | null;
  };
};

export type ProductListFilters = {
  search?: string;
  status?: string | string[];
  categoryId?: string | string[];
  limit?: number;
  offset?: number;
};

export type ProductCreateInput = {
  name: string;
  sku: string;
  price: number;
  currency: string;
  category?: string | null;
  active?: boolean;
};

export type ProductUpdateInput = {
  name?: string;
  sku?: string;
  price?: number;
  currency?: string;
  category?: string | null;
  active?: boolean;
};

export type InventoryLocation = {
  locationId: string;
  name: string;
  address: string | null;
  quantity: number;
  reserved: number;
  updatedAt: string;
};

export type InventorySummary = {
  productId: string;
  onHand: number;
  reserved: number;
  available: number;
  locations: InventoryLocation[];
};

export async function fetchProducts(filters?: ProductListFilters): Promise<ProductListResponse> {
  const queryString = buildQueryString({
    search: filters?.search,
    status: filters?.status,
    categoryId: filters?.categoryId,
    limit: filters?.limit,
    offset: filters?.offset
  });

  const url = getApiUrl(`products${queryString ? `?${queryString}` : ""}`);
  const response = await fetch(url, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  return handleResponse<ProductListResponse>(response);
}

export async function getProductById(id: string): Promise<Product> {
  const url = getApiUrl(`products/${id}`);
  const response = await fetch(url, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  const payload = await handleResponse<{ data: Product }>(response);
  return payload.data;
}

export async function createProduct(values: ProductCreateInput): Promise<Product> {
  const url = getApiUrl("products");
  const response = await fetch(url, {
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const result = await handleResponse<{ data: Product }>(response);
  return result.data;
}

export async function updateProduct(id: string, values: ProductUpdateInput): Promise<Product> {
  const url = getApiUrl(`products/${id}`);
  const response = await fetch(url, {
    method: "PUT",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(values)
  });

  const result = await handleResponse<{ data: Product }>(response);
  return result.data;
}

export async function deleteProduct(id: string): Promise<void> {
  const url = getApiUrl(`products/${id}`);
  const response = await fetch(url, {
    method: "DELETE",
    headers: DEFAULT_HEADERS
  });

  if (!response.ok && response.status !== 204) {
    let message = "Unable to delete product.";
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      if (body?.error) {
        message = body.error;
      } else if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

export async function getProductInventory(productId: string): Promise<InventorySummary> {
  const url = getApiUrl(`products/${productId}/inventory`);
  const response = await fetch(url, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  const payload = await handleResponse<{ data: InventorySummary }>(response);
  return payload.data;
}

export async function listInventory(): Promise<InventorySummary[]> {
  const url = getApiUrl("products/inventory");
  const response = await fetch(url, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    cache: "no-store"
  });

  const payload = await handleResponse<{ data: InventorySummary[] }>(response);
  return payload.data;
}

