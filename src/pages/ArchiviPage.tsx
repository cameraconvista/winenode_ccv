import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useWines } from '../hooks/useWines';
import { useTipologie } from '../hooks/useTipologie';
import Papa from 'papaparse';

import { supabase, authManager } from '../lib/supabase';
import ImportaVini from "../components/ImportaVini";

interface Tipologia {
  id: string;
  nome: string;
  colore?: string;
}

interface Anno {
  anno: number;
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
  const { tipologie, loading, addTipologia: addTipologiaToDb, removeTipologia: removeTipologiaFromDb, updateTipologia: updateTipologiaInDb } = useTipologie();


  // Initialize 100 empty rows
  const [wineRows, setWineRows] = useState<WineRow[]>(() => 
    Array.from({ length: 100 }, (_, index) => ({
      id: `row-${index}`,
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      giacenza: 0,
      fornitore: ''
    }))
  );

  // State for row selection
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // State for add rows panel
  const [showAddRowsPanel, setShowAddRowsPanel] = useState(false);

  // State for inventory modal
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedRowForInventory, setSelectedRowForInventory] = useState<number | null>(null);
  const [tempInventory, setTempInventory] = useState<number>(0);

  // Debug completo per identificare problemi
  useEffect(() => {
    const debugAuth = async () => {
      console.log('🔍 === DEBUG ARCHIVI COMPLETO ===');

      // 1. Verifica autenticazione
      const userId = authManager.getUserId();
      const isValid = await authManager.validateSession();
      console.log('👤 User ID:', userId);
      console.log('✅ Sessione valida:', isValid);

      // 2. Test query diretta tipologie
      if (userId && supabase) {
        try {
          const { data: tipologieTest, error: tipError } = await supabase
            .from('tipologie')
            .select('*')
            .eq('user_id', userId);

          console.log('📊 Query diretta tipologie:');
          console.log('  - Risultati:', tipologieTest?.length || 0);
          console.log('  - Errore:', tipError?.message || 'Nessuno');
          console.log('  - Dati:', tipologieTest);
        } catch (err) {
          console.error('❌ Errore query tipologie:', err);
        }


      }

      // 4. Stato hooks
      console.log('📊 Hook tipologie:', {
        count: tipologie.length,
        loading: loading,
        data: tipologie
      });



      console.log('🔍 === FINE DEBUG ARCHIVI ===');
    };

    debugAuth();
  }, [tipologie, loading]);

  // Stati per i modali di gestione archivi
  const [showTipologieModal, setShowTipologieModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Stati per il modal tipologie
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tipologia[]>([]);
  const [editingProducer, setEditingProducer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [activeTab, setActiveTab] = useState('BOLLICINE ITALIANE')

  // Stati per la selezione del colore tipologia
  const [selectedColor, setSelectedColor] = useState('#cccccc');

  // Mappa colori predefiniti per tipologie
  const defaultColors = {
    'BIANCO': '#cccccc',
    'BOLLICINE ESTERE': '#f4e04d',
    'BOLLICINE FRANCESI': '#f4e04d',
    'BOLLICINE ITALIANE': '#f4e04d',
    'CHAMPAGNE': '#f4e04d',
    'FORTIFICATI': '#8b5e3c',
    'NATURALI': '#a2d4c2',
    'NATURALI FRIZZANTI': '#a2d4c2',
    'RAMATI ORANGE': '#e78b43',
    'ROSSO': '#aa1c1c'
  };

  // Lista colori disponibili
  const availableColors = [
    { color: '#cccccc', name: 'Grigio chiaro' },
    { color: '#d4b000', name: 'Giallo scuro' },
    { color: '#7b4a15', name: 'Marrone scuro' },
    { color: '#3ca65c', name: 'Verde classico' },
    { color: '#f08c00', name: 'Arancione' },
    { color: '#8c1c1c', name: 'Bordeaux' },
    { color: '#3b78c2', name: 'Blu' },
    { color: '#000000', name: 'Nero' }
  ];

  // Stato per auto-save silenzioso
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // URL CSV per le categorie vini
  const csvUrls = {
    'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
    'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
    'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
    'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
    'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
    'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv'
  };

  // Funzione per scaricare e parsare CSV
  const fetchAndParseCSV = async (url: string, categoria: string) => {
    try {
      console.log(`📥 Caricamento dati CSV per categoria: ${categoria}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Errore HTTP: ${response.status}`);
      }

      const csvText = await response.text();
      console.log(`📄 CSV ricevuto (${csvText.length} caratteri)`);

      const parsed = Papa.parse<string[]>(csvText, {
        skipEmptyLines: false, // Manteniamo anche le righe vuote per preservare la struttura
      });

      if (parsed.errors.length > 0) {
        console.warn('⚠️ Errori nel parsing CSV:', parsed.errors);
      }

      console.log(`✅ CSV parsato: ${parsed.data.length} righe`);
      console.log('📋 Prime 5 righe CSV raw:', parsed.data.slice(0, 5));

      // Cerchiamo la riga di intestazione per identificare le colonne
      let headerRow = -1;
      let startRow = 0;

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        if (row && row.length > 0) {
          const rowText = row.join('').toLowerCase();
          const firstCell = row[0] ? row[0].trim().toUpperCase() : '';
          
          // Salta righe di titolo categoria (incluso VINI DOLCI)
          if (firstCell === 'BIANCHI' ||
              firstCell === 'BOLLICINE' ||
              firstCell === 'BOLLICINE ITALIANE' ||
              firstCell === 'BOLLICINE FRANCESI' ||
              firstCell === 'ROSSI' ||
              firstCell === 'ROSATI' ||
              firstCell === 'VINI DOLCI' ||
              firstCell.includes('BOLLICINE')) {
            console.log(`📋 Riga titolo categoria saltata alla riga ${i}:`, firstCell);
            continue;
          }
          
          // Cerca intestazioni esplicite (NOME VINO, ANNO, PRODUTTORE, ecc.)
          if (rowText.includes('nome vino') || 
              rowText.includes('produttore') || 
              rowText.includes('provenienza') ||
              rowText.includes('fornitore') ||
              rowText.includes('costo') ||
              rowText.includes('vendita') ||
              rowText.includes('margine') ||
              rowText.includes('giacenza') ||
              firstCell === 'NOME VINO' ||
              firstCell === 'ANNO' ||
              firstCell === 'PRODUTTORE') {
            headerRow = i;
            startRow = i + 1;
            console.log(`📋 Intestazioni colonne trovate alla riga ${i}:`, row);
            continue; // Salta questa riga di intestazione
          }
          
          // Se la prima colonna ha un nome vino valido e non è una categoria, inizia da qui
          if (row[0] && row[0].trim() && row[0].length > 3 && 
              !firstCell.includes('VINI') &&
              !firstCell.includes('BOLLICINE') &&
              !firstCell.includes('BIANCHI') &&
              !firstCell.includes('ROSSI') &&
              !firstCell.includes('ROSATI')) {
            startRow = i;
            console.log(`📋 Prima riga dati valida trovata alla riga ${i}:`, row);
            break;
          }
        }
      }

      const dataRows = parsed.data.slice(startRow);
      console.log(`📋 Righe dati (partendo da riga ${startRow}): ${dataRows.length}`);

      // Mappiamo i dati alle colonne della tabella
      // Ordine colonne CSV: NOME VINO, ANNO, PRODUTTORE, PROVENIENZA, FORNITORE
      const winesFromCsv: WineRow[] = dataRows
        .filter(row => row && row[0] && row[0].trim()) // Solo righe con nome vino non vuoto
        .map((row, index) => {
          const mappedRow = {
            id: `csv-${categoria}-${index}`,
            nomeVino: row[0]?.trim() || '',        // Colonna 0: Nome Vino
            anno: row[1]?.trim() || '',            // Colonna 1: Anno  
            produttore: row[2]?.trim() || '',      // Colonna 2: Produttore
            provenienza: row[3]?.trim() || '',     // Colonna 3: Provenienza
            fornitore: row[4]?.trim() || '',       // Colonna 4: Fornitore
            giacenza: 0
          };

          // Debug delle prime righe mappate con maggior dettaglio
          if (index < 3) {
            console.log(`📊 Riga ${index + 1} mappata dettagliata:`, {
              tipologia: categoria,
              rawLength: row.length,
              rawData: row,
              mappedData: {
                nomeVino: mappedRow.nomeVino,
                anno: mappedRow.anno,
                produttore: mappedRow.produttore,
                provenienza: mappedRow.provenienza,
                fornitore: mappedRow.fornitore
              }
            });
          }

          return mappedRow;
        });

      // Aggiungi righe vuote per completare a 100
      const emptyRows = Array.from({ length: Math.max(0, 100 - winesFromCsv.length) }, (_, index) => ({
        id: `empty-${winesFromCsv.length + index}`,
        nomeVino: '',
        anno: '',
        produttore: '',
        provenienza: '',
        giacenza: 0,
        fornitore: ''
      }));

      const finalRows = [...winesFromCsv, ...emptyRows];
      setWineRows(finalRows);
      console.log(`📊 Tabella aggiornata: ${winesFromCsv.length} vini CSV + ${emptyRows.length} righe vuote`);

    } catch (error) {
      console.error(`❌ Errore nel caricamento CSV per ${categoria}:`, error);
      alert(`Errore nel caricamento dati per ${categoria}: ${error}`);
    }
  };

    // State for font size (in pixels) - dinamico per tablet
    const [fontSize, setFontSize] = useState<number>(() => {
      // Rileva se è tablet in landscape
      const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480 && window.innerHeight < window.innerWidth;
      return isTabletLandscape ? 12 : 14;
    });

    const getFontSizeStyle = () => {
        const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480;
        const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
        return { fontSize: `${adjustedSize}px` };
    };

  // Larghezze predefinite delle colonne (ottimizzate per tablet)
  const defaultColumnWidths = {
    '#': '3%',
    'nomeVino': '30%',
    'anno': '8%',
    'produttore': '25%',
    'provenienza': '20%',
    'fornitore': '18%',
    'giacenza': '6%',
    'azioni': '6%'
  };

  // Funzione per caricare larghezze salvate dal localStorage
  const loadSavedColumnWidths = () => {
    try {
      const saved = localStorage.getItem('winenode-column-widths');
      if (saved) {
        const parsedWidths = JSON.parse(saved);
        // Verifica che tutte le colonne necessarie siano presenti
        const hasAllColumns = Object.keys(defaultColumnWidths).every(key => 
          parsedWidths.hasOwnProperty(key)
        );
        if (hasAllColumns) {
          return parsedWidths;
        }
      }
    } catch (error) {
      console.warn('Errore nel caricamento larghezze colonne salvate:', error);
    }
    return defaultColumnWidths;
  };

  // Larghezze delle colonne con sistema di resize
  const [columnWidths, setColumnWidths] = useState(loadSavedColumnWidths);

  // Stati per il resize delle colonne
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Funzioni per il resize delle colonne
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    setStartX(e.clientX);
    setStartWidth(parseInt(columnWidths[columnKey as keyof typeof columnWidths]));
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(30, startWidth + deltaX); // Larghezza minima 30px

    const updatedWidths = {
      ...columnWidths,
      [resizingColumn]: `${newWidth}px`
    };

    setColumnWidths(updatedWidths);

    // Salva automaticamente nel localStorage
    try {
      localStorage.setItem('winenode-column-widths', JSON.stringify(updatedWidths));
    } catch (error) {
      console.warn('Errore nel salvataggio larghezze colonne:', error);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingColumn(null);
  };

  // Effect per gestire gli eventi globali del mouse
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, startX, startWidth, resizingColumn]);



  // Cleanup timeout su unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Listener per resize window - ottimizza font per tablet
  useEffect(() => {
    const handleResize = () => {
      const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480 && window.innerHeight < window.innerWidth;
      const newFontSize = isTabletLandscape ? 12 : 14;
      if (fontSize !== newFontSize) {
        setFontSize(newFontSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fontSize]);

  // Carica vini esistenti dal database
  useEffect(() => {
    console.log('📋 Sincronizzazione vini dal database:', existingWines?.length || 0);

    // Se abbiamo vini dal database, usa quelli
    if (existingWines && existingWines.length > 0) {
      // Trasforma i vini dal database al formato della tabella
      const winesFromDb = (existingWines || []).map((wine, index) => {
        return {
          id: `db-${wine.id}`,
          nomeVino: wine.name || '',
          anno: wine.vintage || '', // ✅ Ora wine.vintage contiene correttamente l'anno
          produttore: wine.description || '', // Nel db description contiene il produttore
          provenienza: wine.region || '',
          giacenza: wine.inventory || 0,
          fornitore: wine.supplier || ''
        };
      });

      // Aggiungi righe vuote per completare a 100
      const emptyRows = Array.from({ length: Math.max(0, 100 - winesFromDb.length) }, (_, index) => ({
        id: `row-${winesFromDb.length + index}`,
        nomeVino: '',
        anno: '',
        produttore: '',
        provenienza: '',
        giacenza: 0,
        fornitore: ''
      }));

      setWineRows([...winesFromDb, ...emptyRows]);
      console.log(`✅ Tabella sincronizzata: ${winesFromDb.length} vini dal DB + ${emptyRows.length} righe vuote`);
    } else {
      // Carica automaticamente CSV quando non ci sono vini dal DB
      if (csvUrls[activeTab as keyof typeof csvUrls]) {
        console.log(`🍾 Caricamento automatico CSV per ${activeTab}`);
        fetchAndParseCSV(csvUrls[activeTab as keyof typeof csvUrls], activeTab);
      }
    }
  }, [existingWines, activeTab]);







  // Funzioni per gestire gli archivi
  const handleAddTipologia = async () => {
    if (newItemName.trim()) {
      // Assegna automaticamente il colore predefinito se esiste
      const tipologiaName = newItemName.trim().toUpperCase();
      const defaultColor = defaultColors[tipologiaName] || selectedColor;

      const success = await addTipologiaToDb(tipologiaName, defaultColor);
      if (success) {
        setNewItemName('');
        setSelectedColor('neutro'); // Reset al colore predefinito
      } else {
        alert('Errore nell\'aggiunta della tipologia o tipologia già esistente');
      }
    }
  };

  const handleRemoveTipologia = async (tipologia: Tipologia) => {
    const success = await removeTipologiaFromDb(tipologia.id);
    if (!success) {
      alert('Errore nella rimozione della tipologia');
    }
  };

  const searchTipologie = () => {
    if (searchTerm.trim()) {
      const results = tipologie.filter(t => 
        t.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      // Inizializza editValue con la prima tipologia trovata
      if (results.length > 0) {
        setEditValue(results[0].nome);
      }
    } else {
      setSearchResults([]);
      setEditValue('');
    }
  };



  const handleEditTipologia = async (tipologia: Tipologia, newName: string) => {
    if (newName.trim() && (newName !== tipologia.nome || selectedColor !== tipologia.colore)) {
      const success = await updateTipologiaInDb(tipologia.id, newName.trim().toUpperCase(), selectedColor);
      if (success) {
        // Chiudi il modale dopo il salvataggio
        setShowTipologieModal(false);
        setNewItemName('');
        setSearchTerm('');
        setSearchResults([]);
        setEditingProducer(null);
        setEditValue('');
        setSelectedColor('neutro');
      } else {
        alert('Errore nella modifica della tipologia o nome già esistente');
      }
    }
  };



  // Handle row selection
  const handleRowClick = (index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: toggle selection
      setSelectedRows(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else if (event.shiftKey && selectedRows.length > 0) {
      // Shift + Click: select range
      const lastSelected = selectedRows[selectedRows.length - 1];
      const start = Math.min(lastSelected, index);
      const end = Math.max(lastSelected, index);
      const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedRows(range);
    } else {
      // Normal click: select single row
      setSelectedRows([index]);
    }
  };

  // Stato per debounce del salvataggio
  const [saveTimeouts, setSaveTimeouts] = useState(new Map<number, NodeJS.Timeout>());

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const updatedRows = [...wineRows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };

    setWineRows(updatedRows);

    // Debounce del salvataggio per questa riga specifica
    const currentTimeout = saveTimeouts.get(rowIndex);
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }

    const newTimeout = setTimeout(async () => {
      const rowData = updatedRows[rowIndex];

      // Salva solo se la riga ha almeno il nome del vino
      if (rowData.nomeVino && rowData.nomeVino.trim()) {
        try {
          await saveRowToDatabase(rowData, rowIndex);
          console.log(`✅ Riga ${rowIndex + 1} salvata automaticamente`);
        } catch (error) {
          console.error(`❌ Errore salvataggio riga ${rowIndex + 1}:`, error);
        }
      }
    }, 1000); // Aspetta 1 secondo dopo l'ultima modifica

    setSaveTimeouts(prev => new Map(prev.set(rowIndex, newTimeout)));
  };

  const addNewRow = () => {
    const newRow: WineRow = {
      id: `row-${Date.now()}`,
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      giacenza: 0,
      fornitore: ''
    };
    setWineRows(prev => [...prev, newRow]);
  };

  const handleInventoryClick = (rowIndex: number) => {
    setSelectedRowForInventory(rowIndex);
    setTempInventory(wineRows[rowIndex].giacenza);
    setShowInventoryModal(true);
  };

  const handleInventoryUpdate = (newInventory: number) => {
    if (selectedRowForInventory !== null) {
      setWineRows(prev => prev.map((row, index) => 
        index === selectedRowForInventory 
          ? { ...row, giacenza: newInventory }
          : row
      ));
    }
    setShowInventoryModal(false);
    setSelectedRowForInventory(null);
    setTempInventory(0);
  };

  const handleInventoryCancel = () => {
    setShowInventoryModal(false);
    setSelectedRowForInventory(null);
    setTempInventory(0);
  };

  const addRows = (count: number) => {
    const newRows: WineRow[] = Array.from({ length: count }, (_, index) => ({
      id: `row-${Date.now()}-${index}`,
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      giacenza: 0,
      fornitore: ''
    }));
    setWineRows(prev => [...prev, ...newRows]);
    setShowAddRowsPanel(false);
  };

  const removeEmptyRows = () => {
    const filledRows = wineRows.filter(row => {
      return row.nomeVino.trim() !== '' ||
             row.anno.trim() !== '' ||
             row.produttore.trim() !== '' ||
             row.provenienza.trim() !== '' ||
             row.fornitore.trim() !== '' ||
             row.giacenza > 0;
    });

    setWineRows(filledRows);
    setSelectedRows([]);
    setShowAddRowsPanel(false);

    const removedCount = wineRows.length - filledRows.length;
    if (removedCount > 0) {
      alert(`${removedCount} righe vuote eliminate`);
    } else {
      alert('Nessuna riga vuota trovata');
    }
  };

    const saveRowToDatabase = async (rowData: WineRow, rowIndex: number) => {
    try {
      if (!authManager.isAuthenticated() || !supabase) {
        throw new Error('Utente non autenticato o Supabase non disponibile');
      }

      const userId = authManager.getUserId();
      if (!userId) {
        throw new Error('ID utente non disponibile');
      }

      // Solo righe con nome vino vengono salvate
      if (!rowData.nomeVino || !rowData.nomeVino.trim()) {
        console.log(`⚠️ Riga ${rowIndex + 1}: nome vino vuoto, salvataggio saltato`);
        return;
      }

      const wineToSave = {
        user_id: userId,
        nome_vino: rowData.nomeVino.trim(),
        anno: rowData.anno || '',
        produttore: rowData.produttore || '',
        provenienza: rowData.provenienza || '',
        fornitore: rowData.fornitore || '',
        giacenza: rowData.giacenza || 0,
        updated_at: new Date().toISOString()
      };

      console.log(`💾 Salvando riga ${rowIndex + 1}:`, wineToSave);

      // Verifica se il vino esiste già (per update vs insert)
      if (rowData.id && rowData.id.startsWith('db-')) {
        // Update vino esistente
        const dbId = rowData.id.replace('db-', '');
        const { error } = await supabase
          .from('vini')
          .update(wineToSave)
          .eq('id', dbId)
          .eq('user_id', userId);

        if (error) {
          console.error('❌ Errore update:', error);
          throw error;
        }
        console.log(`✅ Vino aggiornato con ID ${dbId}`);
      } else {
        // Insert nuovo vino
        const { data, error } = await supabase
          .from('vini')
          .insert(wineToSave)
          .select()
          .single();

        if (error) {
          console.error('❌ Errore insert:', error);
          throw error;
        }

        // Aggiorna l'ID della riga con l'ID del database
        if (data) {
          const updatedRows = [...wineRows];
          updatedRows[rowIndex].id = `db-${data.id}`;
          setWineRows(updatedRows);
          console.log(`✅ Nuovo vino inserito con ID ${data.id}`);
        }
      }

      // Ricarica i vini per sincronizzare
      await refreshWines();

    } catch (error) {
      console.error(`❌ Errore nel salvataggio riga ${rowIndex + 1}:`, error);
      throw error;
    }
  };

    const handleDeleteRow = async (index: number) => {
        // Controlla se la riga cliccata è tra quelle selezionate e se ci sono più righe selezionate
        const isRowSelected = selectedRows.includes(index);
        const hasMultipleSelections = selectedRows.length > 1;

        if (isRowSelected && hasMultipleSelections) {
            // Scenario: eliminazione righe multiple
            const rowNumbers = [...selectedRows].sort((a, b) => a - b).map(i => i + 1);
            const confirmMessage = `Confermi l'eliminazione delle righe ${rowNumbers.join(', ')}?`;

            if (window.confirm(confirmMessage)) {
                try {
                    // Elimina da Supabase solo le righe che hanno ID dal database
                    const rowsToDelete = selectedRows.map(i => wineRows[i]).filter(row => row.id.startsWith('db-'));

                    if (rowsToDelete.length > 0) {
                        const userId = authManager.getUserId();
                        if (!userId) {
                            throw new Error('ID utente non disponibile');
                        }

                        for (const row of rowsToDelete) {
                            const dbId = row.id.replace('db-', '');
                            const { error } = await supabase
                                .from('vini')
                                .delete()
                                .eq('id', dbId)
                                .eq('user_id', userId);

                            if (error) {
                                console.error(`❌ Errore eliminazione vino ID ${dbId}:`, error);
                                throw error;
                            }
                            console.log(`✅ Vino eliminato da Supabase ID ${dbId}`);
                        }
                    }

                    // Pulisci i timeout delle righe eliminate
                    selectedRows.forEach(rowIndex => {
                        const timeout = saveTimeouts.get(rowIndex);
                        if (timeout) {
                            clearTimeout(timeout);
                            setSaveTimeouts(prev => {
                                const newMap = new Map(prev);
                                newMap.delete(rowIndex);
                                return newMap;
                            });
                        }
                    });

                    // Elimina tutte le righe selezionate dallo stato locale
                    setWineRows(prev => {
                        return prev.filter((_, i) => !selectedRows.includes(i));
                    });

                    // Resetta le selezioni
                    setSelectedRows([]);

                    // Ricarica i vini dal database per sincronizzazione
                    await refreshWines();
                    console.log(`✅ ${rowsToDelete.length} vini eliminati da Supabase, ${selectedRows.length} righe rimosse dalla tabella`);

                } catch (error) {
                    console.error('❌ Errore nell\'eliminazione:', error);
                    alert('Errore nell\'eliminazione dei vini dal database');
                }
            }
        } else {
            // Scenario: eliminazione riga singola
            const confirmMessage = `Confermi l'eliminazione della riga ${index + 1}?`;

            if (window.confirm(confirmMessage)) {
                try {
                    const rowToDelete = wineRows[index];

                    // Elimina da Supabase solo se la riga ha un ID dal database
                    if (rowToDelete.id.startsWith('db-')) {
                        const userId = authManager.getUserId();
                        if (!userId) {
                            throw new Error('ID utente non disponibile');
                        }

                        const dbId = rowToDelete.id.replace('db-', '');
                        const { error } = await supabase
                            .from('vini')
                            .delete()
                            .eq('id', dbId)
                            .eq('user_id', userId);

                        if (error) {
                            console.error(`❌ Errore eliminazione vino ID ${dbId}:`, error);
                            throw error;
                        }
                        console.log(`✅ Vino eliminato da Supabase ID ${dbId}`);
                    }

                    // Pulisci il timeout della riga eliminata
                    const timeout = saveTimeouts.get(index);
                    if (timeout) {
                        clearTimeout(timeout);
                        setSaveTimeouts(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(index);
                            return newMap;
                        });
                    }

                    // Elimina solo la riga specifica dallo stato locale
                    setWineRows(prev => {
                        return prev.filter((_, i) => i !== index);
                    });

                    // Aggiorna gli indici selezionati
                    setSelectedRows(prev => 
                        prev
                            .filter(i => i !== index) // Rimuovi l'indice eliminato
                            .map(i => i > index ? i - 1 : i) // Aggiusta gli indici maggiori
                    );

                    // Ricarica i vini dal database per sincronizzazione
                    await refreshWines();
                    console.log(`✅ Riga ${index + 1} eliminata e tabella sincronizzata`);

                } catch (error) {
                    console.error('❌ Errore nell\'eliminazione:', error);
                    alert('Errore nell\'eliminazione del vino dal database');
                }
            }
        }
    };

  // Funzione per ottenere i dati della tipologia da types (useWines)
  const getTypeData = (typeName: string) => types.find(t => t.nome === typeName);

  // Funzione per ottenere il colore della tipologia
  const getTipologiaColore = (tipologiaNome: string) => {
    // Prima prova con types dall'hook useWines
    const typeData = getTypeData(tipologiaNome);
    if (typeData?.colore) {
      return typeData.colore;
    }

    // Fallback su tipologie dall'hook useTipologie
    const selectedTipologia = tipologie.find(tip => tip.nome === tipologiaNome);
    return selectedTipologia?.colore || '#cccccc';
  };

    // Calcola lineHeight e altezza riga basate su fontSize
    const lineHeight = fontSize * 1.2;
    const rowHeight = fontSize * 2.5;

  return (
    <div
      className="h-[95vh] flex flex-col"
      style={{
        background:
          "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna alle impostazioni"
              style={{
                filter: "brightness(1.3)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
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
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <img
              src="/logo 2 CCV.png"
              alt="WINENODE"
              className="h-24 w-auto object-contain"
            />

            <div className="flex items-center gap-4">
              {/* Pulsante Home */}
              <button
                onClick={() => navigate("/")}
                className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
                title="Vai alla home"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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

        {/* Action Buttons Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center justify-center flex-wrap">
              <button
                onClick={() => console.log('Filtra')}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtra
              </button>

              

              <button
                onClick={() => console.log('Cerca')}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cerca
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFontSize(prevSize => Math.max(10, prevSize - 5));
                    }}
                    className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-md transition-all text-sm font-bold"
                    disabled={fontSize <= 10}
                    style={{ opacity: fontSize <= 10 ? 0.5 : 1 }}
                  >
                    -
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] transition-all text-sm font-medium rounded-md"
                    style={{ cursor: 'default' }}
                  >
                    Aa
                  </button>
                  <button
                    onClick={() => {
                      setFontSize(prevSize => Math.min(24, prevSize + 5));
                    }}
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
                onClick={() => console.log('Esporta')}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Esporta
              </button>

              <button
                onClick={() => {
                  // Funzione di backup - esporta tutti i dati
                  const backupData = {
                    timestamp: new Date().toISOString(),
                    vini: wineRows.filter(row => 
                      row.nomeVino.trim() || row.produttore.trim()
                    ),
                    tipologie: tipologie,
                    fornitori: suppliers,

                  };

                  const dataStr = JSON.stringify(backupData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `winenode-backup-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  alert('Backup creato e scaricato con successo!');
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Backup
              </button>

              



              
            </div>
          </div>
        </div>

        {/* Wine Category Tabs */}
        <div className="bg-black/30 border-b border-red-900/30 px-4 py-4">
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-center flex-wrap gap-2">
              {[
                'BOLLICINE ITALIANE',
                'BOLLICINE FRANCESI', 
                'BIANCHI',
                'ROSSI',
                'ROSATI',
                'VINI DOLCI'
              ].map((category, index) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveTab(category);
                    // Carica automaticamente i dati CSV se disponibili
                    if (csvUrls[category as keyof typeof csvUrls]) {
                      fetchAndParseCSV(csvUrls[category as keyof typeof csvUrls], category);
                    }
                  }}
                  className={`px-6 py-3 font-semibold text-sm rounded-lg transition-all duration-200 border-2 ${
                    activeTab === category
                      ? 'bg-amber-700 text-cream border-amber-500 shadow-lg'
                      : 'bg-brown-800/60 text-cream/80 border-brown-600/40 hover:bg-brown-700/70 hover:border-brown-500/60'
                  }`}
                  style={{
                    backgroundColor: activeTab === category ? '#b45309' : '#5d2f0a80',
                    borderColor: activeTab === category ? '#f59e0b' : '#8b4513aa'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wine Table */}
        <div className="rounded-lg shadow-2xl border border-amber-900 overflow-hidden flex-1 min-h-0" style={{ backgroundColor: '#8B4513' }}>
          <div className="h-full overflow-x-hidden overflow-y-auto">
            <table className="w-full table-fixed" style={{ borderCollapse: 'collapse' }}>
              <thead className="sticky top-0 z-30 shadow-lg" style={{ backgroundColor: '#3b1d1d' }}>
                <tr style={{ fontSize: `${fontSize}px`, lineHeight: `${lineHeight}px`, height: `${rowHeight}px` }}>
                  <th className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm" style={{ width: columnWidths['#'] }}>
                  </th>

                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['nomeVino'] }}>
                    Nome Vino
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'nomeVino')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['anno'] }}>
                    Anno
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'anno')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['produttore'] }}>
                    Produttore
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'produttore')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['provenienza'] }}>
                    Provenienza
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'provenienza')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['fornitore'] }}>
                    <span>Fornitore</span>
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'fornitore')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['giacenza'] }}>
                    GIACENZA
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'giacenza')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm" style={{ width: columnWidths['azioni'] }}>
                  </th>
                </tr>
              </thead>
              <tbody>
                {wineRows.map((row, index) => {
                  const isSelected = selectedRows.includes(index);
                  const rowStyle = {
                    backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6',
                    borderWidth: isSelected ? '2px' : '1px',
                    borderColor: isSelected ? '#D97706' : '#92400e'
                  };

                  return (
                  <tr 
                    key={row.id}
                    onClick={(e) => handleRowClick(index, e)}
                    className="cursor-pointer transition-all duration-200 hover:bg-opacity-80"
                    style={rowStyle}
                  >
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['#'] }}>
                      <div className="w-full px-2 py-2 text-center text-gray-600 font-medium select-none flex items-center justify-center" style={{ fontSize: `${fontSize * 0.7}px`, userSelect: 'none', height: '40px' }}>
                        {index + 1}
                      </div>
                    </td>

                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['nomeVino'] }}>
                      <div
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {row.nomeVino}
                      </div>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['anno'] }}>
                      <div
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {row.anno}
                      </div>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['produttore'] }}>
                      <div
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {row.produttore}
                      </div>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['provenienza'] }}>
                      <div
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {row.provenienza}
                      </div>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['fornitore'] }}>
                      <input
                        type="text"
                        value={row.fornitore}
                        onChange={(e) => handleCellChange(index, 'fornitore', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      />
                    </td>
                    <td className="border border-amber-900 p-0 group" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['giacenza'] }}>
                      <div className="relative flex items-center justify-center h-full">
                        {/* Pulsante meno - visibile solo al hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValue = Math.max(0, row.giacenza - 1);
                            handleCellChange(index, 'giacenza', newValue.toString());
                          }}
                          className="absolute left-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm"
                          style={{ fontSize: '10px' }}
                          title="Diminuisci giacenza"
                        >
                          -
                        </button>

                        {/* Valore giacenza cliccabile */}
                        <button
                          onClick={() => handleInventoryClick(index)}
                          className="px-1 py-2 text-center text-gray-600 font-bold hover:bg-amber-200 transition-colors select-none flex-1"
                          style={{ fontSize: `${fontSize}px`, userSelect: 'none', height: '40px', lineHeight: 'normal' }}
                        >
                          {row.giacenza}
                        </button>

                        {/* Pulsante più - visibile solo al hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValue = Number(row.giacenza) + 1;
                            handleCellChange(index, 'giacenza', newValue.toString());
                          }}
                          className="absolute right-1 w-4 h-4 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-sm"
                          style={{ fontSize: '10px' }}
                          title="Aumenta giacenza"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['azioni'] }}>
                      <div className="flex items-center justify-center gap-2 h-full" style={{ height: '40px' }}>
                        {/* Colonna Azioni vuota */}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>

            {/* Pulsante Aggiungi sotto la tabella - FISSO E SEMPRE VISIBILE */}
            <div className="sticky bottom-0 z-40 bg-[#8B4513] border-t-2 border-amber-900 shadow-lg">
              <button
                onClick={addNewRow}
                className="w-full border border-amber-900 p-3 text-white font-medium hover:bg-amber-200 transition-colors"
                style={{ 
                  backgroundColor: '#2d0505',
                  fontSize: `${fontSize}px`,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Aggiungi
              </button>
            </div>
          </div>
        </div>

        {/* Add Rows Panel */}
        {showAddRowsPanel && (
          <div className="mt-4 p-4 bg-gray-800 rounded-md shadow-md">
            <h3 className="text-lg font-semibold text-white mb-2">Aggiungi Righe</h3>
            <div className="flex items-center justify-center">
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

      {/* Footer vuoto */}
      <footer className="border-t border-red-900/30 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            {/* Footer vuoto - pulsante rimosso */}
          </div>
        </div>
      </footer>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Modifica Giacenza</h2>
            <input
              type="number"
              value={tempInventory}
              onChange={(e) => setTempInventory(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={handleInventoryCancel}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleInventoryUpdate(tempInventory)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tipologie Modal */}
      {showTipologieModal && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Gestisci Tipologie</h2>

            {/* Add New Tipologia */}
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
                  {availableColors.map(c => (
                    <option key={c.color} value={c.color}>{c.name}</option>
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

            {/* Edit Existing Tipologia */}
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Modifica Tipologia Esistente</h3>
              <div className="flex items-center gap-2">
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
              </div>

              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map((tipologia) => (
                    <li key={tipologia.id} className="flex items-center justify-between py-2 border-b">
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
                          {availableColors.map(c => (
                            <option key={c.color} value={c.color}>{c.name}</option>
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

            {/* Close Button */}
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