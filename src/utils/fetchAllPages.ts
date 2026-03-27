type NestedItemsEnvelope<T> = { items?: T[]; total?: number; pagination?: { total?: number } };
type PagedResponse<T> = {
  data?: T[] | NestedItemsEnvelope<T>;
  items?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  pagination?: { total?: number };
};

function isNestedItemsEnvelope<T>(value: PagedResponse<T>['data']): value is NestedItemsEnvelope<T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractItems<T>(res: PagedResponse<T>): T[] {
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;
  if (isNestedItemsEnvelope<T>(res.data) && Array.isArray(res.data.items)) return res.data.items;
  return [];
}

function extractTotal<T>(res: PagedResponse<T>, fallback: number): number {
  const nestedTotal = isNestedItemsEnvelope<T>(res.data)
    ? res.data.total ?? res.data.pagination?.total
    : undefined;
  return Number(
    res.total
      ?? res.pagination?.total
      ?? nestedTotal
      ?? fallback,
  );
}

export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PagedResponse<T>>,
  pageSize = 200,
  maxPages = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const res = await fetchPage(page, pageSize);
    const batch = extractItems(res);
    items.push(...batch);
    const total = extractTotal(res, items.length);
    if (batch.length === 0 || items.length >= total) break;
    page += 1;
  }

  if (page > maxPages) {
    throw new Error(`fetchAllPages exceeded maxPages=${maxPages}`);
  }

  return items;
}
