import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  tipologia?: string;
}

interface Filters {
  tipologia: string;
  search: string;
  fornitore: string;
}

interface ModalFilters {
  fornitore: string;
  tipologie: string[];
  isActive: boolean;
}

const CSV_URLS = {
  "BOLLICINE ITALIANE": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv",
  "BOLLICINE FRANCESI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv",
  "BIANCHI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv",
  "ROSSI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv",
  "ROSATI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv",
  "VINI DOLCI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv"
} as const;

const DEFAULT_COLORS = {
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
} as const;

const AVAILABLE_COLORS = [
  { color: "#cccccc", name: "Grigio chiaro" },
  { color: "#d4b000", name: "Giallo scuro" },
  { color: "#7b4a15", name: "Marrone scuro" },
  { color: "#3ca65c", name: "Verde classico" },
  { color: "#f08c00", name: "Arancione" },
  { color: "#8c1c1c", name: "Bordeaux" },
  { color: "#3b78c2", name: "Blu" },
  { color: "#000000", name: "Nero" },
] as const;

const DEFAULT_COLUMN_WIDTHS = {
  "#": "3%",
  nomeVino: "30%",
  anno: "8%",
  produttore: "25%",
  provenienza: "20%",
  fornitore: "18%",
  giacenza: "6%",
  azioni: "6%",
} as const;

export default function ArchiviPage() {
  const navigate = useNavigate();
  const { wines: existingWines, types, refreshWines } = useWines();
  const { tipologie, addTipologia: addTipologiaToDb, removeTipologia: removeTipologiaFromDb, updateTipologia: updateTipologiaInDb } = useTipologie();

  // Stati principali
  const [wineRows, setWineRows] = useState<WineRow[]>([]);
  const [allWineRows, setAllWineRows] = useState<WineRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("BOLLICINE ITALIANE");
  const [fontSize, setFontSize] = useState<number>(() => {
    const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480 && window.innerHeight < window.innerWidth;
    return isTabletLandscape ? 12 : 14;
  });

  // Stati per modali
  const [showTipologieModal, setShowTipologieModal] = useState(false);
  const [showFornitoreModal, setShowFornitoreModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Tipologia[]>([]);
  const [editingProducer, setEditingProducer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedColor, setSelectedColor] = useState("#cccccc");

  // Stati per filtri
  const [filters, setFilters] = useState<Filters>({
    tipologia: '',
    search: '',
    fornitore: ''
  });
  const [modalFilters, setModalFilters] = useState<ModalFilters>({
    fornitore: '',
    tipologie: [],
    isActive: false
  });

  // Stati per gestione colonne
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem("winenode-column-widths");
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasAllCols = Object.keys(DEFAULT_COLUMN_WIDTHS).every(key => parsed.hasOwnProperty(key));
        if (hasAllCols) return parsed;
      }
    } catch {
      // ignore error
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Stati per fornitori e save timeouts
  const [fornitori, setFornitori] = useState<string[]>([]);
  const [saveTimeouts, setSaveTimeouts] = useState(new Map<number, NodeJS.Timeout>());

  // Funzioni utili memoizzate
  const getFontSizeStyle = useCallback(() => {
    const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480;
    const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
    return { fontSize: `${adjustedSize}px` };
  }, [fontSize]);

  const getTipologiaColore = useCallback((tipologiaNome: string) => {
    const typeData = types.find(t => t.nome === tipologiaNome);
    if (typeData?.colore) return typeData.colore;
    const selectedTipologia = tipologie.find(tip => tip.nome === tipologiaNome);
    return selectedTipologia?.colore || "#cccccc";
  }, [types, tipologie]);

  // Fetch CSV data con cache e ottimizzazioni
  const fetchAndParseCSV = useCallback(async (url: string, categoria: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const csvText = await response.text();

      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
      let startRow = 0;

      // Trova la riga di inizio dati
      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        if (!row || !row.length) continue;

        const firstCell = row[0]?.trim().toUpperCase() || "";
        const rowText = row.join("").toLowerCase();

        // Skip header categories
        if (["BIANCHI", "BOLLICINE", "BOLLICINE ITALIANE", "BOLLICINE FRANCESI", "ROSSI", "ROSATI", "VINI DOLCI"].includes(firstCell) || firstCell.includes("BOLLICINE")) {
          continue;
        }

        // Check for header row
        if (rowText.includes("nome vino") || rowText.includes("produttore") || firstCell === "NOME VINO") {
          startRow = i + 1;
          continue;
        }

        // Found data start
        if (row[0] && row[0].trim() && row[0].length > 3 && !firstCell.includes("VINI") && !firstCell.includes("BOLLICINE")) {
          startRow = i;
          break;
        }
      }

      const dataRows = parsed.data.slice(startRow);
      const winesFromCsv: WineRow[] = dataRows
        .filter(row => row && row[0] && row[0].trim())
        .map((row, index) => ({
          id: `csv-${categoria}-${index}`,
          nomeVino: row[0]?.trim() || "",
          anno: row[1]?.trim() || "",
          produttore: row[2]?.trim() || "",
          provenienza: row[3]?.trim() || "",
          fornitore: row[4]?.trim() || "",
          giacenza: 0,
          tipologia: categoria,
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
        })
      );

      setWineRows([...winesFromCsv, ...emptyRows]);
    } catch (error) {
      console.error(`Errore nel caricamento dati per ${categoria}:`, error);
    }
  }, []);

  // Carica tutti i CSV per fornitori
  const loadAllCSVData = useCallback(async () => {
    const allWines: WineRow[] = [];

    for (const [categoria, url] of Object.entries(CSV_URLS)) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const csvText = await response.text();
        const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });

        let startRow = 0;
        for (let i = 0; i < parsed.data.length; i++) {
          const row = parsed.data[i];
          if (!row || !row.length) continue;

          const firstCell = row[0]?.trim().toUpperCase() || "";
          const rowText = row.join("").toLowerCase();

          if (["BIANCHI", "BOLLICINE", "BOLLICINE ITALIANE", "BOLLICINE FRANCESI", "ROSSI", "ROSATI", "VINI DOLCI"].includes(firstCell) || firstCell.includes("BOLLICINE")) {
            continue;
          }

          if (rowText.includes("nome vino") || rowText.includes("produttore") || firstCell === "NOME VINO") {
            startRow = i + 1;
            continue;
          }

          if (row[0] && row[0].trim() && row[0].length > 3 && !firstCell.includes("VINI") && !firstCell.includes("BOLLICINE")) {
            startRow = i;
            break;
          }
        }

        const dataRows = parsed.data.slice(startRow);
        const winesFromCsv: WineRow[] = dataRows
          .filter(row => row && row[0] && row[0].trim())
          .map((row, index) => ({
            id: `csv-${categoria}-${index}`,
            nomeVino: row[0]?.trim() || "",
            anno: row[1]?.trim() || "",
            produttore: row[2]?.trim() || "",
            provenienza: row[3]?.trim() || "",
            fornitore: row[4]?.trim() || "",
            giacenza: 0,
            tipologia: categoria,
          }));

        allWines.push(...winesFromCsv);
      } catch (error) {
        console.error(`Errore nel caricamento dati per ${categoria}:`, error);
      }
    }

    setAllWineRows(allWines);
  }, []);

  // Handlers per resize colonne
  const handleMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(colKey);
    setStartX(e.clientX);
    setStartWidth(parseInt(columnWidths[colKey as keyof typeof columnWidths]));
  }, [columnWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
  }, [isResizing, resizingColumn, startX, startWidth, columnWidths]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, []);

  // Handlers per celle
  const handleCellChange = useCallback((rowIndex: number, field: string, value: string) => {
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
  }, [wineRows, saveTimeouts, saveRowToDatabase]);

  const handleRowClick = useCallback((index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedRows(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else if (event.shiftKey && selectedRows.length > 0) {
      const lastSelected = selectedRows[selectedRows.length - 1];
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      setSelectedRows(Array.from({ length: end - start + 1 }, (_, i) => start + i));
    } else {
      setSelectedRows([index]);
    }
  }, [selectedRows]);

  // Gestione tipologie
  const handleAddTipologia = useCallback(async () => {
    if (!newItemName.trim()) return;
    const tipologiaName = newItemName.trim().toUpperCase();
    const defaultColor = DEFAULT_COLORS[tipologiaName as keyof typeof DEFAULT_COLORS] || selectedColor;

    const success = await addTipologiaToDb(tipologiaName, defaultColor);
    if (success) {
      setNewItemName("");
      setSelectedColor("#cccccc");
    } else {
      alert("Errore nell'aggiunta della tipologia o tipologia già esistente");
    }
  }, [newItemName, selectedColor, addTipologiaToDb]);

  const handleRemoveTipologia = useCallback(async (tipologia: Tipologia) => {
    const success = await removeTipologiaFromDb(tipologia.id);
    if (!success) alert("Errore nella rimozione della tipologia");
  }, [removeTipologiaFromDb]);

  const searchTipologie = useCallback(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setEditValue("");
      return;
    }
    const results = tipologie.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    setSearchResults(results);
    if (results.length > 0) setEditValue(results[0].nome);
  }, [searchTerm, tipologie]);

  const handleEditTipologia = useCallback(async (tipologia: Tipologia, newName: string) => {
    if (!newName.trim()) return;
    if (newName === tipologia.nome && selectedColor === tipologia.colore) return;

    const success = await updateTipologiaInDb(tipologia.id, newName.trim().toUpperCase(), selectedColor);

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
  }, [selectedColor, updateTipologiaInDb]);

  // Salvataggio nel database
  const saveRowToDatabase = useCallback(async (rowData: WineRow, rowIndex: number) => {
    try {
      if (!authManager.isAuthenticated() || !supabase) {
        throw new Error("Utente non autenticato o Supabase non disponibile");
      }

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
  }, [wineRows, refreshWines]);

  // Filtri memoizzati
  const filteredRows = useMemo(() => {
    if (modalFilters.isActive) {
      return allWineRows.filter(row => {
        const matchesModalFornitore = !modalFilters.fornitore || 
          row.fornitore?.toLowerCase().includes(modalFilters.fornitore.toLowerCase());

        const matchesModalTipologie = modalFilters.tipologie.length === 0 || 
          modalFilters.tipologie.includes('TUTTE') ||
          modalFilters.tipologie.includes(row.tipologia || activeTab);

        const matchesSearch = !filters.search || 
          row.nomeVino?.toLowerCase().includes(filters.search.toLowerCase()) ||
          row.produttore?.toLowerCase().includes(filters.search.toLowerCase()) ||
          row.provenienza?.toLowerCase().includes(filters.search.toLowerCase());

        return matchesModalFornitore && matchesModalTipologie && matchesSearch;
      });
    }

    return wineRows.filter(row => {
      const matchesTipologia = !filters.tipologia || row.tipologia === filters.tipologia;
      const matchesSearch = !filters.search || 
        row.nomeVino?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.produttore?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.provenienza?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesFornitore = !filters.fornitore || 
        row.fornitore?.toLowerCase().includes(filters.fornitore.toLowerCase());

      return matchesTipologia && matchesSearch && matchesFornitore;
    });
  }, [wineRows, allWineRows, filters, modalFilters, activeTab]);

  // Effects
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
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleResize = () => {
      const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480 && window.innerHeight < window.innerWidth;
      const newFontSize = isTabletLandscape ? 12 : 14;
      if (fontSize !== newFontSize) setFontSize(newFontSize);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fontSize]);

  useEffect(() => {
    const fornitoriUnici = Array.from(new Set(
      allWineRows
        .map(wine => wine.fornitore?.trim())
        .filter(fornitore => fornitore && fornitore.length > 0)
    )).sort();
    setFornitori(fornitoriUnici);
  }, [allWineRows]);

  useEffect(() => {
    if (!existingWines || existingWines.length === 0) {
      loadAllCSVData();
    }
  }, [existingWines, loadAllCSVData]);

  useEffect(() => {
    if (existingWines && existingWines.length > 0) {
      const winesFromDb = existingWines.map(wine => ({
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
        })
      );

      setWineRows([...winesFromDb, ...emptyRows]);
      setAllWineRows(prev => [...prev, ...winesFromDb]);
    } else if (CSV_URLS[activeTab as keyof typeof CSV_URLS]) {
      fetchAndParseCSV(CSV_URLS[activeTab as keyof typeof CSV_URLS], activeTab);
    }
  }, [existingWines, activeTab, fetchAndParseCSV]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      saveTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [saveTimeouts]);

  const addNewRow = useCallback(() => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      nomeVino: "",
      anno: "",
      produttore: "",
      provenienza: "",
      giacenza: 0,
      fornitore: "",
    };
    setWineRows(prev => [...prev, newRow]);
  }, []);

  const lineHeight = fontSize * 1.2;
  const rowHeight = fontSize * 2.5;

  return (
    <div
      className="h-[95vh] flex flex-col"
      style={{ background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)" }}
    >
      {/* Header */}
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
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
        {/* Importa Vini Component */}
        <div className="pb-1 mb-2">
          <ImportaVini />
        </div>

        {/* Controls */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
              {modalFilters.isActive && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm">
                  <span>
                    Filtro: {modalFilters.fornitore || 'Tutti i fornitori'}
                    {modalFilters.tipologie.length > 0 && modalFilters.tipologie.includes('TUTTE') 
                      ? ' - Tutte le tipologie' 
                      : modalFilters.tipologie.length > 0 
                      ? ` - ${modalFilters.tipologie.length} tipologie` 
                      : ''}
                  </span>
                  <button
                    onClick={() => {
                      setModalFilters({ fornitore: '', tipologie: [], isActive: false });
                      setFilters({ ...filters, fornitore: '' });
                    }}
                    className="ml-1 hover:text-blue-100"
                    title="Rimuovi filtro modale"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {!modalFilters.isActive && filters.fornitore && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-600/20 border border-amber-600/50 rounded-lg text-amber-200 text-sm">
                  <span>Fornitore: {filters.fornitore}</span>
                  <button
                    onClick={() => setFilters({ ...filters, fornitore: '' })}
                    className="ml-1 hover:text-amber-100"
                    title="Rimuovi filtro fornitore"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            <button
              onClick={() => setShowFornitoreModal(true)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px] text-left flex items-center justify-between"
            >
              <span>{filters.fornitore || 'Filtra per fornitore...'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Font Size Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(size => Math.max(10, size - 5))}
                className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
                disabled={fontSize <= 10}
                style={{ opacity: fontSize <= 10 ? 0.5 : 1 }}
              >
                -
              </button>
              <span className="px-3 py-2 bg-[#3A1E18] text-[#F5EEDC] text-sm font-medium rounded-md">
                Aa
              </span>
              <button
                onClick={() => setFontSize(size => Math.min(24, size + 5))}
                className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
                disabled={fontSize >= 24}
                style={{ opacity: fontSize >= 24 ? 0.5 : 1 }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const backupData = {
                  timestamp: new Date().toISOString(),
                  vini: wineRows.filter(row => row.nomeVino.trim() || row.produttore.trim()),
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
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Backup
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-black/30 border-b border-red-900/30 px-4 py-4">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-center flex-wrap gap-2">
              {Object.keys(CSV_URLS).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    if (!modalFilters.isActive) {
                      setActiveTab(category);
                      if (CSV_URLS[category as keyof typeof CSV_URLS]) {
                        fetchAndParseCSV(CSV_URLS[category as keyof typeof CSV_URLS], category);
                      }
                    }
                  }}
                  disabled={modalFilters.isActive}
                  className={`px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 border-2 ${
                    modalFilters.isActive
                      ? "bg-gray-500/40 text-gray-400 border-gray-400/40 cursor-not-allowed opacity-50"
                      : activeTab === category
                      ? "bg-amber-700 text-cream border-amber-500 shadow-lg"
                      : "bg-brown-800/60 text-cream/80 border-brown-600/40 hover:bg-brown-700/70 hover:border-brown-500/60"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-lg shadow-2xl border border-amber-900 overflow-hidden flex-1 min-h-0"
          style={{ backgroundColor: "#8B4513" }}
        >
          <div className="h-full overflow-x-hidden overflow-y-auto">
            <table className="w-full table-fixed" style={{ borderCollapse: "collapse" }}>
              <thead className="sticky top-0 z-30 shadow-lg" style={{ backgroundColor: "#3b1d1d" }}>
                <tr style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, height: `${rowHeight}px` }}>
                  <th className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm" style={{ width: columnWidths["#"] }}></th>

                  {[
                    { key: "nomeVino", label: "Nome Vino" },
                    { key: "anno", label: "Anno" },
                    { key: "produttore", label: "Produttore" },
                    { key: "provenienza", label: "Provenienza" },
                    { key: "fornitore", label: "Fornitore" },
                    { key: "giacenza", label: "Giacenza" }
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group"
                      style={{ width: columnWidths[key as keyof typeof columnWidths] }}
                    >
                      {label}
                      <div
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onMouseDown={(e) => handleMouseDown(e, key)}
                        title="Ridimensiona colonna"
                      >
                        <div className="flex space-x-0.5">
                          <div className="w-0.5 h-4 bg-amber-600"></div>
                          <div className="w-0.5 h-4 bg-amber-600"></div>
                        </div>
                      </div>
                    </th>
                  ))}

                  <th className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm" style={{ width: columnWidths["azioni"] }} />
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
                      <td className="border border-amber-900 p-0" style={{ backgroundColor: bgColor, width: columnWidths["#"] }}>
                        <div
                          className="w-full px-2 py-2 text-center text-gray-600 font-medium select-none flex items-center justify-center"
                          style={{ fontSize: fontSize * 0.7, userSelect: "none", height: 40 }}
                        >
                          {index + 1}
                        </div>
                      </td>

                      {["nomeVino", "anno", "produttore", "provenienza", "fornitore"].map(field => (
                        <td key={field} className="border border-amber-900 p-0" style={{ backgroundColor: bgColor, width: columnWidths[field as keyof typeof columnWidths] }}>
                          <div
                            className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
                            style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          >
                            {row[field as keyof WineRow]}
                          </div>
                        </td>
                      ))}

                      <td className="border border-amber-900 p-0 group" style={{ backgroundColor: bgColor, width: columnWidths["giacenza"] }}>
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

                      <td className="border border-amber-900 p-0" style={{ backgroundColor: bgColor, width: columnWidths["azioni"] }}>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16" />
        </div>
      </footer>

      {/* Modals */}
      {showFornitoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
              <h3 className="text-xl font-bold text-cream flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtro Avanzato
              </h3>
              <button
                onClick={() => setShowFornitoreModal(false)}
                className="text-gray-400 hover:text-cream p-1 rounded-lg hover:bg-gray-700 transition-colors"
                title="Chiudi"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Fornitore
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setModalFilters(prev => ({ ...prev, fornitore: '' }))}
                    className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                      !modalFilters.fornitore 
                        ? 'bg-amber-600/20 border-2 border-amber-500/60 text-amber-100' 
                        : 'bg-gray-800 hover:bg-gray-700 text-cream border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${!modalFilters.fornitore ? 'bg-amber-400' : 'bg-gray-500'}`} />
                      <span className="font-medium">Tutti i fornitori</span>
                    </div>
                  </button>
                  {fornitori.map(fornitore => (
                    <button
                      key={fornitore}
                      onClick={() => setModalFilters(prev => ({ ...prev, fornitore }))}
                      className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                        modalFilters.fornitore === fornitore 
                          ? 'bg-amber-600/20 border-2 border-amber-500/60 text-amber-100' 
                          : 'bg-gray-800 hover:bg-gray-700 text-cream border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${modalFilters.fornitore === fornitore ? 'bg-amber-400' : 'bg-gray-500'}`} />
                        <div className="flex-1">
                          <div className="font-medium">{fornitore}</div>
                          <div className="text-sm opacity-70">
                            {allWineRows.filter(wine => wine.fornitore === fornitore).length} vini
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tipologie
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setModalFilters(prev => ({ ...prev, tipologie: ['TUTTE'] }))}
                    className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                      modalFilters.tipologie.includes('TUTTE') 
                        ? 'bg-green-600/20 border-2 border-green-500/60 text-green-100' 
                        : 'bg-gray-800 hover:bg-gray-700 text-cream border border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${modalFilters.tipologie.includes('TUTTE') ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span className="font-medium">Tutte le tipologie</span>
                    </div>
                  </button>
                  {Object.keys(CSV_URLS).map(tipologia => (
                    <button
                      key={tipologia}
                      onClick={() => {
                        setModalFilters(prev => {
                          const newTipologie = prev.tipologie.includes('TUTTE') 
                            ? [tipologia]
                            : prev.tipologie.includes(tipologia)
                            ? prev.tipologie.filter(t => t !== tipologia)
                            : [...prev.tipologie.filter(t => t !== 'TUTTE'), tipologia];
                          return { ...prev, tipologie: newTipologie };
                        });
                      }}
                      className={`w-full p-3 text-left rounded-lg transition-all duration-200 ${
                        modalFilters.tipologie.includes(tipologia) && !modalFilters.tipologie.includes('TUTTE')
                          ? 'bg-green-600/20 border-2 border-green-500/60 text-green-100' 
                          : 'bg-gray-800 hover:bg-gray-700 text-cream border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          modalFilters.tipologie.includes(tipologia) && !modalFilters.tipologie.includes('TUTTE') ? 'bg-green-400' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium">{tipologia}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800/30 space-y-3">
              <button
                onClick={() => {
                  setModalFilters(prev => ({ ...prev, isActive: true }));
                  setShowFornitoreModal(false);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-cream rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Applica Filtro
              </button>
              <button
                onClick={() => setShowFornitoreModal(false)}
                className="w-full px-4 py-3 bg-gray-700 text-cream rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
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
                  {AVAILABLE_COLORS.map((c) => (
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
                          {AVAILABLE_COLORS.map((c) => (
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