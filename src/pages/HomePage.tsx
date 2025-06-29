
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWines } from "../hooks/useWines";
import { useTipologie } from "../hooks/useTipologie";
import { supabase, authManager } from "../lib/supabase";
import { Filter, Settings, Plus, X, Save, Database } from 'lucide-react'
import FilterModal from '../components/FilterModal'
import WineDetailsModal from '../components/WineDetailsModal'

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

type WineType = {
  id: number;
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  vintage: string | null;
  region: string | null;
  description: string | null;
};

export default function HomePage() {
  const navigate = useNavigate()
  const { wines, suppliers, loading, error, isAuthenticated, refreshWines, updateWineInventory, updateWine } = useWines()
  const { tipologie } = useTipologie()

  const [wineRows, setWineRows] = useState<WineRow[]>([])
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showWineDetailsModal, setShowWineDetailsModal] = useState(false)
  const [selectedWine, setSelectedWine] = useState<WineType | null>(null)
  const [filters, setFilters] = useState({
    wineType: '',
    supplier: '',
    showAlertsOnly: false,
    search: '',
    fornitore: ''
  })
  const [showAddWineModal, setShowAddWineModal] = useState(false)
  const [newWine, setNewWine] = useState({
    name: "",
    type: "rosso",
    price: "",
    minStock: "2",
    supplier: "",
    description: ""
  })
  const [isAddingWine, setIsAddingWine] = useState(false)
  const [showFornitoreModal, setShowFornitoreModal] = useState(false)
  const [fornitori, setFornitori] = useState<string[]>([])
  const [modalFilters, setModalFilters] = useState({
    fornitore: '',
    tipologie: [] as string[],
    isActive: false
  })
  const [fontSize, setFontSize] = useState<number>(() => {
    const isTabletLandscape =
      window.innerWidth <= 1024 &&
      window.innerWidth > 480 &&
      window.innerHeight < window.innerWidth;
    return isTabletLandscape ? 12 : 14;
  });

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
  const [saveTimeouts, setSaveTimeouts] = useState(new Map<number, NodeJS.Timeout>());

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

  // Trasforma i vini dal database in formato WineRow
  useEffect(() => {
    if (wines && wines.length > 0) {
      const winesFromDb = wines.map((wine) => ({
        id: `db-${wine.id}`,
        nomeVino: wine.name || "",
        anno: wine.vintage || "",
        produttore: wine.description || "",
        provenienza: wine.region || "",
        giacenza: wine.inventory || 0,
        fornitore: wine.supplier || "",
        tipologia: wine.type || "",
      }));

      const emptyRows = Array.from(
        { length: Math.max(0, 20 - winesFromDb.length) },
        (_, idx) => ({
          id: `row-${winesFromDb.length + idx}`,
          nomeVino: "",
          anno: "",
          produttore: "",
          provenienza: "",
          giacenza: 0,
          fornitore: "",
          tipologia: "",
        }),
      );

      setWineRows([...winesFromDb, ...emptyRows]);
    }
  }, [wines]);

  // Estrai fornitori unici
  useEffect(() => {
    const estraiFornitori = () => {
      const fornitoriUnici = Array.from(new Set(
        wines
          .map(wine => wine.supplier?.trim())
          .filter(fornitore => fornitore && fornitore.length > 0)
      )).sort();
      
      setFornitori(fornitoriUnici);
    };

    estraiFornitori();
  }, [wines]);

  const handleUpdateInventory = async (wineId: number, newInventory: number) => {
    const success = await updateWineInventory(wineId, newInventory)
    if (!success) {
      console.error('Errore nell\'aggiornamento della giacenza')
    }
  }

  const handleUpdateWine = async (wineId: number, updates: Partial<WineType>) => {
    const success = await updateWine(wineId, updates)
    if (!success) {
      console.error('Errore nell\'aggiornamento del vino')
    }
  }

  const handleWineClick = (wine: WineType) => {
    setSelectedWine(wine)
    setShowWineDetailsModal(true)
  }

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

  const addNewRow = () => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      nomeVino: "",
      anno: "",
      produttore: "",
      provenienza: "",
      giacenza: 0,
      fornitore: "",
      tipologia: "",
    };
    setWineRows((prev) => [...prev, newRow]);
  };

  const handleAddWine = async () => {
    if (!newWine.name.trim()) return

    setIsAddingWine(true)
    try {
      if (!authManager.isAuthenticated()) {
        throw new Error('Supabase non configurato o utente non autenticato')
      }

      const userId = authManager.getUserId()
      if (!userId) {
        throw new Error('ID utente non disponibile')
      }

      const { data, error } = await supabase!
        .from('giacenze')
        .insert({
          name: newWine.name,
          type: newWine.type,
          supplier: newWine.supplier || 'Da definire',
          inventory: 0,
          min_stock: parseInt(newWine.minStock) || 2,
          price: newWine.price || '0',
          vintage: null,
          region: null,
          description: newWine.description || null,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Errore nell\'aggiunta vino su Supabase:', error)
        throw error
      }

      setNewWine({
        name: "",
        type: "rosso",
        price: "",
        minStock: "2",
        supplier: "",
        description: ""
      })
      setShowAddWineModal(false)

      await refreshWines()
      console.log('Vino aggiunto con successo:', data)
    } catch (error) {
      console.error('Errore nell\'aggiunta del vino:', error)
    } finally {
      setIsAddingWine(false)
    }
  }

  const lineHeight = fontSize * 1.2;
  const rowHeight = fontSize * 2.5;

  const filteredRows = useMemo(() => {
    // Se il filtro modale è attivo, filtra da TUTTI i vini
    if (modalFilters.isActive) {
      return wineRows.filter(row => {
        const matchesModalFornitore = !modalFilters.fornitore || 
          row.fornitore?.toLowerCase().includes(modalFilters.fornitore.toLowerCase())
        
        const matchesModalTipologie = modalFilters.tipologie.length === 0 || 
          modalFilters.tipologie.includes('TUTTE') ||
          modalFilters.tipologie.includes(row.tipologia || '')
        
        const matchesSearch = !filters.search || 
          row.nomeVino?.toLowerCase().includes(filters.search.toLowerCase()) ||
          row.produttore?.toLowerCase().includes(filters.search.toLowerCase()) ||
          row.provenienza?.toLowerCase().includes(filters.search.toLowerCase())

        return matchesModalFornitore && matchesModalTipologie && matchesSearch
      })
    }

    // Altrimenti usa filtri normali
    return wineRows.filter(row => {
      const matchesSearch = !filters.search || 
        row.nomeVino?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.produttore?.toLowerCase().includes(filters.search.toLowerCase()) ||
        row.provenienza?.toLowerCase().includes(filters.search.toLowerCase())
      const matchesFornitore = !filters.fornitore || 
        row.fornitore?.toLowerCase().includes(filters.fornitore.toLowerCase())

      return matchesSearch && matchesFornitore
    })
  }, [wineRows, filters, modalFilters])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream">Effettua l'accesso per vedere i tuoi vini</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream">Caricamento vini...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refreshWines}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-[95vh] flex flex-col"
      style={{ background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)" }}
    >
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src="/logo 2 CCV.png" alt="WINENODE" className="h-24 w-auto object-contain" />

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/settings/archivi')}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Vai agli archivi"
              >
                <Database className="h-6 w-6" />
              </button>
              <button
                onClick={() => setShowFilterModal(true)}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Filtri"
              >
                <Filter className="h-6 w-6" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Impostazioni"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-3 py-1 min-h-0">
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

              <button
                onClick={() => setShowFornitoreModal(true)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-cream hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[200px] text-left flex items-center justify-between"
              >
                <span>{filters.fornitore || 'Filtra per fornitore...'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
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
                        <input
                          type="text"
                          value={row.nomeVino}
                          onChange={(e) => handleCellChange(index, "nomeVino", e.target.value)}
                          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center"
                          style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          placeholder="Nome vino..."
                        />
                      </td>

                      <td
                        className="border border-amber-900 p-0"
                        style={{ backgroundColor: bgColor, width: columnWidths["anno"] }}
                      >
                        <input
                          type="text"
                          value={row.anno}
                          onChange={(e) => handleCellChange(index, "anno", e.target.value)}
                          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center"
                          style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          placeholder="Anno..."
                        />
                      </td>

                      <td
                        className="border border-amber-900 p-0"
                        style={{ backgroundColor: bgColor, width: columnWidths["produttore"] }}
                      >
                        <input
                          type="text"
                          value={row.produttore}
                          onChange={(e) => handleCellChange(index, "produttore", e.target.value)}
                          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center"
                          style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          placeholder="Produttore..."
                        />
                      </td>

                      <td
                        className="border border-amber-900 p-0"
                        style={{ backgroundColor: bgColor, width: columnWidths["provenienza"] }}
                      >
                        <input
                          type="text"
                          value={row.provenienza}
                          onChange={(e) => handleCellChange(index, "provenienza", e.target.value)}
                          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center"
                          style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          placeholder="Provenienza..."
                        />
                      </td>

                      <td
                        className="border border-amber-900 p-0"
                        style={{ backgroundColor: bgColor, width: columnWidths["fornitore"] }}
                      >
                        <input
                          type="text"
                          value={row.fornitore}
                          onChange={(e) => handleCellChange(index, "fornitore", e.target.value)}
                          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center"
                          style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
                          placeholder="Fornitore..."
                        />
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
                            className="w-full px-1 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center font-bold"
                            style={{ backgroundColor: bgColor, ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
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
      </main>

      <FilterModal
        open={showFilterModal}
        onOpenChange={setShowFilterModal}
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <WineDetailsModal
        wine={selectedWine}
        open={showWineDetailsModal}
        onOpenChange={setShowWineDetailsModal}
        onUpdateWine={handleUpdateWine}
        suppliers={suppliers}
      />

      {!showWineDetailsModal && (
        <button
          onClick={() => setShowAddWineModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-black/30 backdrop-blur-sm hover:bg-black/40 text-amber-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 border border-red-900/30"
          title="Aggiungi nuovo vino"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {showAddWineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-cream">AGGIUNGI NUOVO VINO</h3>
              <button
                onClick={() => setShowAddWineModal(false)}
                className="text-gray-400 hover:text-cream"
                disabled={isAddingWine}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome Vino *</label>
                <input
                  type="text"
                  value={newWine.name}
                  onChange={e => setNewWine(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                  placeholder="Inserisci il nome del vino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Colore Vino</label>
                <select
                  value={newWine.type}
                  onChange={e => setNewWine(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                >
                  <option value="rosso">Rosso</option>
                  <option value="bianco">Bianco</option>
                  <option value="bollicine">Bollicine</option>
                  <option value="rosato">Rosato</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Costo Vino (€)</label>
                  <input
                    type="text"
                    value={newWine.price || ''}
                    onChange={e => setNewWine(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                    placeholder="Es: 15.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Soglia Minima</label>
                  <input
                    type="number"
                    value={newWine.minStock || '2'}
                    onChange={e => setNewWine(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                    placeholder="2"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fornitore</label>
                <select
                  value={newWine.supplier || ''}
                  onChange={e => setNewWine(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Seleziona fornitore</option>
                  {suppliers.map((supplier, index) => (
                    <option key={`${supplier}-${index}`} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrizione Completa</label>
                <textarea
                  value={newWine.description || ''}
                  onChange={e => setNewWine(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Descrizione dettagliata del vino..."
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowAddWineModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
                disabled={isAddingWine}
              >
                Annulla
              </button>
              <button
                onClick={handleAddWine}
                disabled={!newWine.name.trim() || isAddingWine}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-cream rounded px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" />
                {isAddingWine ? 'Aggiungendo...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Filtro Avanzato */}
      {showFornitoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
            {/* Header della modale */}
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

            {/* Corpo della modale */}
            <div className="p-4 max-h-96 overflow-y-auto space-y-6">
              {/* Selezione Fornitore */}
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
                  {fornitori.map((fornitore) => (
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
                            {wineRows.filter(wine => wine.fornitore === fornitore).length} vini
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer della modale */}
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
    </div>
  )
}
