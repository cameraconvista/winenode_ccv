import { useState } from 'react';
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
    }))
  );

  const [allWineRows, setAllWineRows] = useState<WineRow[]>([]);

  const upsertToSupabase = async (wine: WineRow, tipologiaCorrente?: string) => {
    try {
      if (!supabase || !authManager.isAuthenticated()) return;

      const userId = authManager.getUserId();
      if (!userId || !wine.nomeVino?.trim()) return;

      const { data: existingWine } = await supabase
        .from("vini")
        .select("id, giacenza")
        .eq("nome_vino", wine.nomeVino.trim())
        .eq("user_id", userId)
        .single();

      const giacenzaDaUsare = existingWine ? existingWine.giacenza : (wine.giacenza ?? 0);

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
          .eq("id", existingWine.id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) console.error("Update error:", error);
      } else {
        const { error } = await supabase
          .from("vini")
          .insert(wineData)
          .select()
          .single();

        if (error) console.error("Insert error:", error);
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
        const firstCell = row?.[0]?.trim().toUpperCase() || "";
        if (
          ["BIANCHI", "BOLLICINE", "ROSSI", "ROSATI", "VINI DOLCI"].includes(firstCell) ||
          firstCell.includes("BOLLICINE") ||
          ["NOME VINO", "ANNO", "PRODUTTORE"].includes(firstCell)
        ) {
          startRow = i + 1;
          continue;
        }
        if (row[0] && row[0].trim().length > 3) {
          startRow = i;
          break;
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
          tipologia: categoria,
        }));

      for (const wine of winesFromCsv) {
        if (wine.nomeVino?.trim()) {
          await upsertToSupabase(wine, categoria);
        }
      }

      if (supabase && authManager.isAuthenticated()) {
        const userId = authManager.getUserId();
        if (!userId) return;

        const { data: dbWines } = await supabase
          .from("vini")
          .select("nome_vino, giacenza")
          .eq("user_id", userId)
          .eq("tipologia", categoria);

        const giacenzeMap = new Map<string, number>();
        if (dbWines) {
          for (const dbWine of dbWines) {
            const nome = dbWine.nome_vino?.trim().toLowerCase();
            if (nome) giacenzeMap.set(nome, dbWine.giacenza || 0);
          }
        }

        const orderedWines: WineRow[] = winesFromCsv.map((wine) => ({
          ...wine,
          giacenza: giacenzeMap.get(wine.nomeVino.trim().toLowerCase()) ?? 0,
        }));

        const emptyRows = Array.from(
          { length: Math.max(0, 100 - orderedWines.length) },
          (_, idx) => ({
            id: `empty-${orderedWines.length + idx}`,
            nomeVino: "",
            anno: "",
            produttore: "",
            provenienza: "",
            giacenza: 0,
            fornitore: "",
          })
        );

        setWineRows([...orderedWines, ...emptyRows]);
        setAllWineRows((prev) => [...prev, ...orderedWines]);
        return;
      }

      // Fallback: se non carica giacenze
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
      setAllWineRows((prev) => [...prev, ...winesFromCsv]);
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
    csvUrls,
  };
}
