export interface BoleRwandaRoom {
  roomNo: string;
  clientName: string;
  contractDate: string;
  monthlyRent: number | string;
  firstPaymentFor: string;
  amountPaid: number | string;
  megabit: boolean;
  miazia: boolean;
  ginbot: boolean;
  sene: boolean;
  hamle: boolean;
  nehase: boolean;
  remark: string;
}

export interface CmcTenantHistory {
  tenantName: string;
  contractStart: string;
  contractEnd: string;
  terminationDate: string;
  yr1Rent: number;
  yr2Rent: number;
  yr3Rent: number;
  statusNotes: string;
}

export interface WajidTowerRoom {
  roomNo: string;
  size: string;
  rate: string;
  clientName: string;
  phone: string;
  status: string;
  jul: boolean;
  aug: boolean;
  sep: boolean;
  oct: boolean;
  nov: boolean;
  dec: boolean;
  jan: boolean;
  feb: boolean;
  mar: boolean;
  apr: boolean;
  may: boolean;
  jun: boolean;
  julNext: boolean;
}

export interface PiasaRoom {
  roomNo: string;
  size: string;
  location: string;
  status: string;
  jan: boolean;
  feb: boolean;
  mar: boolean;
  apr: boolean;
  may: boolean;
  jun: boolean;
  jul: boolean;
  aug: boolean;
  sep: boolean;
  oct: boolean;
  nov: boolean;
  dec: boolean;
}

export interface CommercialAsset {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  category: string;
  rooms?: BoleRwandaRoom[];
  wajidRooms?: WajidTowerRoom[];
  piasaRooms?: PiasaRoom[];
  tenantHistory?: CmcTenantHistory[];
  attachments?: { name: string; url: string; type: 'pdf' | 'docx' }[];
}

export const COMMERCIAL_ASSETS: CommercialAsset[] = [
  {
    id: "bole-rwanda",
    name: "Bole Rwanda Building",
    location: "Bole Rwanda, Addis Ababa",
    description: "Premium commercial and office complex situated in the Bole Rwanda area, optimized for business client rentals under Prime One Real Estate.",
    image: "/bole_rwanda.jpg",
    category: "Retail Shops",
    attachments: [
      { name: "Bole Rwanda Building Lease Document", url: "/BIRHANU.pdf", type: "pdf" }
    ],
    rooms: [
      {
        roomNo: "038/1",
        clientName: "Abuwork Woldie Nigbie",
        contractDate: "05/5/18 - 04/5/20",
        monthlyRent: 75000,
        firstPaymentFor: "3 months",
        amountPaid: 225000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: true,
        nehase: true,
        remark: "✓ 0911-523450"
      },
      {
        roomNo: "038/2",
        clientName: "Belal Areb Neda",
        contractDate: "05/5/18 - 04/5/19",
        monthlyRent: 50000,
        firstPaymentFor: "3 months",
        amountPaid: 150000,
        megabit: true,
        miazia: false,
        ginbot: false,
        sene: true,
        hamle: false,
        nehase: true,
        remark: "0948-899299 ?"
      },
      {
        roomNo: "038/3",
        clientName: "Hanan Umer Hussen",
        contractDate: "05/5/18 - 04/5/20",
        monthlyRent: 50000,
        firstPaymentFor: "6 months",
        amountPaid: 300000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: false,
        remark: "0930-642540 ✓"
      },
      {
        roomNo: "038/4",
        clientName: "Yesak Hergu Nerie",
        contractDate: "09/7/18 - 28/7/19",
        monthlyRent: 50000,
        firstPaymentFor: "3 \"",
        amountPaid: 150000,
        megabit: false,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: false,
        remark: "0942-131421"
      },
      {
        roomNo: "038/D5",
        clientName: "Biruk Sheferaw G/ Mariam",
        contractDate: "17/4/18 - 16/4/20",
        monthlyRent: 180000,
        firstPaymentFor: "6 \"",
        amountPaid: 1080000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/6",
        clientName: "Ferehewot Tasew Asefa",
        contractDate: "17/4/18 - 16/4/20",
        monthlyRent: 50000,
        firstPaymentFor: "3 months",
        amountPaid: 150000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/7",
        clientName: "Keder Tefera Yosuf",
        contractDate: "05/5/18 - 04/5/20",
        monthlyRent: 60000,
        firstPaymentFor: "3 months",
        amountPaid: 180000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: true,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/8",
        clientName: "-",
        contractDate: "-",
        monthlyRent: "-",
        firstPaymentFor: "-",
        amountPaid: "-",
        megabit: false,
        miazia: false,
        ginbot: false,
        sene: false,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/9",
        clientName: "Lidya Asfaw Kifle",
        contractDate: "21/6/18 - 20/6/19",
        monthlyRent: 55055,
        firstPaymentFor: "3 months",
        amountPaid: 165165,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: false,
        hamle: false,
        nehase: false,
        remark: "0904-576972 ✓"
      },
      {
        roomNo: "038/10",
        clientName: "-",
        contractDate: "-",
        monthlyRent: "-",
        firstPaymentFor: "-",
        amountPaid: "-",
        megabit: false,
        miazia: false,
        ginbot: false,
        sene: false,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/11",
        clientName: "-",
        contractDate: "-",
        monthlyRent: "-",
        firstPaymentFor: "-",
        amountPaid: "-",
        megabit: false,
        miazia: false,
        ginbot: false,
        sene: false,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/12",
        clientName: "Wolansa Kifle Eshetie",
        contractDate: "13/8/18 - 12/8/19",
        monthlyRent: 65000,
        firstPaymentFor: "3 months",
        amountPaid: 195000,
        megabit: false,
        miazia: false,
        ginbot: false,
        sene: true,
        hamle: true,
        nehase: true,
        remark: ""
      },
      {
        roomNo: "038/13",
        clientName: "Tossa Coffee Plc",
        contractDate: "17/4/18 - 16/4/19",
        monthlyRent: 30000,
        firstPaymentFor: "\"",
        amountPaid: 90000,
        megabit: true,
        miazia: true,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: false,
        remark: ""
      },
      {
        roomNo: "038/14",
        clientName: "Denkut Lookman Yosuf",
        contractDate: "01/9/18 - 31/8/19",
        monthlyRent: 30000,
        firstPaymentFor: "\"",
        amountPaid: 90000,
        megabit: false,
        miazia: false,
        ginbot: true,
        sene: true,
        hamle: false,
        nehase: true,
        remark: "0912-500257 ✓"
      },
      {
        roomNo: "038/15",
        clientName: "-",
        contractDate: "-",
        monthlyRent: "-",
        firstPaymentFor: "-",
        amountPaid: "-",
        megabit: false,
        miazia: false,
        ginbot: false,
        sene: false,
        hamle: false,
        nehase: false,
        remark: ""
      }
    ]
  },
  {
    id: "cmc",
    name: "CMC Building",
    location: "CMC, Addis Ababa",
    description: "Multifaceted educational and commercial rental asset located in CMC, housing prominent entities with long-term tenant history.",
    image: "/cmc.jpg",
    category: "Commercial Building",
    attachments: [
      { name: "Tenant Lease History Document", url: "/TENANT_HISTORY.docx", type: "docx" }
    ],
    tenantHistory: [
      {
        tenantName: "BATU GENERAL SERVICE/ MACMILAN ACADEMY",
        contractStart: "HAMLE 02, 2006",
        contractEnd: "HAMLE 01, 2009",
        terminationDate: "HAMLE 01, 2009",
        yr1Rent: 60000,
        yr2Rent: 80000,
        yr3Rent: 80000,
        statusNotes: "Completed full term"
      },
      {
        tenantName: "BATU GENERAL SERVICE/ MACMILAN ACADEMY",
        contractStart: "HAMLE 02, 2009",
        contractEnd: "SENE 27, 2012",
        terminationDate: "SENE 27, 2012",
        yr1Rent: 90000,
        yr2Rent: 95000,
        yr3Rent: 100000,
        statusNotes: "Completed full term"
      },
      {
        tenantName: "BATU GENERAL SERVICE/ MACMILAN ACADEMY",
        contractStart: "SENE 30, 2012",
        contractEnd: "SENE 29, 2013",
        terminationDate: "NEHASE 12, 2013",
        yr1Rent: 90000,
        yr2Rent: 95000,
        yr3Rent: 100000,
        statusNotes: "Extended slightly past end date"
      },
      {
        tenantName: "HARAMBE UNIVERSITY",
        contractStart: "MEGABIT 19, 2014",
        contractEnd: "MEGABIT 18, 2017",
        terminationDate: "SENE 13, 2016",
        yr1Rent: 172500,
        yr2Rent: 184000,
        yr3Rent: 195500,
        statusNotes: "Terminated early (During Yr 2)"
      },
      {
        tenantName: "GIRUM LEATHER",
        contractStart: "GENBOT 01, 2016",
        contractEnd: "GENBOT 01, 2019",
        terminationDate: "-",
        yr1Rent: 135000,
        yr2Rent: 141750,
        yr3Rent: 148838,
        statusNotes: "No early termination specified"
      }
    ]
  },
  {
    id: "bale-robe",
    name: "Bale Robe Building",
    location: "Bale Robe, Oromia Region",
    description: "Commercial building asset under the Aman Berki properties portfolio located in Bale Robe, currently registered as an active holding.",
    image: "/bale_robe.jpg",
    category: "Commercial / Retail Property",
    rooms: []
  },
  {
    id: "merkato-wajid-tower",
    name: "Merkato Wajid Tower",
    location: "Merkato, Addis Ababa",
    description: "A premium multi-level commercial tower situated in the high-density trading center of Merkato. Optimized for retail stalls, wholesalers, and general business tenants with dedicated storage options.",
    image: "/merkato_wajid_tower.jpg",
    category: "Commercial Tower",
    attachments: [
      { name: "Wajid Tower Directory File", url: "/merkato_wajid_tower_directory-v4.pdf", type: "pdf" }
    ],
    wajidRooms: [
      { roomNo: "B04", size: "—", rate: "—", clientName: "Abdurezak", phone: "0919 37 08 23", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "B08", size: "—", rate: "—", clientName: "Yasin", phone: "0942 22 07 47", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "G20", size: "—", rate: "—", clientName: "Hasen (Book Store)", phone: "0911 36 18 97", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "G19", size: "—", rate: "—", clientName: "Hilewamu Mosquonetic PLC", phone: "0936 36 91 91", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "G11", size: "—", rate: "—", clientName: "Sani", phone: "0912 97 17 68", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "114", size: "—", rate: "—", clientName: "Hasen", phone: "0910 18 69 28", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "115", size: "—", rate: "—", clientName: "Ibrahim", phone: "0919 39 93 59", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false },
      { roomNo: "105", size: "—", rate: "—", clientName: "Nega", phone: "0912 97 11 54", status: "OCCUPIED", jul: false, aug: false, sep: false, oct: false, nov: false, dec: false, jan: false, feb: false, mar: false, apr: false, may: false, jun: false, julNext: false }
    ]
  },
  {
    id: "piasa-retail-shop",
    name: "Piasa Retail Shop",
    location: "Piasa, Addis Ababa",
    description: "Premium retail space located in the historic core of Piasa, Addis Ababa. Features street-front exposure and high foot traffic suitable for retail and showroom services.",
    image: "/piasa_retail_shop.jpg",
    category: "Retail Shops",
    attachments: [
      { name: "Piasa Retail Space Directory", url: "/piassa_rental_space_tracker.pdf", type: "pdf" }
    ],
    piasaRooms: [
      { roomNo: "C14", size: "18.20 m²", location: "Semi Basement", status: "NOT RENTED", jan: false, feb: false, mar: false, apr: false, may: false, jun: false, jul: false, aug: false, sep: false, oct: false, nov: false, dec: false },
      { roomNo: "D32", size: "26.70 m²", location: "1st Floor", status: "NOT RENTED", jan: false, feb: false, mar: false, apr: false, may: false, jun: false, jul: false, aug: false, sep: false, oct: false, nov: false, dec: false }
    ]
  }
];
