import React, { useRef } from 'react';

interface ResizableTitleProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  onResizeEnd?: (finalWidth: number, allThWidths?: number[]) => void;
  width?: number;
}

function ResizableTitle({ onResizeEnd, width, ...restProps }: ResizableTitleProps) {
  const thRef = useRef<HTMLTableCellElement>(null);

  if (!onResizeEnd) {
    return <th {...restProps} />;
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const th = thRef.current;
    if (!th) {
      return;
    }

    const startX = event.clientX;
    const startWidth = th.offsetWidth;

    const table = th.closest('table');
    const tr = th.parentElement;
    if (!tr) {
      return;
    }
    const allThs = Array.from(tr.children) as HTMLElement[];
    const myIndex = allThs.indexOf(th);
    const allCols = Array.from(
      table?.querySelectorAll('colgroup > col') ?? [],
    ) as HTMLElement[];

    let activated = false;
    let origLayout = '';
    let origColWidths: string[] = [];
    let origMinWidth = '';
    let origTableStyleWidth = '';
    let snapshotTableW = 0;
    let snapshotThWidths: number[] = [];

    const blockClick = (nativeEvent: MouseEvent) => {
      nativeEvent.stopPropagation();
      nativeEvent.preventDefault();
    };
    th.addEventListener('click', blockClick, true);

    const activate = () => {
      origColWidths = allCols.map((col) => col.style.width);
      snapshotThWidths = allThs.map((item) => item.offsetWidth);
      allCols.forEach((col, index) => {
        if (snapshotThWidths[index]) {
          col.style.width = `${snapshotThWidths[index]}px`;
        }
      });
      origLayout = table?.style.tableLayout ?? '';
      if (table) {
        snapshotTableW = table.offsetWidth;
        origTableStyleWidth = table.style.width;
        table.style.width = `${snapshotTableW}px`;
        table.style.tableLayout = 'fixed';
        origMinWidth = table.style.minWidth;
        table.style.minWidth = '0';
      }
      activated = true;
    };

    const onMouseMove = (nativeEvent: MouseEvent) => {
      const delta = nativeEvent.clientX - startX;
      if (!activated && Math.abs(delta) < 3) {
        return;
      }
      if (!activated) {
        activate();
      }
      const nextWidth = Math.max(60, startWidth + delta);
      if (allCols[myIndex]) {
        allCols[myIndex].style.width = `${nextWidth}px`;
      }
      if (table) {
        table.style.width = `${snapshotTableW + (nextWidth - startWidth)}px`;
      }
    };

    const onMouseUp = (nativeEvent: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (activated) {
        const nextWidth = Math.max(60, startWidth + (nativeEvent.clientX - startX));
        onResizeEnd(nextWidth, snapshotThWidths);

        if (table) {
          table.style.tableLayout = origLayout;
          table.style.minWidth = origMinWidth;
          table.style.width = origTableStyleWidth;
        }
        allCols.forEach((col, index) => {
          if (index === myIndex) {
            col.style.width = `${nextWidth}px`;
          } else {
            col.style.width = origColWidths[index] ?? '';
          }
        });
      }
      setTimeout(() => th.removeEventListener('click', blockClick, true), 50);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <th {...restProps} ref={thRef}>
      {restProps.children}
      <span className="column-resize-handle" onMouseDown={handleMouseDown} />
    </th>
  );
}

export default ResizableTitle;
