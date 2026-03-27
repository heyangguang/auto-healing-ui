import type { LayoutItem, WidgetInstance } from '../dashboardStore';
import { WIDGET_REGISTRY } from '../widgets/widgetRegistry';

export const DASHBOARD_BREAKPOINT_COLS = { lg: 12, md: 10, sm: 6, xs: 4 } as const;

export function autoArrangeLayouts(widgets: WidgetInstance[], currentLayouts: LayoutItem[]): LayoutItem[] {
  const sorted = [...widgets].sort((left, right) => {
    const leftDef = WIDGET_REGISTRY[left.widgetId];
    const rightDef = WIDGET_REGISTRY[right.widgetId];
    const categoryOrder: Record<string, number> = { stat: 0, chart: 1, rank: 2, trend: 3, pie: 4, bar: 5, list: 6, status: 7 };
    return (categoryOrder[leftDef?.category ?? ''] ?? 99) - (categoryOrder[rightDef?.category ?? ''] ?? 99);
  });

  const columns = 12;
  const grid: boolean[][] = [];

  const canPlace = (x: number, y: number, w: number, h: number): boolean => {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(columns).fill(false);
      for (let col = x; col < x + w; col++) {
        if (col >= columns || grid[row][col]) return false;
      }
    }
    return true;
  };

  const placeItem = (x: number, y: number, w: number, h: number): void => {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(columns).fill(false);
      for (let col = x; col < x + w; col++) {
        grid[row][col] = true;
      }
    }
  };

  const nextLayouts: LayoutItem[] = [];
  for (const widget of sorted) {
    const definition = WIDGET_REGISTRY[widget.widgetId];
    const existingLayout = currentLayouts.find((layout) => layout.i === widget.instanceId);
    const w = existingLayout?.w ?? definition?.defaultLayout?.w ?? 3;
    const h = existingLayout?.h ?? definition?.defaultLayout?.h ?? 2;
    const minW = existingLayout?.minW ?? definition?.defaultLayout?.minW;
    const minH = existingLayout?.minH ?? definition?.defaultLayout?.minH;
    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x <= columns - w; x++) {
        if (canPlace(x, y, w, h)) {
          placeItem(x, y, w, h);
          nextLayouts.push({ i: widget.instanceId, x, y, w, h, minW, minH });
          placed = true;
          break;
        }
      }
      if (y > 100) break;
    }
  }
  return nextLayouts;
}

const generateLayoutForBreakpoint = (lgLayout: LayoutItem[], targetCols: number): LayoutItem[] => {
  if (targetCols >= 12) return lgLayout;
  const sorted = [...lgLayout].sort((left, right) => left.y - right.y || left.x - right.x);
  const grid: boolean[][] = [];
  const result: LayoutItem[] = [];

  const canPlace = (x: number, y: number, w: number, h: number): boolean => {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(targetCols).fill(false);
      for (let col = x; col < x + w; col++) {
        if (col >= targetCols || grid[row][col]) return false;
      }
    }
    return true;
  };

  const placeItem = (x: number, y: number, w: number, h: number): void => {
    for (let row = y; row < y + h; row++) {
      if (!grid[row]) grid[row] = new Array(targetCols).fill(false);
      for (let col = x; col < x + w; col++) {
        grid[row][col] = true;
      }
    }
  };

  for (const item of sorted) {
    const minW = item.minW ?? 2;
    let width = Math.max(minW, Math.round((item.w * targetCols) / 12));
    if (width > targetCols) width = targetCols;
    let placed = false;
    for (let y = 0; !placed && y < 200; y++) {
      for (let x = 0; x <= targetCols - width; x++) {
        if (canPlace(x, y, width, item.h)) {
          placeItem(x, y, width, item.h);
          result.push({ ...item, x, y, w: width });
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      const fallbackY = grid.length;
      const fallbackW = Math.min(width, targetCols);
      placeItem(0, fallbackY, fallbackW, item.h);
      result.push({ ...item, x: 0, y: fallbackY, w: fallbackW });
    }
  }
  return result;
};

export function generateAllBreakpointLayouts(lgLayout: LayoutItem[]): Record<string, LayoutItem[]> {
  return {
    lg: lgLayout,
    md: generateLayoutForBreakpoint(lgLayout, DASHBOARD_BREAKPOINT_COLS.md),
    sm: generateLayoutForBreakpoint(lgLayout, DASHBOARD_BREAKPOINT_COLS.sm),
    xs: generateLayoutForBreakpoint(lgLayout, DASHBOARD_BREAKPOINT_COLS.xs),
  };
}

export function layoutsAreEqual(left: readonly LayoutItem[], right: readonly LayoutItem[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort((a, b) => a.i.localeCompare(b.i));
  const sortedRight = [...right].sort((a, b) => a.i.localeCompare(b.i));
  for (let index = 0; index < sortedLeft.length; index++) {
    const leftItem = sortedLeft[index];
    const rightItem = sortedRight[index];
    if (
      leftItem.i !== rightItem.i ||
      leftItem.x !== rightItem.x ||
      leftItem.y !== rightItem.y ||
      leftItem.w !== rightItem.w ||
      leftItem.h !== rightItem.h
    ) {
      return false;
    }
  }
  return true;
}
