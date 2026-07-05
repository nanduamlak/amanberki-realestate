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

export interface CommercialAsset {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  category: string;
  rooms?: BoleRwandaRoom[];
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
  }
];
