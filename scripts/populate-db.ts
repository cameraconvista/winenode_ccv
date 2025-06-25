import { storage } from '../server/storage';

const winesData = [
  {
    name: "Amarone della Valpolicella DOCG 2018",
    type: "rosso",
    supplier: "Cantina Valpolicella",
    inventory: 12,
    minStock: 5,
    price: "65.00",
    vintage: "2018",
    region: "Veneto"
  },
  {
    name: "Barolo DOCG Brunate 2017",
    type: "rosso",
    supplier: "Azienda Vinicola Piemontese",
    inventory: 8,
    minStock: 3,
    price: "85.00",
    vintage: "2017",
    region: "Piemonte"
  },
  {
    name: "Chianti Classico DOCG Riserva 2019",
    type: "rosso",
    supplier: "Tenuta Toscana",
    inventory: 15,
    minStock: 8,
    price: "45.00",
    vintage: "2019",
    region: "Toscana"
  },
  {
    name: "Soave DOC Classico 2022",
    type: "bianco",
    supplier: "Cantina del Soave",
    inventory: 20,
    minStock: 10,
    price: "18.00",
    vintage: "2022",
    region: "Veneto"
  },
  {
    name: "Vermentino di Sardegna DOC 2023",
    type: "bianco",
    supplier: "Cantina Sarda",
    inventory: 18,
    minStock: 12,
    price: "22.00",
    vintage: "2023",
    region: "Sardegna"
  },
  {
    name: "Pignoletto Brut Bio Villa Amagioia",
    type: "bollicine",
    supplier: "Villa Amagioia Varignana",
    inventory: 14,
    minStock: 6,
    price: "28.00",
    vintage: "2022",
    region: "Emilia-Romagna"
  },
  {
    name: "Franciacorta DOCG Brut 2020",
    type: "bollicine",
    supplier: "Cantina Franciacorta",
    inventory: 10,
    minStock: 5,
    price: "35.00",
    vintage: "2020",
    region: "Lombardia"
  },
  {
    name: "Prosecco di Valdobbiadene DOCG 2023",
    type: "bollicine",
    supplier: "Cantina Valdobbiadene",
    inventory: 25,
    minStock: 15,
    price: "16.00",
    vintage: "2023",
    region: "Veneto"
  },
  {
    name: "Nero d'Avola DOC 2021",
    type: "rosso",
    supplier: "Cantina Siciliana",
    inventory: 3,
    minStock: 8,
    price: "25.00",
    vintage: "2021",
    region: "Sicilia"
  },
  {
    name: "Pinot Grigio Alto Adige DOC 2023",
    type: "bianco",
    supplier: "Cantina Alto Adige",
    inventory: 16,
    minStock: 10,
    price: "24.00",
    vintage: "2023",
    region: "Alto Adige"
  },
  {
    name: "Cerasuolo d'Abruzzo DOP 2022",
    type: "rosato",
    supplier: "Cantina Abruzzese",
    inventory: 2,
    minStock: 6,
    price: "20.00",
    vintage: "2022",
    region: "Abruzzo"
  },
  {
    name: "Primitivo di Manduria DOP 2020",
    type: "rosso",
    supplier: "Cantina Pugliese",
    inventory: 9,
    minStock: 5,
    price: "32.00",
    vintage: "2020",
    region: "Puglia"
  }
];

async function populateDatabase() {
  console.log('Popolamento del database con i dati dei vini...');
  
  for (const wineData of winesData) {
    try {
      await storage.createWine(wineData);
      console.log(`Aggiunto: ${wineData.name}`);
    } catch (error) {
      console.error(`Errore nell'aggiungere ${wineData.name}:`, error);
    }
  }
  
  console.log('Popolamento completato!');
}

populateDatabase().catch(console.error);