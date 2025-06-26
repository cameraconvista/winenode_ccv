import { useEffect, useState } from "react";
import { Sparkles, Upload, RotateCcw, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useSuppliers } from "../hooks/useSuppliers";
import { useWines } from "../hooks/useWines";
import AddSupplierModal from "../components/AddSupplierModal";

function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });
  }, []);

  return user;
}

export default function ManualWineInsertPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { suppliers, isLoading: loadingSuppliers, refreshSuppliers } = useSuppliers();
  const { refreshWines } = useWines();

  // Stati per i dropdown - ora con valori persistenti
  const [categoria, setCategoria] = useState("");
  const [fornitore, setFornitore] = useState("");
  const [sogliaMinima, setSogliaMinima] = useState("2");
  const [giacenza, setGiacenza] = useState("0");

  // Stato per tracciare le selezioni dell'utente
  const [selectedTipologia, setSelectedTipologia] = useState("");
  const [selectedFornitore, setSelectedFornitore] = useState("");
  const [testo, setTesto] = useState("");
  const [righeRiconosciute, setRigheRiconosciute] = useState(0);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'add' | 'replace' | null>(null);

  function parseWineText(inputText: string): string[] {
    // Pulisce caratteri invisibili e sostituisce con newline standard
    const cleanText = inputText
      .replace(/[\u2028\r]/g, '\n')     // converte \u2028 e \r in newline classico
      .replace(/\n{2,}/g, '\n')         // rimuove righe vuote multiple

    // Divide per righe e rimuove righe vuote
    return cleanText.split('\n').map(line => line.trim()).filter(line => line !== '');
  }

  function ottimizzaTesto() {
    let testoOriginale = testo;

    // 1. Identifica tutti i prezzi nel testo per usarli come separatori
    const patternPrezzi = /(\s*[-–]?\s*\d{1,3}\s*€|\s*\d{1,3}\s*euro)/gi;

    // 2. Dividi il testo usando i prezzi come separatori naturali
    let segmenti = testoOriginale.split(patternPrezzi);

    // 3. Ricostruisci i vini: ogni vino è formato da testo + prezzo
    const viniCompleti = [];
    for (let i = 0; i < segmenti.length - 1; i += 2) {
      const testoVino = segmenti[i];
      const prezzo = segmenti[i + 1];

      if (testoVino && prezzo) {
        // Combina testo + prezzo per identificare la fine del vino
        const vinoCompleto = testoVino.trim();
        if (vinoCompleto.length > 3) {
          viniCompleti.push(vinoCompleto);
        }
      }
    }

    // Se non ci sono prezzi, usa la nuova funzione per processare il testo
    if (viniCompleti.length === 0) {
      const righeAlternative = parseWineText(testoOriginale);
      viniCompleti.push(...righeAlternative.filter(riga => riga.length > 3));
    }

    // 4. Pulisci ogni vino rimuovendo simboli non ammessi (mantieni solo ", ,, (, ))
    const viniPuliti = viniCompleti.map(vino => {
      return vino
        .replace(/[\u200B-\u200D\uFEFF\u00A0\u2028\u2029]/g, " ")  // Caratteri invisibili
        .replace(/[€–""''…•·]/g, "")  // Simboli speciali non ammessi
        .replace(/\s*[-–]?\s*\d{1,3}\s*€/gi, "")  // Rimuovi prezzi rimanenti
        .replace(/\s*\d{1,3}\s*euro/gi, "")       // Rimuovi prezzi rimanenti
        .replace(/\s+/g, " ")  // Normalizza spazi
        .trim();
    }).filter(vino => vino.length > 3);

    // 5. Aggiorna textarea e contatore
    const risultatoFinale = viniPuliti.join('\n');
    setTesto(risultatoFinale);
    setRigheRiconosciute(viniPuliti.length);

    // Aggiorna il contatore nel DOM
    const countElement = document.getElementById("count-righe");
    if (countElement) {
      countElement.textContent = `${viniPuliti.length}`;
    }
  }

  async function aggiungiCategoria() {
    if (!newCategoryName.trim()) return;

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        return toast.error("Devi essere loggato per aggiungere categorie.");
      }

      const { error } = await supabase
        .from("categorie")
        .insert({
          user_id: userData.user.id,
          nome: newCategoryName.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(error);
        toast.error("Errore nell'aggiunta della categoria.");
      } else {
        setCategoria(newCategoryName.trim());
        toast.success("Categoria aggiunta con successo!");
        setNewCategoryName("");
        setShowAddCategoryModal(false);
      }
    } catch (error) {
      console.error("Errore:", error);
      toast.error("Errore durante l'aggiunta della categoria.");
    }
  }

  const handleSupplierAdded = () => {
    // Ricarica la lista fornitori
    refreshSuppliers();
    // Chiudi il modal
    setShowAddSupplierModal(false);
  };

  function richiediConferma(sostituisci: boolean) {
    // 1. Controlla che sia stato selezionato un tipo di vino
    if (!selectedTipologia || selectedTipologia === "") {
      setShowErrorMessage(true);
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setShowErrorMessage(false);
      }, 5000);
      return;
    }

    // 2. Mostra modal di conferma
    setConfirmAction(sostituisci ? 'replace' : 'add');
    setShowConfirmModal(true);
  }

  async function salvaVini(sostituisci: boolean) {

    // 2. Ottieni il valore del textarea
    const testoVini = document.getElementById("elenco-vini")?.value || testo;

    // 3. Usa parseWineText per processare correttamente il testo
    const lista = parseWineText(testoVini);

    if (lista.length === 0) return toast.warning("Nessun vino da salvare.");

    try {
      // 3. Usa supabase.auth.getUser() per ottenere l'ID utente
      const { data: userData, error: authError } = await supabase.auth.getUser();

      if (authError || !userData.user) {
        return toast.error("Devi essere loggato per salvare.");
      }

      const userId = userData.user.id;

      // 4. Se sostituisci === true, cancella i vecchi vini dell'utente in quella categoria
      if (sostituisci) {
        const { error: deleteError } = await supabase
          .from("giacenze")
          .delete()
          .eq("user_id", userId)
          .eq("type", categoria.toLowerCase());

        if (deleteError) {
          console.error(deleteError);
          return toast.error("Errore nella cancellazione dei vini esistenti.");
        }
      }

      // 5. Inserisci nel database i nuovi vini nella tabella giacenze
      const daSalvare = lista.map((nomeVino) => ({
        name: nomeVino,
        type: categoria.toLowerCase(),
        supplier: fornitore || "Da definire",
        inventory: parseInt(giacenza) || 0,
        min_stock: parseInt(sogliaMinima) || 2,
        price: 0,
        vintage: null,
        region: null,
        description: null,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from("giacenze")
        .insert(daSalvare);

      if (insertError) {
        console.error(insertError);
        toast.error("Errore nel salvataggio dei vini.");
      } else {
        // Mostra messaggio di successo
        setShowSuccessMessage(true);
        // Nascondi il messaggio dopo 5 secondi
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);

        // Refresh della lista vini per aggiornarla nell'homepage
        await refreshWines();

        // Reset completo dei campi dopo il salvataggio
        setTesto("");
        setRigheRiconosciute(0);
        setSelectedTipologia("");
        setSelectedFornitore("");
        setCategoria("");
        setFornitore("");

        // Aggiorna anche il contatore nel DOM
        const countElement = document.getElementById("count-righe");
        if (countElement) {
          countElement.textContent = "0";
        }
      }

    } catch (error) {
      console.error("Errore generale:", error);
      toast.error("Errore durante il salvataggio.");
    }
  }

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => navigate('/settings/archivi')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-105"
              title="Torna alla pagina archivi"
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
                className="h-32 w-auto object-contain" 
              />
            <button
              onClick={() => navigate("/")}
              className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
              title="Vai alla home"
              style={{
                filter: "brightness(1.2)",
                color: "#ffffff"
              }}
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenuto principale */}
      <div 
        className="max-w-xl mx-auto"
        style={{ 
          padding: "20px"
        }}
      >
        {/* Titolo principale */}
        <h1 className="text-2xl font-bold text-center text-cream mb-6">
          INSERISCI LISTA VINI
        </h1>



        <div className="mb-2">
          <div className="text-sm text-gray-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Incolla qui dentro la lista vini e clicca qui</span>
              <button
                onClick={ottimizzaTesto}
                className="text-yellow-500 hover:text-yellow-600 inline-flex items-center"
                title="Ottimizza testo"
              >
                <svg 
                  className="w-6 h-6" 
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <g>
                    {/* Stella grande centrale */}
                    <path 
                      d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" 
                      fill="#FFD700" 
                      stroke="#FFA500" 
                      strokeWidth="0.5"
                    />
                    {/* Stella piccola in alto a destra */}
                    <path 
                      d="M18 5L18.5 6.5L20 7L18.5 7.5L18 9L17.5 7.5L16 7L17.5 6.5L18 5Z" 
                      fill="#FFD700"
                    />
                    {/* Stella piccola in basso a sinistra */}
                    <path 
                      d="M6 18L6.5 19.5L8 20L6.5 20.5L6 22L5.5 20.5L4 20L5.5 19.5L6 18Z" 
                      fill="#FFD700"
                    />
                  </g>
                </svg>
                <span className="text-white font-bold">AI</span>
              </button>
            </div>
            <div id="count-righe" className="text-green-400 text-sm mr-4">
              {righeRiconosciute}
            </div>
          </div>
        </div>

        <div className="relative mb-4">
          <textarea
            id="elenco-vini"
            rows={10}
            placeholder="Es: Soave Classico DOC Inama, Veneto"
            className="text-sm border border-[#4a2a2a]"
            style={{
              borderRadius: "12px",
              padding: "12px",
              backgroundColor: "rgba(50, 0, 0, 0.6)",
              color: "white",
              width: "100%"
            }}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
          />
        </div>

        <div className="mb-4">
          {/* Messaggio di errore */}
          {showErrorMessage && (
            <div className="mb-3 p-3 rounded-lg border border-yellow-500 bg-yellow-500/10">
              <p className="text-yellow-300 text-sm font-medium">
                ⚠️ Seleziona almeno una tipologia di vino prima di salvare la lista.
              </p>
            </div>
          )}

          {/* Messaggio di successo */}
          {showSuccessMessage && (
            <div className="mb-3 p-3 rounded-lg border border-green-500 bg-green-500/10">
              <p className="text-green-300 text-sm font-medium">
                ✅ Lista vini salvata con successo!
              </p>
            </div>
          )}

          <div className="text-sm text-gray-400 mb-2">
            Seleziona TIPOLOGIA vino (obbligatorio)
          </div>
          <div 
            className="flex items-center gap-3 p-2 border border-[#4a2a2a]"
            style={{
              borderRadius: "12px",
              backgroundColor: "rgba(50, 0, 0, 0.6)"
            }}
          >
            <select
              className="flex-1 bg-transparent text-white border-none outline-none"
              style={{
                padding: "8px 0",
                fontSize: "16px",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23ffffff\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "8px center",
                backgroundSize: "12px",
                paddingLeft: "30px"
              }}
              value={selectedTipologia}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedTipologia(value);
                setCategoria(value);
                console.log('🔄 Tipologia selezionata:', value);
              }}
            >
              <option value="" style={{ color: '#6b7280' }}>seleziona...</option>
              <option value="Bianco">Bianco</option>
              <option value="Rosso">Rosso</option>
              <option value="Bollicine">Bollicine</option>
              <option value="Rosato">Rosato</option>
              <option value="Dolce">Dolce</option>llicine">Bollicine</option>
              <option value="Rosato">Rosato</option>
            </select>

            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center justify-center text-white hover:bg-red-700 transition-colors border border-[#2c1b1b]"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(80, 0, 0, 0.9)",
                fontSize: "18px",
                fontWeight: "bold"
              }}
              title="Aggiungi categoria"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">
            Seleziona FORNITORE (opzionale)
          </div>
          <div 
            className="flex items-center gap-3 p-2 border border-[#4a2a2a]"
            style={{
              borderRadius: "12px",
              backgroundColor: "rgba(50, 0, 0, 0.6)"
            }}
          >
            <select
              className="flex-1 bg-transparent text-white border-none outline-none"
              style={{
                padding: "8px 0",
                fontSize: "16px",
                appearance: "none",
                backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23ffffff\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "8px center",
                backgroundSize: "12px",
                paddingLeft: "30px"
              }}
              value={selectedFornitore}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedFornitore(value);
                setFornitore(value);
                console.log('🔄 Fornitore selezionato:', value);
              }}
            >
              <option value="" style={{ color: '#6b7280' }}>nessuno...</option>
              {loadingSuppliers ? (
                <option disabled style={{ color: '#9ca3af' }}>Caricamento fornitori...</option>
              ) : suppliers.length === 0 ? (
                <option disabled style={{ color: '#9ca3af' }}>Nessun fornitore trovato</option>
              ) : (
                suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.nome} style={{ color: 'white' }}>
                    {supplier.nome}
                  </option>
                ))
              )}
            </select>

            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center justify-center text-white hover:bg-red-700 transition-colors border border-[#2c1b1b]"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(80, 0, 0, 0.9)",
                fontSize: "18px",
                fontWeight: "bold"
              }}
              title="Aggiungi fornitore"
            >
              +
            </button>
          </div>
        </div>

        {/* Campi Soglia Minima e Giacenza */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-2">
              Soglia Minima
            </div>
            <input
              type="number"
              value={sogliaMinima}
              onChange={(e) => setSogliaMinima(e.target.value)}
              min="0"
              className="w-full p-3 border border-[#4a2a2a] text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderRadius: "12px",
                backgroundColor: "rgba(50, 0, 0, 0.6)"
              }}
              placeholder="2"
            />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-2">
              Giacenza
            </div>
            <input
              type="number"
              value={giacenza}
              onChange={(e) => setGiacenza(e.target.value)}
              min="0"
              className="w-full p-3 border border-[#4a2a2a] text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderRadius: "12px",
                backgroundColor: "rgba(50, 0, 0, 0.6)"
              }}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center pt-2 gap-3">
          <button
            className="flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
            style={{
              borderRadius: "12px",
              padding: "14px 20px",
              fontWeight: "600",
              fontSize: "16px",
              flex: "1",
              backgroundColor: "#166534"
            }}
            onClick={() => richiediConferma(false)}
          >
            <Upload className="w-4 h-4" />
            Aggiungi a lista esistente
          </button>
          <button
            className="flex items-center justify-center gap-2 text-white hover:bg-[#455a6b] transition-colors"
            style={{
              borderRadius: "12px",
              padding: "14px 20px",
              fontWeight: "600",
              fontSize: "16px",
              flex: "1",
              backgroundColor: "#526D82"
            }}
            onClick={() => richiediConferma(true)}
          >
            <RotateCcw className="w-4 h-4" />
            Sostituisci lista esistente
          </button>
        </div>
      </div>

      {/* Modal Aggiungi Categoria */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-cream">Aggiungi Categoria</h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName("");
                }}
                className="text-gray-400 hover:text-cream"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Categoria
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Es: Dessert, Champagne..."
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName("");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={aggiungiCategoria}
                  disabled={!newCategoryName.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-cream rounded px-4 py-2 transition-colors"
                >
                  Aggiungi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Fornitore */}
      <AddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSupplierAdded={handleSupplierAdded}
      />

      {/* Modal Conferma Salvataggio */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-cream">Conferma Salvataggio</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="text-gray-400 hover:text-cream"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <div className="mb-6">
                {confirmAction === 'replace' ? (
                  <>
                    <p className="text-red-300 text-center font-semibold">
                      🚨 ATTENZIONE: Stai per SOSTITUIRE completamente la lista esistente!
                    </p>
                    <p className="text-red-400 text-sm text-center mt-2">
                      Tutti i vini della categoria "{selectedTipologia}" verranno eliminati e sostituiti con questa nuova lista.
                    </p>
                    <p className="text-gray-400 text-sm text-center mt-2">
                      Questa operazione NON può essere annullata. Sei sicuro di voler procedere?
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300 text-center">
                      ⚠️ Sei sicuro di voler salvare la lista vini?
                    </p>
                    <p className="text-gray-400 text-sm text-center mt-2">
                      Premi "Conferma" per procedere, oppure "Annulla" per modificare.
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    if (confirmAction === 'add') {
                      salvaVini(false);
                    } else if (confirmAction === 'replace') {
                      salvaVini(true);
                    }
                    setConfirmAction(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-cream rounded px-4 py-2 transition-colors"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}