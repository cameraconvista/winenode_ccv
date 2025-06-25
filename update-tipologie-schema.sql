
-- Aggiunge la colonna colore alla tabella tipologie se non esiste già
ALTER TABLE tipologie 
ADD COLUMN IF NOT EXISTS colore VARCHAR(7) DEFAULT '#ffffff';

-- Aggiorna le tipologie esistenti con i colori predefiniti
UPDATE tipologie 
SET colore = CASE 
  WHEN nome = 'BIANCO' THEN '#ffffff'
  WHEN nome = 'BOLLICINE ESTERE' THEN '#f4e04d'
  WHEN nome = 'BOLLICINE FRANCESI' THEN '#f4e04d'
  WHEN nome = 'BOLLICINE ITALIANE' THEN '#f4e04d'
  WHEN nome = 'CHAMPAGNE' THEN '#f4e04d'
  WHEN nome = 'FORTIFICATI' THEN '#8b5e3c'
  WHEN nome = 'NATURALI' THEN '#a2d4c2'
  WHEN nome = 'NATURALI FRIZZANTI' THEN '#a2d4c2'
  WHEN nome = 'RAMATI ORANGE' THEN '#e78b43'
  WHEN nome = 'ROSSO' THEN '#aa1c1c'
  ELSE '#ffffff'
END
WHERE colore IS NULL OR colore = '';
