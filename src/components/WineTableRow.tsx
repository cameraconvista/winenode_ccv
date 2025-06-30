
import React from 'react';

interface WineRow {
  id: string;
  nomeVino: string;
  anno: string;
  produttore: string;
  provenienza: string;
  giacenza: number;
  fornitore: string;
  tipologia?: string;
}

interface WineTableRowProps {
  row: WineRow;
  index: number;
  isSelected: boolean;
  columnWidths: Record<string, string>;
  fontSize: number;
  onRowClick: (index: number, event: React.MouseEvent) => void;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
}

export default function WineTableRow({
  row,
  index,
  isSelected,
  columnWidths,
  fontSize,
  onRowClick,
  onCellChange
}: WineTableRowProps) {
  const bgColor = isSelected ? "#E6D7B8" : "#F5F0E6";
  const borderW = isSelected ? "2px" : "1px";
  const borderC = isSelected ? "#D97706" : "#92400e";

  const getFontSizeStyle = () => {
    const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480;
    const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
    return { fontSize: `${adjustedSize}px` };
  };

  return (
    <tr
      key={row.id}
      onClick={(e) => onRowClick(index, e)}
      className="cursor-pointer transition-all duration-200 hover:bg-opacity-80"
      style={{ backgroundColor: bgColor, borderWidth: borderW, borderColor: borderC }}
    >
      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["#"] }}
      >
        <div
          className="w-full px-2 py-2 text-center text-gray-600 font-medium select-none flex items-center justify-center"
          style={{ fontSize: fontSize * 0.7, userSelect: "none", height: 40 }}
        >
          {index + 1}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["nomeVino"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.nomeVino}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["anno"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.anno}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["produttore"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.produttore}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["provenienza"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.provenienza}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["fornitore"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.fornitore}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0 group"
        style={{ backgroundColor: bgColor, width: columnWidths["giacenza"] }}
      >
        <div className="relative flex items-center justify-center h-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCellChange(index, "giacenza", Math.max(0, row.giacenza - 1).toString());
            }}
            className="absolute left-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm"
            style={{ fontSize: 10 }}
            title="Diminuisci giacenza"
          >
            -
          </button>

          <input
            type="number"
            value={row.giacenza}
            onChange={(e) => onCellChange(index, "giacenza", e.target.value)}
            className="w-full px-1 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none font-bold"
            style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
            min="0"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCellChange(index, "giacenza", (Number(row.giacenza) + 1).toString());
            }}
            className="absolute right-1 w-4 h-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm"
            style={{ fontSize: 10 }}
            title="Aumenta giacenza"
          >
            +
          </button>
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["azioni"] }}
      >
        <div className="flex items-center justify-center gap-2 h-full" style={{ height: 40 }}>
          {/* Azioni vuote */}
        </div>
      </td>
    </tr>
  );
}
