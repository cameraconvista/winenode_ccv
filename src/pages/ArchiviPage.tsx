import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useWines } from '../hooks/useWines';
import { useSuppliers } from '../hooks/useSuppliers';
import { useTipologie } from '../hooks/useTipologie';
import { useAnno } from '../hooks/useAnno';
import { supabase, authManager } from '../lib/supabase';
import ImportaVini from "../components/ImportaVini";
import AddSupplierModal from "../components/AddSupplierModal";

interface WineRow {
  id: string;
  tipologia: string;
  nomeVino: string;
  anno: string;
  produttore: string;
  provenienza: string;
  costo: string;
  vendita: string;
  margine: string;
  giacenza: number;
  fornitore: string;
}

export default function ArchiviPage() {
  const navigate = useNavigate();
  const { wines: existingWines, types, refreshWines } = useWines();
  const { suppliers, isLoading, error, refreshSuppliers, addSupplier: addSupplierHook } = useSuppliers();
  const { tipologie, loading, addTipologia: addTipologiaToDb, removeTipologia: removeTipologiaFromDb, updateTipologia: updateTipologiaInDb } = useTipologie();
  const { anni, loading: loadingAnni } = useAnno();

  // Initialize 100 empty rows
  const [wineRows, setWineRows] = useState<WineRow[]>(() => 
    Array.from({ length: 100 }, (_, index) => ({
      id: `row-${index}`,
      tipologia: '',
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
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

  const fornitori = suppliers.map(s => s.nome);

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

        // 3. Test query diretta fornitori
        try {
          const { data: fornitoriTest, error: fornError } = await supabase
            .from('fornitori')
            .select('*')
            .eq('user_id', userId);

          console.log('📦 Query diretta fornitori:');
          console.log('  - Risultati:', fornitoriTest?.length || 0);
          console.log('  - Errore:', fornError?.message || 'Nessuno');
          console.log('  - Dati:', fornitoriTest);
        } catch (err) {
          console.error('❌ Errore query fornitori:', err);
        }
      }

      // 4. Stato hooks
      console.log('📊 Hook tipologie:', {
        count: tipologie.length,
        loading: loading,
        data: tipologie
      });

      console.log('📦 Hook fornitori:', {
        count: suppliers.length,
        loading: isLoading,
        error: error,
        data: suppliers
      });

      console.log('🔍 === FINE DEBUG ARCHIVI ===');
    };

    debugAuth();
  }, [tipologie, suppliers, loading, isLoading, error]);

  // Stati per i modali di gestione archivi
  const [showTipologieModal, setShowTipologieModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Stati per il modal produttori
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tipologia[]>([]);
  const [editingProducer, setEditingProducer] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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
    '#': '4%',
    'tipologia': '14%',
    'nomeVino': '20%',
    'anno': '6%',
    'produttore': '16%',
    'provenienza': '12%',
    'fornitore': '11%',
    'costo': '6%',
    'vendita': '6%',
    'margine': '10%',
    'giacenza': '4%',
    'azioni': '5%'
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

    // Trasforma i vini dal database al formato della tabella
    const winesFromDb = (existingWines || []).map((wine, index) => {
      // Estrai costo e prezzo dal database se disponibili
      const costo = (wine as any).costo || 0;
      const prezzo = parseFloat(wine.price) || 0;

      // Calcola margine se entrambi i valori sono disponibili
      let margine = '';
      if (costo > 0 || prezzo > 0) {
        const margineCalcolato = prezzo - costo;
        let percentuale = '';
        if (costo > 0) {
          const percentualeCalcolata = (margineCalcolato / costo) * 100;
          percentuale = ` (${percentualeCalcolata.toFixed(1)}%)`;
        }
        margine = `${margineCalcolato.toFixed(2)}${percentuale}`;
      }

      return {
        id: `db-${wine.id}`,
        tipologia: wine.type || '',
        nomeVino: wine.name || '',
        anno: wine.vintage || '', // ✅ Ora wine.vintage contiene correttamente l'anno
        produttore: wine.description || '', // Nel db description contiene il produttore
        provenienza: wine.region || '',
        costo: costo > 0 ? costo.toString() : '', // Converti costo in stringa per la visualizzazione
        vendita: wine.price || '',
        margine: margine,
        giacenza: wine.inventory || 0,
        fornitore: wine.supplier || ''
      };
    });

    // Aggiungi righe vuote per completare a 100
    const emptyRows = Array.from({ length: Math.max(0, 100 - winesFromDb.length) }, (_, index) => ({
      id: `row-${winesFromDb.length + index}`,
      tipologia: '',
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      giacenza: 0,
      fornitore: ''
    }));

    setWineRows([...winesFromDb, ...emptyRows]);
    console.log(`✅ Tabella sincronizzata: ${winesFromDb.length} vini dal DB + ${emptyRows.length} righe vuote`);
  }, [existingWines]);







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

    // Calcola margini se vengono modificati costo o vendita
    if (field === 'costo' || field === 'vendita') {
      const costo = parseFloat(field === 'costo' ? value : updatedRows[rowIndex].costo) || 0;
      const vendita = parseFloat(field === 'vendita' ? value : updatedRows[rowIndex].vendita) || 0;

      if (costo > 0 || vendita > 0) {
        const margineEuro = vendita - costo;
        let margineDisplay = margineEuro.toFixed(2);

        if (costo > 0) {
          const marginePercentuale = (margineEuro / costo) * 100;
          margineDisplay += ` (${marginePercentuale.toFixed(1)}%)`;
        }

        updatedRows[rowIndex].margine = margineDisplay;
      }
    }

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
      tipologia: '',
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
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
      tipologia: '',
      nomeVino: '',
      anno: '',
      produttore: '',
      provenienza: '',
      costo: '',
      vendita: '',
      margine: '',
      giacenza: 0,
      fornitore: ''
    }));
    setWineRows(prev => [...prev, ...newRows]);
    setShowAddRowsPanel(false);
  };

  const removeEmptyRows = () => {
    const filledRows = wineRows.filter(row => {
      return row.tipologia.trim() !== '' ||
             row.nomeVino.trim() !== '' ||
             row.anno.trim() !== '' ||
             row.produttore.trim() !== '' ||
             row.provenienza.trim() !== '' ||
             row.fornitore.trim() !== '' ||
             row.costo.trim() !== '' ||
             row.vendita.trim() !== '' ||
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
        tipologia: rowData.tipologia || '',
        anno: rowData.anno || '',
        produttore: rowData.produttore || '',
        provenienza: rowData.provenienza || '',
        fornitore: rowData.fornitore || '',
        costo: parseFloat(rowData.costo) || 0,
        prezzo_vendita: parseFloat(rowData.vendita) || 0,
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
            <div className="flex items-center gap-3 flex-wrap">
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
                onClick={() => console.log('Filtra')}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtra
              </button>

              <button
                onClick={() => console.log('Visualizza')}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Visualizza
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
                <button
                  onClick={() => navigate('/settings/archivi/importa')}
                  className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #8B5A96 0%, #6B46C1 50%, #7C3AED 100%)',
                    border: '1px solid #A855F7',
                    color: '#F3E8FF'
                  }}
                >
                  <span className="text-yellow-300">✨</span>
                  <span className="font-bold text-white">AI</span>
                  <span className="font-medium">IMPORTA</span>
                </button>

                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setFontSize(prevSize => Math.max(10, prevSize - 5));
                    }}
                    className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-l-lg transition-all text-sm font-bold"
                    disabled={fontSize <= 10}
                    style={{ opacity: fontSize <= 10 ? 0.5 : 1 }}
                  >
                    -
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] transition-all text-sm font-medium border-l border-r border-gray-500"
                    style={{ cursor: 'default' }}
                  >
                    Aa
                  </button>
                  <button
                    onClick={() => {
                      setFontSize(prevSize => Math.min(24, prevSize + 5));
                    }}
                    className="flex items-center justify-center px-2 py-2 bg-[#3A1E18] hover:border-[#A97B50] hover:shadow-md text-[#F5EEDC] rounded-r-lg transition-all text-sm font-bold"
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
                onClick={() => {
                  // Funzione di backup - esporta tutti i dati
                  const backupData = {
                    timestamp: new Date().toISOString(),
                    vini: wineRows.filter(row => 
                      row.nomeVino.trim() || row.produttore.trim() || row.tipologia
                    ),
                    tipologie: tipologie,
                    produttori: produttori,
                    fornitori: suppliers
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

              <button
                onClick={() => {
                  if (confirm('Vuoi ripristinare le larghezze predefinite delle colonne?')) {
                    setColumnWidths(defaultColumnWidths);
                    localStorage.removeItem('winenode-column-widths');
                    alert('Larghezze colonne ripristinate ai valori predefiniti');
                  }
                }}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
                title="Ripristina larghezze predefinite colonne"
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
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0"/>
                  <rect x="8" y="5" width="8" height="4"/>
                </svg>
                Reset Colonne
              </button>



              <button
                onClick={() => {
                  if (confirm('Sei sicuro di voler resettare tutti i dati?')) {
                    setWineRows(Array.from({ length: 100 }, (_, index) => ({
                      id: `row-${index}`,
                      tipologia: '',
                      nomeVino: '',
                      produttore: '',
                      provenienza: '',
                      costo: '',
                      vendita: '',
                      margine: '',
                      giacenza: 0,
                      fornitore: ''
                    })));
                  }
                }}
                className="flex items-center gap-2 bg-[#3A1E18] text-[#F5EEDC] rounded-md px-3 py-2 text-sm shadow-sm hover:border-[#A97B50] hover:shadow-md transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Dati
              </button>
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
                    #
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['tipologia'] }}>
                    <span>Tipologia</span>
                    <button
                      onClick={() => setShowTipologieModal(true)}
                      className="absolute top-1/2 right-6 w-4 h-4 flex items-center justify-center text-yellow-600 hover:text-white hover:bg-amber-600/30 rounded transition-all duration-200 hover:scale-110 transform -translate-y-1/2"
                      title="Gestisci tipologie"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'tipologia')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
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
                    <button
                      onClick={() => setShowAddSupplierModal(true)}
                      className="absolute top-1/2 right-6 w-4 h-4 flex items-center justify-center text-yellow-600 hover:text-white hover:bg-amber-600/30 rounded transition-all duration-200 hover:scale-110 transform -translate-y-1/2"
                      title="Aggiungi nuovo fornitore"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
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
                  <th className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['costo'] }}>
                    Costo €
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'costo')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['vendita'] }}>
                    Vendita €
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'vendita')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['margine'] }}>
                    Margine
                    {/* Handle di resize */}
                    <div
                      className="absolute top-0 right-0 w-2 h-full cursor-col-resize group-hover:bg-amber-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onMouseDown={(e) => handleMouseDown(e, 'margine')}
                      title="Ridimensiona colonna"
                    >
                      <div className="flex space-x-0.5">
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                        <div className="w-0.5 h-4 bg-amber-600"></div>
                      </div>
                    </div>
                  </th>
                  <th className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 border-r-2 border-r-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm relative group" style={{ width: columnWidths['giacenza'] }}>
                    N°
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
                    Azioni
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
                    {/* Tipologia */}
                  <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['tipologia'] }}>
                    <select
                      value={row.tipologia}
                      onChange={(e) => handleCellChange(index, 'tipologia', e.target.value)}
                      className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                      style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Caricamento...' : '....'}</option>
                      {tipologie.map(tip => (
                        <option key={tip.nome} value={tip.nome}>
                          {tip.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['nomeVino'] }}>
                      <input
                        type="text"
                        value={row.nomeVino}
                        onChange={(e) => handleCellChange(index, 'nomeVino', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      />
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', width: columnWidths['anno'] }}>
                      <select
                        value={row.anno}
                        onChange={(e) => handleCellChange(index, 'anno', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#F5F0E6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                        disabled={loadingAnni}
                      >
                        <option value="">{loadingAnni ? 'Caricando...' : '...."'}</option>
                        {anni.map(annoObj => (
                          <option key={annoObj.anno} value={annoObj.anno}>
                            {annoObj.anno}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['produttore'] }}>
                      <input
                        type="text"
                        value={row.produttore}
                        onChange={(e) => handleCellChange(index, 'produttore', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      />
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['provenienza'] }}>
                      <input
                        type="text"
                        value={row.provenienza}
                        onChange={(e) => handleCellChange(index, 'provenienza', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      />
                    </td>
                    <td className="border border-amber-900 p-0" style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', width: columnWidths['fornitore'] }}>
                      <select
                        value={row.fornitore}
                        onChange={(e) => handleCellChange(index, 'fornitore', e.target.value)}
                        className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 focus:bg-white focus:shadow-inner text-center select-none"
                        style={{ backgroundColor: isSelected ? '#E6D7B8' : '#f5f0e6', userSelect: 'none', ...getFontSizeStyle(), height: '40px', lineHeight: 'normal' }}
                      >
                        <option value="">....</option>