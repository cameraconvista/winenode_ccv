import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWines } from "../hooks/useWines";
import { useTipologie } from "../hooks/useTipologie";
import Papa from "papaparse";
import { supabase, authManager } from "../lib/supabase";
import ImportaVini from "../components/ImportaVini";

interface Tipologia {
  id: string;
  nome: string;
  colore?: string;
}

interface WineRow {
  id: string;
  nomeVino: string;
  anno: string;
  produttore: string;
  provenienza: string;
  giacenza: number;
  fornitore: string;
}

export default function ArchiviPage() {
  const navigate = useNavigate();
  const { wines: existingWines, types, refreshWines } = useWines();
  const {
    tipologie,
    loading,
    addTipologia: addTipologiaToDb,
    removeTipologia: removeTipologiaFromDb,
    updateTipologia: updateTipologiaInDb,
  } = useTipologie();

  const [wineRows, setWineRows] = useState<WineRow[]>(() =>
    Array.from({ length: 100 }, (_, index) => ({
      id: `row-${index}`,
      nomeVino: "",
      anno: "",
      produttore: "",
      provenienza: "",
      giacenza: 0,
      fornitore: "",
    })),
  );

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showAddRowsPanel, setShowAddRowsPanel] = useState(false);

  // Modal states
  const [showTipologieModal, setShowTipologieModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Tipologia[]>([]);
  const [editingProducer, setEditingProducer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("BOLLICINE ITALIANE");
  const [selectedColor, setSelectedColor] = useState("#cccccc");
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [fontSize, setFontSize] = useState<number>(() => {
    const isTabletLandscape =
      window.innerWidth <= 1024 &&
      window.innerWidth > 480 &&
      window.innerHeight < window.innerWidth;
    return isTabletLandscape ? 12 : 14;
  });

  const defaultColors = {
    BIANCO: "#cccccc",
    "BOLLICINE ESTERE": "#f4e04d",
    "BOLLICINE FRANCESI": "#f4e04d",
    "BOLLICINE ITALIANE": "#f4e04d",
    CHAMPAGNE: "#f4e04d",
    FORTIFICATI: "#8b5e3c",
    NATURALI: "#a2d4c2",
    "NATURALI FRIZZANTI": "#a2d4c2",
    "RAMATI ORANGE": "#e78b43",
    ROSSO: "#aa1c1c",
  };

  const availableColors = [
    { color: "#cccccc", name: "Grigio chiaro" },
    { color: "#d4b000", name: "Giallo scuro" },
    { color: "#7b4a15", name: "Marrone scuro" },
    { color: "#3ca65c", name: "Verde classico" },
    { color: "#f08c00", name: "Arancione" },
    { color: "#8c1c1c", name: "Bordeaux" },
    { color: "#3b78c2", name: "Blu" },
    { color: "#000000", name: "Nero" },
  ];

  const csvUrls = {
    "BOLLICINE ITALIANE":
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv",
    "BOLLICINE FRANCESI":
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv",
    BIANCHI:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv",
    ROSSI:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv",
    ROSATI:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv",
    "VINI DOLCI":
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv",
  };

  // Colonne e larghezze per la tabella
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

  const [columnWidths, setColumnWidths] = useState(loadSavedColumnWidths);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [filters, setFilters] = useState({
    tipologia: '',
    search: '',
    fornitore: ''
  });

  // Resize colonne handlers
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

  useEffect(() => {
    return () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    };
  }, [autoSaveTimeout]);

  useEffect(() => {
    const handleResize = () => {
      const isTabletLandscape =
        window.innerWidth <= 1024 &&
        window.innerWidth > 480 &&
        window.innerHeight < window.innerWidth;
      const newFontSize = isTabletLandscape ? 12 : 14;
      if (fontSize !== newFontSize) setFontSize(newFontSize);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fontSize]);

  const getFontSizeStyle = () => {
    const isTabletLandscape =
      window.innerWidth <= 1024 && window.innerWidth > 480;
    const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
    return { fontSize: `${adjustedSize}px` };
  };

  // Fetch & parse CSV from Google Sheets
  const fetchAndParseCSV = async (url: string, categoria: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const csvText = await response.text();

      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });

      let headerRow = -1;
      let startRow = 0;

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        if (row && row.length > 0) {
          const firstCell = row[0]?.trim().toUpperCase() || "";

          if (
            [
              "BIANCHI",
              "BOLLICINE",
              "BOLLICINE ITALIANE",
              "BOLLICINE FRANCESI",
              "ROSSI",
              "ROSATI",
              "VINI DOLCI",
            ].includes(firstCell) ||
            firstCell.includes("BOLLICINE")
          ) continue;

          const rowText = row.join("").toLowerCase();

          if (
            rowText.includes("nome vino") ||
            rowText.includes("produttore") ||
            rowText.includes("provenienza") ||
            rowText.includes("fornitore") ||
            rowText.includes("costo") ||
            rowText.includes("vendita") ||
            rowText.includes("margine") ||
            rowText.includes("giacenza") ||
            firstCell === "NOME VINO" ||
            firstCell === "ANNO" ||
            firstCell === "PRODUTTORE"
          ) {
            headerRow = i;
            startRow = i + 1;
            continue;
          }

          if (
            row[0] &&
            row[0].trim() &&
            row[0].length > 3 &&
            !firstCell.includes("VINI") &&
            !firstCell.includes("BOLLICINE") &&
            !firstCell.includes("BIANCHI") &&
            !firstCell.includes("ROSSI") &&
            !firstCell.includes("ROSATI")
          ) {
            startRow = i;
            break;
          }
        }
      }

      const dataRows = parsed.data.slice(startRow);

      const winesFromCsv: WineRow[] = dataRows
        .filter((row) => row && row[0] && row[0].trim())
        .map((row, index) => ({
          id: `csv-${categoria}-${index}`,
          nomeVino: row[0]?.trim() || "",
          anno: row[1]?.trim() || "",
          produttore: row[2]?.trim() || "",
          provenienza: row[3]?.trim() || "",
          fornitore: row[4]?.trim() || "",
          giacenza: 0,
        }));

      const emptyRows = Array.from(
        { length: Math.max(0, 100 - winesFromCsv.length) },
        (_, idx) => ({
          id: `empty-${winesFromCsv.length + idx}`,
          nomeVino: "",
          anno: "",
          produttore: "",
          provenienza: "",
          giacenza: 0,
          fornitore: "",
        }),
      );

      setWineRows([...winesFromCsv, ...emptyRows]);
    } catch (error) {
      alert(`Errore nel caricamento dati per ${categoria}: ${error}`);
    }
  };

  // Sync wines from DB or CSV on mount or activeTab change
  useEffect(() => {
    if (existingWines && existingWines.length > 0) {
      const winesFromDb = existingWines.map((wine) => ({
        id: `db-${wine.id}`,
        nomeVino: wine.name || "",
        anno: wine.vintage || "",
        produttore: wine.description || "",
        provenienza: wine.region || "",
        giacenza: wine.inventory || 0,
        fornitore: wine.supplier || "",
      }));

      const emptyRows = Array.from(
        { length: Math.max(0, 100 - winesFromDb.length) },
        (_, idx) => ({
          id: `row-${winesFromDb.length + idx}`,
          nomeVino: "",
          anno: "",
          produttore: "",
          provenienza: "",
          giacenza: 0,
          fornitore: "",
        }),
      );

      setWineRows([...winesFromDb, ...emptyRows]);
    } else if (csvUrls[activeTab as keyof typeof csvUrls]) {
      fetchAndParseCSV(csvUrls[activeTab as keyof typeof csvUrls], activeTab);
    }
  }, [existingWines, activeTab]);

  // Handlers and utilities

  const handleAddTipologia = async () => {
    if (!newItemName.trim()) return;
    const tipologiaName = newItemName.trim().toUpperCase();
    const defaultColor = defaultColors[tipologiaName] || selectedColor;

    const success = await addTipologiaToDb(tipologiaName, defaultColor);
    if (success) {
      setNewItemName("");
      setSelectedColor("#cccccc");
    } else {
      alert("Errore nell'aggiunta della tipologia o tipologia già esistente");
    }
  };

  const handleRemoveTipologia = async (tipologia: Tipologia) => {
    const success = await removeTipologiaFromDb(tipologia.id);
    if (!success) alert("Errore nella rimozione della tipologia");
  };

  const searchTipologie = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setEditValue("");
      return;
    }
    const results = tipologie.filter((t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSearchResults(results);
    if (results.length > 0) setEditValue(results[0].nome);
  };

  const handleEditTipologia = async (tipologia: Tipologia, newName: string) => {
    if (!newName.trim()) return;
    if (newName === tipologia.nome && selectedColor === tipologia.colore) return;

    const success = await updateTipologiaInDb(
      tipologia.id,
      newName.trim().toUpperCase(),
      selectedColor,
    );

    if (success) {
      setShowTipologieModal(false);
      setNewItemName("");
      setSearchTerm("");
      setSearchResults([]);
      setEditingProducer(null);
      setEditValue("");
      setSelectedColor("#cccccc");
    } else {
      alert("Errore nella modifica della tipologia o nome già esistente");
    }
  };

  const handleRowClick = (index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedRows((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index],
      );
    } else if (event.shiftKey && selectedRows.length > 0) {
      const lastSelected = selectedRows[selectedRows.length - 1];
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      setSelectedRows(Array.from({ length: end - start + 1 }, (_, i) => start + i));
    } else {
      setSelectedRows([index]);
    }
  };

  const [saveTimeouts, setSaveTimeouts] = useState(new Map<number, NodeJS.Timeout>());

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const updatedRows = [...wineRows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };
    setWineRows(updatedRows);

    const currentTimeout = saveTimeouts.get(rowIndex);
    if (currentTimeout) clearTimeout(currentTimeout);

    const newTimeout = setTimeout(async () => {
      const rowData = updatedRows[rowIndex];
      if (rowData.nomeVino?.trim()) {
        try {
          await saveRowToDatabase(rowData, rowIndex);
        } catch (e) {
          console.error(`Errore salvataggio riga ${rowIndex + 1}:`, e);
        }
      }
    }, 1000);

    setSaveTimeouts(new Map(saveTimeouts.set(rowIndex, newTimeout)));
  };

  const addNewRow = () => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      nomeVino: "",
      anno: "",
      produttore: "",
      provenienza: "",
      giacenza: 0,
      fornitore: "",
    };
    setWineRows((prev) => [...prev, newRow]);
  };

  const addRows = (count: number) => {
    const newRows: WineRow[] = Array.from({ length: count }, (_, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      nomeVino: "",
      anno: "",
      produttore: "",
      provenienza: "",
      giacenza: 0,
      fornitore: "",
    }));
    setWineRows((prev) => [...prev, ...newRows]);
    setShowAddRowsPanel(false);
  };

  const removeEmptyRows = () => {
    const filledRows = wineRows.filter(
      (row) =>
        row.nomeVino.trim() !== "" ||
        row.anno.trim() !== "" ||
        row.produttore.trim() !== "" ||
        row.provenienza.trim() !== "" ||
        row.fornitore.trim() !== "" ||
        row.giacenza > 0,
    );
    setWineRows(filledRows);
    setSelectedRows([]);
    setShowAddRowsPanel(false);

    const removedCount = wineRows.length - filledRows.length;
    alert(removedCount > 0 ? `${removedCount} righe vuote eliminate` : "Nessuna riga vuota trovata");
  };

  const saveRowToDatabase = async (rowData: WineRow, rowIndex: number) => {
    try {
      if (!authManager.isAuthenticated() || !supabase)
        throw new Error("Utente non autenticato o Supabase non disponibile");

      const userId = authManager.getUserId();
      if (!userId) throw new Error("ID utente non disponibile");

      if (!rowData.nomeVino?.trim()) return;

      const wineToSave = {
        user_id: userId,
        nome_vino: rowData.nomeVino.trim(),
        anno: rowData.anno || "",
        produttore: rowData.produttore || "",
        provenienza: rowData.provenienza || "",
        fornitore: rowData.fornitore || "",
        giacenza: rowData.giacenza || 0,
        updated_at: new Date().toISOString(),
      };

      if (rowData.id && rowData.id.startsWith("db-")) {
        const dbId = rowData.id.replace("db-", "");
        const { error } = await supabase
          .from("vini")
          .update(wineToSave)
          .eq("id", dbId)
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("vini")
          .insert(wineToSave)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const updatedRows = [...wineRows];
          updatedRows[rowIndex].id = `db-${data.id}`;
          setWineRows(updatedRows);
        }
      }

      await refreshWines();
    } catch (error) {
      console.error(`Errore nel salvataggio riga ${rowIndex + 1}:`, error);
      throw error;
    }
  };

  const handleDeleteRow = async (index: number) => {
    const isRowSelected = selectedRows.includes(index);
    const multipleSelected = selectedRows.length > 1;

    if (isRowSelected && multipleSelected) {
      const rowNumbers = [...selectedRows].sort((a, b) => a - b).map((i) => i + 1);
      if (!window.confirm(`Confermi l'eliminazione delle righe ${rowNumbers.join(", ")}?`))
        return;

      try {
        const userId = authManager.getUserId();
        if (!userId) throw new Error("ID utente non disponibile");

        const rowsToDelete = selectedRows
          .map((i) => wineRows[i])
          .filter((row) => row.id.startsWith("db-"));

        for (const row of rowsToDelete) {
          const dbId = row.id.replace("db-", "");
          const { error } = await supabase
            .from("vini")
            .delete()
            .eq("id", dbId)
            .eq("user_id", userId);
          if (error) throw error;
        }

        selectedRows.forEach((rowIndex) => {
          const timeout = saveTimeouts.get(rowIndex);
          if (timeout) clearTimeout(timeout);
          setSaveTimeouts((prev) => {
            const newMap = new Map(prev);
            newMap.delete(rowIndex);
            return newMap;
          });
        });

        setWineRows((prev) => prev.filter((_, i) => !selectedRows.includes(i)));
        setSelectedRows([]);
        await refreshWines();
      } catch (error) {
        alert("Errore nell'eliminazione dei vini dal database");
      }
    } else {
      if (!window.confirm(`Confermi l'eliminazione della riga ${index + 1}?`)) return;

      try {
        const rowToDelete = wineRows[index];
        if (rowToDelete.id.startsWith("db-")) {
          const userId = authManager.getUserId();
          if (!userId) throw new Error("ID utente non disponibile");
          const dbId = rowToDelete.id.replace("db-", "");
          const { error } = await supabase
            .from("vini")
            .delete()
            .eq("id", dbId)
            .eq("user_id", userId);
          if (error) throw error;
        }

        const timeout = saveTimeouts.get(index);
        if (timeout) clearTimeout(timeout);
        setSaveTimeouts((prev) => {
          const newMap = new Map(prev);
          newMap.delete(index);
          return newMap;
        });

        setWineRows((prev) => prev.filter((_, i) => i !== index));
        setSelectedRows((prev) =>
          prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
        );
        await refreshWines();
      } catch (error) {
        alert("Errore nell'eliminazione del vino dal database");
      }
    }
  };

  const getTypeData = (typeName: string) => types.find((t) => t.nome === typeName);

  const getTipologiaColore = (tipologiaNome: string) => {
    const typeData = getTypeData(tipologiaNome);
    if (typeData?.colore) return typeData.colore;
    const selectedTipologia = tipologie.find((tip) => tip.nome === tipologiaNome);
    return selectedTipologia?.colore || "#cccccc";
  };

  const lineHeight = fontSize * 1.2;
  const rowHeight = fontSize * 2.5;

  const filteredRows = useMemo(() => {
    return wineRows.filter(row => {
      const matchesTipologia = !filters.tipologia || row.tipologia === filters.tipologia
      const matchesSearch = !filters.search || 
        row.nomeVino?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.produttore?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.provenienza?.toLowerCase().includes(filters.search.toLowerCase())
      const matchesFornitore = !filters.fornitore || 
        row.fornitore?.toLowerCase().includes(filters.fornitore.toLowerCase())

      return matchesTipologia && matchesSearch && matchesFornitore
    })
  }, [wineRows, filters])

  return (
    <div
      className="h-[95vh] flex flex-col"
      style={{ background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)" }}
    >
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/settings")}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna alle impostazioni"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <img src="/logo 2 CCV.png" alt="WINENODE" className="h-24 w-auto object-contain" />

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Vai alla home"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-3 py-1 min-h-0">
        <div className="pb-1 mb-2">
          <ImportaVini />
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Cerca vini..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <input
                type="text"
                placeholder="Filtra per fornitore..."
                value={filters.fornitore}
                onChange={(e) => setFilters({ ...filters, fornitore: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize((size) => Math.max(10, size - 5))}
                  className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
                  disabled={fontSize <= 10}
                  style={{ opacity: fontSize <= 10 ? 0.5 : 1 }}
                >
                  -
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] transition-all text-sm font-medium rounded-md"
                  style={{ cursor: "default" }}
                >
                  Aa
                </button>
                <button
                  onClick={() => setFontSize((size) => Math.min(24, size + 5))}
                  className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
                  disabled={fontSize >= 24}
                  style={{ opacity: fontSize >= 24 ? 0.5 : 1 }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => console.log("Esporta")}
              className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Esporta
            </button>
            <button
              onClick={() => {
                const backupData = {
                  timestamp: new Date().toISOString(),
                  vini: wineRows.filter((row) => row.nomeVino.trim() || row.produttore.trim()),
                  tipologie: tipologie,
                };

                const dataStr = JSON.stringify(backupData, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `winenode-backup-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                alert("Backup creato e scaricato con successo!");
              }}
              className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              title="Crea backup dati"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Backup
            </button>
          </div>
        </div>

        <div className="bg-black/30 border-b border-red-900/30 px-4 py-4">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-center flex-wrap gap-2">
              {[
                "BOLLICINE ITALIANE",
                "BOLLICINE FRANCESI",
                "BIANCHI",
                "ROSSI",
                "ROSATI",
                "VINI DOLCI",
              ].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveTab(category);
                    if (csvUrls[category as keyof typeof csvUrls]) {
                      fetchAndParseCSV(csvUrls[category as keyof typeof csvUrls], category);
                    }
                  }}
                  className={`px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 border-2 ${
                    activeTab === category
                      ? "bg-amber-700 text-cream border-amber-500 shadow-lg"
                      : "bg-brown-800/60 text-cream/80 border-brown-600/40 hover:bg-brown-700/70 hover:border-brown-500/60"
                  }`}
                  style={{
                    backgroundColor: activeTab === category ? "#b45309" : "#5d2f0a80",
                    borderColor: activeTab === category ? "#f59e0b" : "#8b4513aa",
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-lg shadow-2xl border border-amber-900 overflow-hidden flex-1 min-h-0"
          style={{ backgroundColor: "#8B4513" }}
        >
          <div className="h-full overflow-x-hidden overflow-y-auto">
            <table
              className="w-full table-fixed"
              style={{ borderCollapse: "collapse" }}
            >
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
                      onMouseDown={(e) => handleMouseDown(e, "nomeVino")}
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
                      onMouseDown={(e) => handleMouseDown(e, "anno")}
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
                      onMouseDown={(e) => handleMouseDown(e, "produttore")}
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
                      onMouseDown={(e) => handleMouseDown(e, "provenienza")}
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
                      onMouseDown={(e) => handleMouseDown(e, "fornitore")}
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
                      onMouseDown={(e) => handleMouseDown(e, "giacenza")}
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

              <tbody>
                {filteredRows.map((row, index) => {
                  const isSelected = selectedRows.includes(index);
                  const bgColor = isSelected ? "#E6D7B8" : "#F5F0E6";
                  const borderW = isSelected ? "2px" : "1px";
                  const borderC = isSelected ? "#D97706" : "#92400e";

                  return (
                    <tr
                      key={row.id}
                      onClick={(e) => handleRowClick(index, e)}
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
                              handleCellChange(index, "giacenza", Math.max(0, row.giacenza - 1).toString());
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
                            onChange={(e) => handleCellChange(index, "giacenza", e.target.value)}
                            className="w-full px-1 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none font-bold"
                            style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                            min="0"
                          />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellChange(index, "giacenza", (Number(row.giacenza) + 1).toString());
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
                })}
              </tbody>
            </table>

            <div className="sticky bottom-0 z-40 bg-[#8B4513] border-t-2 border-amber-900 shadow-lg">
              <button
                onClick={addNewRow}
                className="w-full border border-amber-900 p-3 text-white font-medium hover:bg-amber-200 transition-colors"
                style={{ backgroundColor: "#2d0505", fontSize: fontSize, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>

        {showAddRowsPanel && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md shadow-md">
            <h3 className="text-lg font-semibold text-white mb-2">Aggiungi Righe</h3>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => addRows(5)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Aggiungi 5 Righe
              </button>
              <button
                onClick={() => addRows(10)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Aggiungi 10 Righe
              </button>
              <button
                onClick={removeEmptyRows}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Pulisci Righe Vuote
              </button>
              <button
                onClick={() => setShowAddRowsPanel(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16" />
        </div>
      </footer>

      {showTipologieModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Gestisci Tipologie</h2>

            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Aggiungi Nuova Tipologia</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nome tipologia"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {availableColors.map((c) => (
                    <option key={c.color} value={c.color}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddTipologia}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors w-full"
              >
                Aggiungi
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Modifica Tipologia Esistente</h3>
              <input
                type="text"
                placeholder="Cerca tipologia..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchTipologie();
                }}
                className="w-full px-3 py-2 border rounded-md"
              />
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((tipologia) => (
                    <li
                      key={tipologia.id}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <span>{tipologia.nome}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="px-3 py-1 border rounded-md"
                        />
                        <select
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {availableColors.map((c) => (
                            <option key={c.color} value={c.color}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEditTipologia(tipologia, editValue)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => handleRemoveTipologia(tipologia)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                          Elimina
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nessuna tipologia trovata.</p>
              )}
            </div>

            <button
              onClick={() => setShowTipologieModal(false)}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors w-full"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}