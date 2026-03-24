type PagedResponse<T> =
  | { data?: T[]; total?: number; page?: number; page_size?: number; pagination?: { total?: number } }
  | { items?: T[]; total?: number; pagination?: { total?: number } }
  | { data?: { items?: T[]; total?: number; pagination?: { total?: number } } };

function extractItems<T>(res: PagedResponse<T>): T[] {
  if (Array.isArray((res as any)?.data)) return (res as any).data;
  if (Array.isArray((res as any)?.items)) return (res as any).items;
  if (Array.isArray((res as any)?.data?.items)) return (res as any).data.items;
  return [];
}

function extractTotal<T>(res: PagedResponse<T>, fallback: number): number {
  return Number(
    (res as any)?.total
      ?? (res as any)?.pagination?.total
      ?? (res as any)?.data?.total
      ?? (res as any)?.data?.pagination?.total
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

  return items;
}
