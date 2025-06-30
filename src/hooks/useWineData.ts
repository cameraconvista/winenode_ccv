
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { supabase, authManager } from '../lib/supabase';

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

const csvUrls = {
  "BOLLICINE ITALIANE": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv",
  "BOLLICINE FRANCESI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv",
  BIANCHI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv",
  ROSSI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv",
  ROSATI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv",
  "VINI DOLCI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv",
};

export function useWineData() {
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
  const [allWineRows, setAllWineRows] = useState<WineRow[]>([]);

  const upsertToSupabase = async (wine: WineRow, tipologiaCorrente?: string) => {
    console.log("🔄 Sincronizzazione Supabase:", wine.nomeVino);

    try {
      if (!supabase) {
        console.error("Supabase non disponibile");
        return;
      }

      if (!authManager.isAuthenticated()) {
        console.error("Utente non autenticato");
        return;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.error("ID utente non disponibile");
        return;
      }

      if (!wine.nomeVino || wine.nomeVino.trim() === "") {
        console.log("Vino ignorato - nome vuoto");
        return;
      }

      const { data: existingWine } = await supabase
        .from("vini")
        .select("id, giacenza")
        .eq("nome_vino", wine.nomeVino.trim())
        .eq("user_id", userId)
        .single();

      const giacenzaDaUsare = existingWine ? existingWine.giacenza : (wine.giacenza ?? 0);

      console.log(`🔍 Vino "${wine.nomeVino}": giacenza esistente=${existingWine?.giacenza}, giacenza CSV=${wine.giacenza}, usando=${giacenzaDaUsare}`);

      const wineData = {
        nome_vino: wine.nomeVino.trim(),
        anno: wine.anno || null,
        produttore: wine.produttore || null,
        provenienza: wine.provenienza || null,
        fornitore: wine.fornitore || null,
        tipologia: wine.tipologia || tipologiaCorrente,
        giacenza: giacenzaDaUsare,
        user_id: userId
      };

      if (existingWine) {
        const { data, error } = await supabase
          .from("vini")
          .update(wineData)
          .eq('id', existingWine.id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error(`❌ Errore nell'update a Supabase:`, error);
        } else {
          console.log(`✅ Update Supabase: "${wine.nomeVino}" completato (giacenza preservata: ${data.giacenza})`);
          
          setWineRows(prev => prev.map(row => 
            row.nomeVino.trim().toLowerCase() === wine.nomeVino.trim().toLowerCase()
              ? { ...row, giacenza: data.giacenza, id: `db-${data.id}` }
              : row
          ));

          setAllWineRows(prev => prev.map(row => 
            row.nomeVino.trim().toLowerCase() === wine.nomeVino.trim().toLowerCase()
              ? { ...row, giacenza: data.giacenza, id: `db-${data.id}` }
              : row
          ));
        }
      } else {
        const { data, error } = await supabase
          .from("vini")
          .insert(wineData)
          .select()
          .single();

        if (error) {
          console.error(`❌ Errore nell'insert a Supabase:`, error);
        } else {
          console.log(`✅ Insert Supabase: "${wine.nomeVino}" completato (giacenza iniziale: ${data.giacenza})`);
          
          setWineRows(prev => prev.map(row => 
            row.nomeVino.trim().toLowerCase() === wine.nomeVino.trim().toLowerCase()
              ? { ...row, giacenza: data.giacenza, id: `db-${data.id}` }
              : row
          ));

          setAllWineRows(prev => prev.map(row => 
            row.nomeVino.trim().toLowerCase() === wine.nomeVino.trim().toLowerCase()
              ? { ...row, giacenza: data.giacenza, id: `db-${data.id}` }
              : row
          ));
        }
      }
    } catch (err) {
      console.error("Errore interno upsert:", err);
    }
  };

  const fetchAndParseCSV = async (url: string, categoria: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const csvText = await response.text();

      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });

      let startRow = 0;

      for (let i = 0; i < parsed.data.length; i++) {
        const row = parsed.data[i];
        if (row && row.length > 0) {
          const firstCell = row[0]?.trim().toUpperCase() || "";

          if ([
            "BIANCHI", "BOLLICINE", "BOLLICINE ITALIANE", "BOLLICINE FRANCESI",
            "ROSSI", "ROSATI", "VINI DOLCI",
          ].includes(firstCell) || firstCell.includes("BOLLICINE")) continue;

          const rowText = row.join("").toLowerCase();

          if (rowText.includes("nome vino") || rowText.includes("produttore") ||
              rowText.includes("provenienza") || rowText.includes("fornitore") ||
              firstCell === "NOME VINO" || firstCell === "ANNO" || firstCell === "PRODUTTORE") {
            startRow = i + 1;
            continue;
          }

          if (row[0] && row[0].trim() && row[0].length > 3 && !firstCell.includes("VINI") &&
              !firstCell.includes("BOLLICINE") && !firstCell.includes("BIANCHI") &&
              !firstCell.includes("ROSSI") && !firstCell.includes("ROSATI")) {
            startRow = i;
            break;
          }
        }
      }

      const dataRows = parsed.data.slice(startRow);

      const winesFromCsv: WineRow[] = dataRows
        .filter((row) => row && row[0] && row[0].trim())
        .map((row, index) => ({
          id: `csv-${categoria}-${startRow + index}`,
          nomeVino: row[0]?.trim() || "",
          anno: row[1]?.trim() || "",
          produttore: row[2]?.trim() || "",
          provenienza: row[3]?.trim() || "",
          fornitore: row[4]?.trim() || "",
          giacenza: 0,
        }));

      for (const wine of winesFromCsv) {
        if (wine.nomeVino?.trim()) {
          await upsertToSupabase(wine, categoria);
        }
      }

      if (supabase && authManager.isAuthenticated()) {
        const userId = authManager.getUserId();
        if (userId) {
          try {
            const { data: dbWines } = await supabase
              .from("vini")
              .select("*")
              .eq("user_id", userId)
              .eq("tipologia", categoria);

            if (dbWines && dbWines.length > 0) {
              const winesWithCorrectInventory = dbWines.map((dbWine) => ({
                id: `db-${dbWine.id}`,
                nomeVino: dbWine.nome_vino || "",
                anno: dbWine.anno || "",
                produttore: dbWine.produttore || "",
                provenienza: dbWine.provenienza || "",
                fornitore: dbWine.fornitore || "",
                giacenza: dbWine.giacenza || 0,
                tipologia: dbWine.tipologia || categoria
              }));

              const emptyRows = Array.from(
                { length: Math.max(0, 100 - winesWithCorrectInventory.length) },
                (_, idx) => ({
                  id: `empty-${winesWithCorrectInventory.length + idx}`,
                  nomeVino: "",
                  anno: "",
                  produttore: "",
                  provenienza: "",
                  giacenza: 0,
                  fornitore: "",
                }),
              );

              console.log(`✅ ${categoria}: Caricati ${winesWithCorrectInventory.length} vini con giacenze da Supabase`);
              setWineRows([...winesWithCorrectInventory, ...emptyRows]);
              return;
            }
          } catch (error) {
            console.error(`Errore nel caricamento giacenze da Supabase per ${categoria}:`, error);
          }
        }
      }

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

  return {
    wineRows,
    setWineRows,
    allWineRows,
    setAllWineRows,
    fetchAndParseCSV,
    upsertToSupabase,
    csvUrls
  };
}
