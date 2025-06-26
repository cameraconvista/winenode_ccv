
// Utility per la normalizzazione delle annate
export const normalizzaAnnata = (testo: string): string => {
  const match = testo.match(/['''](\d{2})/);
  if (match) {
    const anno2Cifre = parseInt(match[1]);
    const anno = anno2Cifre <= 25 ? 2000 + anno2Cifre : 1900 + anno2Cifre;
    return testo.replace(match[0], anno.toString());
  }
  return testo;
};

// Mapping delle categorie (disabilitato per configurazione manuale)
export const categoriaMapping: Record<string, string> = {
  // Mapping disabilitato - configurazione manuale richiesta
};

// Parole chiave da non usare come produttore
export const paroleDaEscludereComeProduttore = [
  'ROSSO', 'BIANCO', 'BOLLICINE', 'CHAMPAGNE', 'PROSECCO', 'FRANCIACORTA',
  'SPUMANTE', 'DOLCE', 'PASSITO', 'VERMOUTH', 'MARSALA', 'LIQUOROSO',
  'ROSATO', 'ROSÉ', 'NATURALE', 'BIANCHI', 'ROSSI', 'ROSATI', 'DOLCI',
  'FORTIFICATI', 'NATURALI', 'DOC', 'DOCG', 'IGT', 'AOC', 'DOP', 'IGP'
];

// Regioni italiane e francesi
export const regioni = [
  'PIEMONTE', 'TOSCANA', 'VENETO', 'LOMBARDIA', 'FRIULI', 'SICILIA', 'PUGLIA', 
  'CAMPANIA', 'MARCHE', 'ABRUZZO', 'LAZIO', 'UMBRIA', 'LIGURIA', 'EMILIA', 
  'ROMAGNA', 'SARDEGNA', 'CALABRIA', 'BASILICATA', 'MOLISE', "VALLE D'AOSTA",
  'TRENTINO', 'ALTO ADIGE', 'FRANCIA', 'SPAGNA', 'GERMANIA', 'CHAMPAGNE', 
  'BORDEAUX', 'BORGOGNA', 'BOURGOGNE', 'LOIRE', 'RHÔNE', 'ALSAZIA'
];

// Database vini per simulazione AI
export const databaseVini = {
  'BAROLO': {
    nomeCompleto: 'BAROLO DOCG',
    produttore: 'MARCHESI DI BAROLO',
    tipologia: 'ROSSI',
    provenienza: 'PIEMONTE',
    costoStimato: '45.00'
  },
  'CHIANTI': {
    nomeCompleto: 'CHIANTI CLASSICO DOCG',
    produttore: 'CASTELLO DI VERRAZZANO',
    tipologia: 'ROSSI',
    provenienza: 'TOSCANA',
    costoStimato: '25.00'
  },
  'PROSECCO': {
    nomeCompleto: 'PROSECCO DI VALDOBBIADENE DOCG',
    produttore: 'VILLA SANDI',
    tipologia: 'BOLLICINE ITALIANE',
    provenienza: 'VENETO',
    costoStimato: '18.00'
  },
  'FRANCIACORTA': {
    nomeCompleto: 'FRANCIACORTA BRUT DOCG',
    produttore: 'CA\' DEL BOSCO',
    tipologia: 'BOLLICINE ITALIANE',
    provenienza: 'LOMBARDIA',
    costoStimato: '35.00'
  },
  'AMARONE': {
    nomeCompleto: 'AMARONE DELLA VALPOLICELLA DOCG',
    produttore: 'ALLEGRINI',
    tipologia: 'ROSSI',
    provenienza: 'VENETO',
    costoStimato: '55.00'
  },
  'CHAMPAGNE': {
    nomeCompleto: 'CHAMPAGNE BRUT',
    produttore: 'MOËT & CHANDON',
    tipologia: 'BOLLICINE FRANCESI',
    provenienza: 'CHAMPAGNE',
    costoStimato: '65.00'
  }
};

// Funzione di simulazione ricerca online
export const simulaRicercaOnline = async (nomeBase: string, rigaOriginale: string) => {
  const nomeBaseMaiuscolo = nomeBase.toUpperCase();
  let vinoTrovato = null;

  // Cerca corrispondenza nel database
  for (const [chiave, vino] of Object.entries(databaseVini)) {
    if (nomeBaseMaiuscolo.includes(chiave)) {
      vinoTrovato = vino;
      break;
    }
  }

  // Se non trova corrispondenza, genera dati generici
  if (!vinoTrovato) {
    let tipologia = ''; // Tipologia vuota per configurazione manuale

    let provenienza = 'ITALIA';
    for (const regione of regioni) {
      if (rigaOriginale.toUpperCase().includes(regione)) {
        provenienza = regione;
        break;
      }
    }

    let costoStimato = '25.00';
    if (provenienza === 'FRANCIA') {
      costoStimato = (Math.random() * 40 + 35).toFixed(2);
    } else if (tipologia.includes('BOLLICINE')) {
      costoStimato = (Math.random() * 25 + 20).toFixed(2);
    }

    vinoTrovato = {
      nomeCompleto: nomeBase.toUpperCase(),
      produttore: 'DA DEFINIRE',
      tipologia: tipologia,
      provenienza: provenienza,
      costoStimato: costoStimato
    };
  }

  return vinoTrovato;
};
