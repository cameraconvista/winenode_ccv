
import { useState, useEffect } from 'react';

const defaultColumnWidths = {
  "#": "3%",
  nomeVino: "30%",
  anno: "8%",
  produttore: "25%",
  provenienza: "20%",
  fornitore: "18%",
  giacenza: "6%",
  azioni: "6%",
};

const loadSavedColumnWidths = () => {
  try {
    const saved = localStorage.getItem("winenode-column-widths");
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasAllCols = Object.keys(defaultColumnWidths).every((key) =>
        parsed.hasOwnProperty(key),
      );
      if (hasAllCols) return parsed;
    }
  } catch {
    // ignore error
  }
  return defaultColumnWidths;
};

export function useColumnResize() {
  const [columnWidths, setColumnWidths] = useState(loadSavedColumnWidths);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(colKey);
    setStartX(e.clientX);
    setStartWidth(parseInt(columnWidths[colKey as keyof typeof columnWidths]));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(30, startWidth + deltaX);
    const updatedWidths = { ...columnWidths, [resizingColumn]: `${newWidth}px` };
    setColumnWidths(updatedWidths);

    try {
      localStorage.setItem("winenode-column-widths", JSON.stringify(updatedWidths));
    } catch {
      // ignore error
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingColumn(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, resizingColumn, startX, startWidth]);

  return {
    columnWidths,
    isResizing,
    handleMouseDown,
  };
}
