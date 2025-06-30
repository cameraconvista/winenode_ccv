
import React from 'react';

interface WineTableHeaderProps {
  columnWidths: Record<string, string>;
  fontSize: number;
  lineHeight: number;
  rowHeight: number;
  onMouseDown: (e: React.MouseEvent, colKey: string) => void;
}

export default function WineTableHeader({ 
  columnWidths, 
  fontSize, 
  lineHeight, 
  rowHeight, 
  onMouseDown 
}: WineTableHeaderProps) {
  return (
    <thead
      className="sticky top-0 z-30 shadow-lg"
      style={{ backgroundColor: "#3b1d1d" }}
    >
      <tr
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeight}px`,
          height: `${rowHeight}px`,
        }}
      >
        <th
          className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["#"] }}
        ></th>
        
        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["nomeVino"] }}
        >
          Nome Vino
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "nomeVino")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["anno"] }}
        >
          Anno
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "anno")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["produttore"] }}
        >
          Produttore
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "produttore")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["provenienza"] }}
        >
          Provenienza
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "provenienza")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["fornitore"] }}
        >
          Fornitore
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "fornitore")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
          style={{ width: columnWidths["giacenza"] }}
        >
          GIACENZA
          <div
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onMouseDown={(e) => onMouseDown(e, "giacenza")}
            title="Ridimensiona colonna"
          >
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-amber-600"></div>
              <div className="w-0.5 h-4 bg-amber-600"></div>
            </div>
          </div>
        </th>

        <th
          className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["azioni"] }}
        />
      </tr>
    </thead>
  );
}
