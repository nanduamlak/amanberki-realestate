export type PropertyStatus = "available" | "sold" | "reserved" | "under-construction";

export interface OwnershipHistory {
  ownerName: string;
  transferDate: string;
  status: "Current" | "Previous";
  notes?: string;
}

export interface PaymentRecord {
  id: string;                  // unique id e.g. "pay-001"
  description: string;         // e.g. "Down Payment", "Installment 2"
  amount: number;              // ETB / USD (First term payment value / installment amount)
  currency: "ETB" | "USD";
  dueDate: string;             // ISO date string "2025-08-15" (First term due date)
  paidDate?: string;           // set when paid
  status: "pending" | "paid" | "overdue" | "waived";
  totalAmount?: number;        // total payment contract value
  downPayment?: number;        // amount already paid upfront (reduces installment balance)
  paidAmount?: number;         // amount paid so far (One Term case)
  remainingAmount?: number;    // outstanding remaining amount
  termType?: "one_term" | "two_term";
  amountTerm2?: number;        // Second term payment value
  dueDateTerm2?: string;       // Second term due date
  paidDateTerm2?: string;      // Second term paid date
  statusTerm2?: "pending" | "paid" | "overdue" | "waived";
  notified?: boolean;          // whether admin was already email-notified
  notes?: string;
}

export interface PlotDetail {
  plotNumber: string;
  plotSize: number;
  builtArea: string;
  purchaserName: string;
  titleDeedsStatus: string;
  constructionStatus: string;
  remark: string;
  // House / unit details
  houseType?: string;          // e.g. "Villa", "Townhouse", "Duplex", "Apartment"
  floors?: number;             // number of floors / storeys
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  kitchen?: number;
  dining?: number;
  garage?: number;             // parking spaces
  balcony?: boolean;
  garden?: boolean;
  rooftop?: boolean;
  orientation?: string;        // e.g. "North-East facing"
  yearBuilt?: number;
  contractorName?: string;
  referenceNo?: string;
  buyerGroup?: string | null;  // e.g. "Panorama" — for group-based filtering
  ownershipHistory?: OwnershipHistory[];
  paymentSchedule?: PaymentRecord[];
  amenities?: string[];        // per-plot amenities e.g. ["Road Access","Water Supply"]
}

export interface Property {
  id: string;
  blockNumber: number;
  blockLabel?: string | null;  // e.g. "46A", "46B" — overrides blockNumber display when set
  zone: "Zone I G+1" | "Zone II G+0";
  status: PropertyStatus;
  price: number;
  priceMax?: number | null;   // upper bound for a range price (e.g. Zone II: 7M–7.5M)
  
  // Block Attributes
  primaryPlots: string;
  noOfPlots: number;
  area: number; // Total Sq.M
  plotSize: string; // e.g. "400" or "500/600"
  bufferPlots: string;
  noOfBufferPlots: number;
  soldPlots: number;
  activePlots: number;
  remark: string;
  description: string;
  plotsDetail?: PlotDetail[];
}

const amenitiesList = [
  "Swimming Pool", "Parking", "Garden", "Security", "Gym",
  "Playground", "Community Center", "River View", "Green Space", "CCTV"
];

const statuses: PropertyStatus[] = ["available", "sold", "reserved", "under-construction"];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateProperty(blockNum: number): Property {
  const r = (offset = 0) => seededRandom(blockNum * 31 + offset);
  const isZone1 = (blockNum >= 1 && blockNum <= 18) || blockNum === 461 || blockNum === 46 || blockNum === 47;
  const zone = isZone1 ? "Zone I G+1" : "Zone II G+0";

  const descriptions = [
    "A stunning modern property with premium finishes and breathtaking views of the surrounding landscape.",
    "Elegant living spaces designed for comfort and style, nestled in a vibrant community.",
    "Spacious and well-lit units with high-end fittings, perfect for families seeking quality.",
    "Premium residence offering luxury amenities and easy access to major city attractions.",
    "Contemporary design meets functional living in this beautifully crafted property.",
  ];

  // Generate realistic plot data for the remaining mock blocks
  const noOfPlots = 4 + Math.floor(r(3) * 12);
  const soldPlots = Math.floor(r(4) * (noOfPlots + 1));
  const activePlots = noOfPlots - soldPlots;
  const status = activePlots === 0 ? "sold" : soldPlots === 0 ? "available" : "reserved";
  
  const plotSize = 200 + Math.floor(r(5) * 4) * 100; // 200, 300, 400, 500
  const area = noOfPlots * plotSize;
  const price = area * 500; // rough mock price

  return {
    id: `BLOCK-${blockNum.toString().padStart(3, "0")}`,
    blockNumber: blockNum,
    blockLabel: blockNum === 461 ? "46A" : blockNum === 462 ? "46B" : null,
    zone,
    status,
    price,
    primaryPlots: `P 1-${noOfPlots}`,
    noOfPlots,
    area,
    plotSize: plotSize.toString(),
    bufferPlots: "0",
    noOfBufferPlots: 0,
    soldPlots,
    activePlots,
    remark: "",
    description: descriptions[Math.floor(r(11) * descriptions.length)],
  };
}

export const TOTAL_BLOCKS = 44;

export const properties: Property[] = Array.from(
  { length: TOTAL_BLOCKS },
  (_, i) => {
    if (i + 1 === 1) {
      return {
        id: "BLOCK-001",
        blockNumber: 1,
        zone: "Zone I G+1",
        status: "available",
        price: 0,
        primaryPlots: "P 1,2,3,4",
        noOfPlots: 4,
        area: 1600,
        plotSize: "400",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 0,
        activePlots: 4,
        remark: "Tulu Dimtu Real Estate",
        description: "Bare Land. Its located at the boarder edge of the site, adjacent to the main road.",
        plotsDetail: [
          {
            plotNumber: "1", plotSize: 400, builtArea: "320 m²",
            purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "",
            remark: "",
            houseType: "Villa", floors: 2, bedrooms: 4, bathrooms: 3,
            livingRooms: 1, kitchen: 1, dining: 1, garage: 2,
            balcony: true, garden: true, rooftop: false,
            orientation: "North-East Facing", yearBuilt: 2024,
            ownershipHistory: [
              { ownerName: "Tulu Dimtu Real Estate", transferDate: "2024-05-12", status: "Current", notes: "Developer registration" },
              { ownerName: "Ministry of Land", transferDate: "2023-11-04", status: "Previous", notes: "Initial allocation" }
            ]
          },
          {
            plotNumber: "2", plotSize: 400, builtArea: "",
            purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "",
            remark: "Bare Land. Its located at the border edge of the site, adjacent to the main road.",
            houseType: "Townhouse", floors: 2, bedrooms: 3, bathrooms: 2,
            livingRooms: 1, kitchen: 1, dining: 1, garage: 1,
            balcony: true, garden: false, rooftop: false,
            orientation: "South Facing",
          },
          {
            plotNumber: "3", plotSize: 400, builtArea: "",
            purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "",
            remark: "",
            houseType: "Villa", floors: 1, bedrooms: 3, bathrooms: 2,
            livingRooms: 1, kitchen: 1, dining: 1, garage: 1,
            balcony: false, garden: true, rooftop: true,
            orientation: "West Facing",
          },
          {
            plotNumber: "4", plotSize: 400, builtArea: "",
            purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "",
            remark: "",
            houseType: "Duplex", floors: 2, bedrooms: 5, bathrooms: 4,
            livingRooms: 2, kitchen: 1, dining: 1, garage: 2,
            balcony: true, garden: true, rooftop: true,
            orientation: "East Facing", yearBuilt: 2025,
          },
        ]
      };
    }
    if (i + 1 === 2) {
      return {
        id: "BLOCK-002",
        blockNumber: 2,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 7000,
        plotSize: "500",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 13,
        activePlots: 1,
        remark: "P8 - In House Sale",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 500, builtArea: "", purchaserName: "Nuru", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 500, builtArea: "", purchaserName: "Nuru", titleDeedsStatus: "", constructionStatus: "", remark: "Sold without written agreement" },
          { plotNumber: "3", plotSize: 500, builtArea: "", purchaserName: "Yahya Aliye", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 500, builtArea: "", purchaserName: "Abduljebar", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 500, builtArea: "", purchaserName: "Mickey", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 500, builtArea: "", purchaserName: "Nejat", titleDeedsStatus: "", constructionStatus: "", remark: "Jemal's Wife" },
          { plotNumber: "7", plotSize: 500, builtArea: "", purchaserName: "Asefa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 500, builtArea: "", purchaserName: "Idris Jibrel", titleDeedsStatus: "", constructionStatus: "", remark: "In House Sale ??" },
          { plotNumber: "9", plotSize: 500, builtArea: "", purchaserName: "Ahmed Tusa", titleDeedsStatus: "Issued", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 500, builtArea: "", purchaserName: "Yahya Aliye", titleDeedsStatus: "Issued", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 500, builtArea: "", purchaserName: "Rahma Hussein", titleDeedsStatus: "Issued", constructionStatus: "", remark: "Initially it was an In House Sale,then Rahma sold it to third party." },
          { plotNumber: "12", plotSize: 500, builtArea: "", purchaserName: "Rahma Hussein", titleDeedsStatus: "Issued", constructionStatus: "", remark: "Currently title is under a different buyer." },
          { plotNumber: "13", plotSize: 500, builtArea: "", purchaserName: "......................", titleDeedsStatus: "", constructionStatus: "", remark: "Sold Via Amabassador Aman (1/5)" },
          { plotNumber: "14", plotSize: 500, builtArea: "", purchaserName: "......................", titleDeedsStatus: "", constructionStatus: "", remark: "Sold Via Amabassador Aman (2/5)" }
        ]
      };
    }
    if (i + 1 === 3) {
      return {
        id: "BLOCK-003",
        blockNumber: 3,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-6",
        noOfPlots: 6,
        area: 3100,
        plotSize: "500-600",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 5,
        activePlots: 1,
        remark: "P3 - In House Sale",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 600, builtArea: "", purchaserName: "Mustefa Usman", titleDeedsStatus: "", constructionStatus: "", remark: "100 Sq.M addition to the standard Plot Size." },
          { plotNumber: "2", plotSize: 500, builtArea: "", purchaserName: "Nesanet", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 500, builtArea: "", purchaserName: "Gibril Kadi", titleDeedsStatus: "", constructionStatus: "", remark: "In House Sale ??" },
          { plotNumber: "4", plotSize: 500, builtArea: "", purchaserName: "Sileshi Gezahegn", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 500, builtArea: "", purchaserName: "Gezahegn", titleDeedsStatus: "", constructionStatus: "", remark: "Sileshi's Father" },
          { plotNumber: "6", plotSize: 500, builtArea: "", purchaserName: "Shemelis", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 4) {
      return {
        id: "BLOCK-004",
        blockNumber: 4,
        zone: "Zone I G+1",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-10",
        noOfPlots: 10,
        area: 2000,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 10,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Alemayehu Dagne", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Hana Melese", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Genet Birhan", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Yared Getahun", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Mamushet Aregaw", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Daniel Tesfa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Janberu Tadese", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Dr.Daniel Tekle G/Egziabher", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 5) {
      return {
        id: "BLOCK-005",
        blockNumber: 5,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-18",
        noOfPlots: 18,
        area: 3600,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 16,
        activePlots: 2,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Abra Zewedu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Dennenesh Genanaw", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "The Client didn't complete payment. Construction Cost is Unpaid" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Getu Tadela", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Dr. Mekuria Aregaw", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Shewadagn Seyfu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Roman Seifu and Ted Wondagegneh", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Etalem Demese", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Daniel Samuel Negash", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Meaza W/Mariam & Girma W/T", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Belete Demissew", titleDeedsStatus: "", constructionStatus: "", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Galgalo Boru", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Zegaya Abebe & Nigiste Asfaw", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Sirake Zewede & Saba Abraham", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Hirut Yemere Hassen", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Addise Alemna & Yosef Aleme", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 6) {
      return {
        id: "BLOCK-006",
        blockNumber: 6,
        zone: "Zone I G+1",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-18",
        noOfPlots: 18,
        area: 3600,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 18,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Eskedar Mengesha", titleDeedsStatus: "", constructionStatus: "", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Zerihun Mekonnen Damte", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Getenet Teshome", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Selamawit Habte Hagos", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Meruts Girmai & Lemlem G/Hiwot", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Roman Admasu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Habetamu Asefa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Munira Abdullahiali", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Hirut Derese", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Azebe Mogese", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Menber Fikadu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Eleni Tekle G/Egziabher", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Girma Negash & Bethelihem Z.", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Almaz Techane", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Rebeca G/Hiwot Solomon", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Kasan W/Mehirt", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Ewenetu Abat & Hirut Nigatu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Netsanet Gizaw &Seifu W/Yohanes", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 7) {
      return {
        id: "BLOCK-007",
        blockNumber: 7,
        zone: "Zone I G+1",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-18",
        noOfPlots: 18,
        area: 3600,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 18,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Alewiya Osman", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Hiwot Abebe", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Aberu Kidane", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Selamawit Abate", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Getachew Venera Gemari", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Alma Beru", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Getachew Araya", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Fedila Mohammed", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Marid Admasu Beyene", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Wellela Hirpassa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Almaz Abera Mamo", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Saada Abulahi Ali", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Lemlem Alemayehu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Amin Jemal", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Feker Amare", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Fitsum Kebede", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Alise Parounakian", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 8) {
      return {
        id: "BLOCK-008",
        blockNumber: 8,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-16",
        noOfPlots: 19,
        area: 4031,
        plotSize: "200-321",
        bufferPlots: "P 0,17,18",
        noOfBufferPlots: 3,
        soldPlots: 15,
        activePlots: 4,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "0", plotSize: 320, builtArea: "", purchaserName: "Teshome", titleDeedsStatus: "", constructionStatus: "", remark: "This is unidentified plot on DWG. Its built in Duplex natue" },
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Mihiret Sisay", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Merawi Feleke and Judith Abebe", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Damozee Gamada", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Yosef Yerga", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Abeba Tafa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Selam Desta Kebede", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Biruktawit Abje & Kirubel", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Maru Dhaba", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Mihret Demissew", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tsedale Mekonen &Mesfin Motuma", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Beyan Ahmed", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Hirut G/Silassie", titleDeedsStatus: "", constructionStatus: "Foundation Footings", remark: "Construction Status is on Foundation Footings" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Ahmed Kadi", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "17", plotSize: 321, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 190, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 9) {
      return {
        id: "BLOCK-009",
        blockNumber: 9,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-9",
        noOfPlots: 13,
        area: 2804,
        plotSize: "168-370",
        bufferPlots: "P 10-13",
        noOfBufferPlots: 4,
        soldPlots: 8,
        activePlots: 5,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Abdu Kasim (Netherland) ??", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Huzeyfa Musa", titleDeedsStatus: "", constructionStatus: "", remark: "No written Agreemnt" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Sadam Ahmed", titleDeedsStatus: "", constructionStatus: "", remark: "Redwan's Brother" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Foziya Ahmed", titleDeedsStatus: "", constructionStatus: "", remark: "Redwan's Sister" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Dawoud Alo", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Ayub OR Obsa Akasha", titleDeedsStatus: "Issued", constructionStatus: "", remark: "Discprecies B/n Site and office report" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "???", titleDeedsStatus: "Issued", constructionStatus: "", remark: "Redwan's Fatther In Law" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "???", titleDeedsStatus: "", constructionStatus: "", remark: "No written Agreemnt / Redwan arranges the deal" },
          { plotNumber: "10", plotSize: 370, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 266, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 168, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 10) {
      return {
        id: "BLOCK-010",
        blockNumber: 10,
        zone: "Zone I G+1",
        status: "available",
        price: 0,
        primaryPlots: "TBD",
        noOfPlots: 0,
        area: 0,
        plotSize: "TBD",
        bufferPlots: "TBD",
        noOfBufferPlots: 0,
        soldPlots: 0,
        activePlots: 0,
        remark: "To Be Determined",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 0, builtArea: "", purchaserName: "Hussein Abubaker", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 0, builtArea: "", purchaserName: "Sh/Mohammedin Najib", titleDeedsStatus: "", constructionStatus: "", remark: "Agreement is cancelled" },
          { plotNumber: "3", plotSize: 0, builtArea: "", purchaserName: "???", titleDeedsStatus: "", constructionStatus: "", remark: "Zahbiya Sister/ extension of few permiter on the river side." }
        ]
      };
    }
    if (i + 1 === 11) {
      return {
        id: "BLOCK-011",
        blockNumber: 11,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-3",
        noOfPlots: 9,
        area: 1833,
        plotSize: "164-291",
        bufferPlots: "P 4-9",
        noOfBufferPlots: 6,
        soldPlots: 1,
        activePlots: 8,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Desalegn (Raey Consultance)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 164, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 175, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 291, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 203, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 12) {
      return {
        id: "BLOCK-012",
        blockNumber: 12,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-9",
        noOfPlots: 14,
        area: 2858,
        plotSize: "184-274",
        bufferPlots: "P 10-14",
        noOfBufferPlots: 5,
        soldPlots: 5,
        activePlots: 9,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Shega", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Aga", titleDeedsStatus: "", constructionStatus: "", remark: "No written Agreemnt" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Demekech Teshome", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tewodros (Contractor)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tigist Dereje", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 274, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 184, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 13) {
      return {
        id: "BLOCK-013",
        blockNumber: 13,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-12",
        noOfPlots: 14,
        area: 3055,
        plotSize: "200-343",
        bufferPlots: "P 13-14",
        noOfBufferPlots: 2,
        soldPlots: 4,
        activePlots: 10,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Semira Umer", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Almudin", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Sadik Rahimeto", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Recently Sold" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 343, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 312, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 14) {
      return {
        id: "BLOCK-014",
        blockNumber: 14,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 17,
        area: 3508,
        plotSize: "200-308",
        bufferPlots: "P 15-17",
        noOfBufferPlots: 3,
        soldPlots: 7,
        activePlots: 10,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Hussein (Welega)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Hussein (Welega)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Remdiya Gulta", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Seid Ibrahim", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Nuredin (Norway)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Zubeyda Kedir Tufa", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Abdulkerim Abduro", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 308, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 15) {
      return {
        id: "BLOCK-015",
        blockNumber: 15,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-16",
        noOfPlots: 19,
        area: 3905,
        plotSize: "145-296",
        bufferPlots: "P 17-19",
        noOfBufferPlots: 3,
        soldPlots: 7,
        activePlots: 12,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Meseret Shemeket", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Fatiya Abdu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Shibelay W/Mariam", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "(Jima Lady)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Miftah", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Nasre", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Abdu Aba-Mencha", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 296, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 264, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "19", plotSize: 145, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 16) {
      return {
        id: "BLOCK-016",
        blockNumber: 16,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-18",
        noOfPlots: 22,
        area: 4603,
        plotSize: "200-324",
        bufferPlots: "P 19-22",
        noOfBufferPlots: 4,
        soldPlots: 10,
        activePlots: 12,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Ahmed Jemal (Lawyer)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Yaqob Adem", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Khalid Mama", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliye", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Jawar", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Haji Alo", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Alemayehu Tegegn (Lawyer)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Feysel Mama", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Wubit Mama", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Seyfu (Ginir)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "19", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "20", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "21", plotSize: 324, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "22", plotSize: 279, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 17) {
      return {
        id: "BLOCK-017",
        blockNumber: 17,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-19",
        noOfPlots: 21,
        area: 4452,
        plotSize: "192-260",
        bufferPlots: "P 20-21",
        noOfBufferPlots: 2,
        soldPlots: 10,
        activePlots: 11,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Nasredin Endashaw", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tekiya Abduqe (Woliyii Wife)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Munawar Zyndin", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Girma", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Sultan Hiydar", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 240, builtArea: "", purchaserName: "Tofik Nursebo", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare land. Plot Size for these Plots are 200+" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare land. Plot Size for these Plots are 200+" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare land. Plot Size for these Plots are 200+" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliyi", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Musbeha", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Hussein Aliyi", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Rabiya", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "19", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "20", plotSize: 260, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "21", plotSize: 192, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 18) {
      return {
        id: "BLOCK-018",
        blockNumber: 18,
        zone: "Zone I G+1",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-4",
        noOfPlots: 4,
        area: 1252,
        plotSize: "313",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 4,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 313, builtArea: "", purchaserName: "Tofik Sirgaga", titleDeedsStatus: "", constructionStatus: "", remark: "Discprecies B/n Site and office report" },
          { plotNumber: "2", plotSize: 313, builtArea: "", purchaserName: "(Tekiya's Brother)Najib Abduqu", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 313, builtArea: "", purchaserName: "Redwan Ahmed", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "4", plotSize: 313, builtArea: "", purchaserName: "Woliyii Guye", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" }
        ]
      };
    }
    if (i + 1 === 46) {
      return {
        id: "BLOCK-046",
        blockNumber: 46,
        zone: "Zone I G+1",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-8",
        noOfPlots: 8,
        area: 4000,
        plotSize: "500",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 6,
        activePlots: 2,
        remark: "P3,4 -In House Sale",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 500, builtArea: "", purchaserName: "Ayesha Nure (Mohmed Degdbo)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 500, builtArea: "", purchaserName: "Mohammed Degdabo", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 500, builtArea: "", purchaserName: "Foziya Aman", titleDeedsStatus: "", constructionStatus: "", remark: "In House Sale ??" },
          { plotNumber: "4", plotSize: 500, builtArea: "", purchaserName: "Foziya Aman", titleDeedsStatus: "", constructionStatus: "Pending", remark: "" },
          { plotNumber: "5", plotSize: 500, builtArea: "", purchaserName: "Yasin", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 500, builtArea: "", purchaserName: "MohammedHussein", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "7", plotSize: 500, builtArea: "", purchaserName: "Sofiya Tuse", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "8", plotSize: 500, builtArea: "", purchaserName: "Fekere", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 47) {
      return {
        id: "BLOCK-047",
        blockNumber: 47,
        zone: "Zone I G+1",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-8",
        noOfPlots: 8,
        area: 4000,
        plotSize: "500",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 8,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 500, builtArea: "", purchaserName: "??", titleDeedsStatus: "", constructionStatus: "", remark: "Purchase rate=50,000" },
          { plotNumber: "2", plotSize: 500, builtArea: "", purchaserName: "Shekure Nasre", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 500, builtArea: "", purchaserName: "Abrar", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "4", plotSize: 500, builtArea: "", purchaserName: "Amir (Adama)", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "5", plotSize: 500, builtArea: "", purchaserName: ".....................", titleDeedsStatus: "", constructionStatus: "", remark: "Sold Via Amabassador Aman (3/5)" },
          { plotNumber: "6", plotSize: 500, builtArea: "", purchaserName: ".....................", titleDeedsStatus: "", constructionStatus: "", remark: "Sold Via Amabassador Aman (4/5)" },
          { plotNumber: "7", plotSize: 500, builtArea: "", purchaserName: ".....................", titleDeedsStatus: "", constructionStatus: "", remark: "Sold Via Amabassador Aman (5/5)" },
          { plotNumber: "8", plotSize: 500, builtArea: "", purchaserName: "Amir (Adama)", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 19) {
      return {
        id: "BLOCK-019",
        blockNumber: 19,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-3",
        noOfPlots: 3,
        area: 890,
        plotSize: "200-405",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 2,
        activePlots: 1,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 405, builtArea: "", purchaserName: "Yahya Ali", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 285, builtArea: "", purchaserName: "Yahya Ali", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 20) {
      return {
        id: "BLOCK-020",
        blockNumber: 20,
        zone: "Zone II G+0",
        status: "sold",
        price: 0,
        primaryPlots: "P 1,2",
        noOfPlots: 2,
        area: 471,
        plotSize: "471.6",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 2,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1+2", plotSize: 471.6, builtArea: "", purchaserName: "Mohammed Ibrahim", titleDeedsStatus: "", constructionStatus: "Existing Structure on Plot 2", remark: "The two plots are purchased by one customer; hence integrated as a single property." }
        ]
      };
    }
    if (i + 1 === 21) {
      return {
        id: "BLOCK-021",
        blockNumber: 21,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-6",
        noOfPlots: 6,
        area: 1200,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 5,
        activePlots: 1,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Addise Seid", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Musefa Abdela", titleDeedsStatus: "", constructionStatus: "Roofing under const.", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "********", titleDeedsStatus: "", constructionStatus: "", remark: "Agreement is Terminated" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliyi", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Zeyneba Rahmeto", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 22) {
      return {
        id: "BLOCK-022",
        blockNumber: 22,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-3, 9-11",
        noOfPlots: 18,
        area: 3754,
        plotSize: "200-324",
        bufferPlots: "P 4-8, 12-18",
        noOfBufferPlots: 12,
        soldPlots: 4,
        activePlots: 14,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Mulugeta Desalegn", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Mustefa H/Hussein", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 230, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Beteka Mekete", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Teshome Mekete", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 324, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 23) {
      return {
        id: "BLOCK-023",
        blockNumber: 23,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-13",
        noOfPlots: 13,
        area: 2720,
        plotSize: "200-393",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 3,
        activePlots: 10,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 320, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Haile", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "Sold to third party by Haile (Finance Personnel)" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Ali Mohammed", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Mohammed Abdu", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 393, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 24) {
      return {
        id: "BLOCK-024",
        blockNumber: 24,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-16",
        noOfPlots: 16,
        area: 3200,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 4,
        activePlots: 12,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Hassen Hussein", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Mohammed Nure", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Bedru Temam", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Abas", titleDeedsStatus: "", constructionStatus: "", remark: "" }
        ]
      };
    }
    if (i + 1 === 25) {
      return {
        id: "BLOCK-025",
        blockNumber: 25,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-5, 9-13",
        noOfPlots: 17,
        area: 3337,
        plotSize: "157-200",
        bufferPlots: "P 6-8, 14-17",
        noOfBufferPlots: 7,
        soldPlots: 7,
        activePlots: 10,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Mustefa H/Hussein", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "" },
          { plotNumber: "8", plotSize: 157, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Mohammed", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Esmael Muze", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Baraka Nasir", titleDeedsStatus: "", constructionStatus: "", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Ayub Redi", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tajudin Shukri", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Ahmed Kemal", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 180, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 26) {
      return {
        id: "BLOCK-026",
        blockNumber: 26,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-3, 5-7",
        noOfPlots: 10,
        area: 2189,
        plotSize: "200-333",
        bufferPlots: "P 4, 8-10",
        noOfBufferPlots: 4,
        soldPlots: 3,
        activePlots: 7,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 256, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Aserar", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Aserar", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Shemsiya", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 333, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 27) {
      return {
        id: "BLOCK-027",
        blockNumber: 27,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-16",
        noOfPlots: 16,
        area: 3200,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 4,
        activePlots: 12,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "Teshome's Contract (1/30)" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Abdulkerim Abduro", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Eliyase Ayele", titleDeedsStatus: "", constructionStatus: "Blockwork/ No Roofs", remark: "Belowground level is added to the superstructure." },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "AbdulNeim Shemsu", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Munewer", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" }
        ]
      };
    }
    if (i + 1 === 28) {
      return {
        id: "BLOCK-028",
        blockNumber: 28,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-9, 11-19",
        noOfPlots: 22,
        area: 4661,
        plotSize: "200-415",
        bufferPlots: "P 10, 20-22",
        noOfBufferPlots: 4,
        soldPlots: 1,
        activePlots: 21,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Kedir Tura", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 415, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "19", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "20", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "21", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "22", plotSize: 246, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 29) {
      return {
        id: "BLOCK-029",
        blockNumber: 29,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-7, 10-16",
        noOfPlots: 18,
        area: 3671,
        plotSize: "191-280",
        bufferPlots: "P 8-9, 17-18",
        noOfBufferPlots: 4,
        soldPlots: 3,
        activePlots: 15,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Cloumn Footings", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Cloumn Footings", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Rahmet", titleDeedsStatus: "", constructionStatus: "Top Tie Beam", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Abdulkerim Abduro", titleDeedsStatus: "", constructionStatus: "Grade Beam", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Abubeker Ahmedin", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 191, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Cloumn Footings", remark: "SOLD" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Cloumn Footings", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "StoneMason", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Cloumn Footings", remark: "SOLD" },
          { plotNumber: "15", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "16", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "17", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "18", plotSize: 280, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 30) {
      return {
        id: "BLOCK-030",
        blockNumber: 30,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-6, 8-13",
        noOfPlots: 15,
        area: 3156,
        plotSize: "200-308",
        bufferPlots: "P 7, 14-15",
        noOfBufferPlots: 3,
        soldPlots: 9,
        activePlots: 6,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 248, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Abush (Yahya)", titleDeedsStatus: "", constructionStatus: "Top Tie Beam", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Abdulnasir Shemsi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Jemal Mohammed", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Abdulreshid Abdulahi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "15", plotSize: 308, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 31) {
      return {
        id: "BLOCK-031",
        blockNumber: 31,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-4, 6-9",
        noOfPlots: 11,
        area: 2268,
        plotSize: "200-252",
        bufferPlots: "P 5, 10-11",
        noOfBufferPlots: 3,
        soldPlots: 9,
        activePlots: 2,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Nuru (Ginir)", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "5", plotSize: 252, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Biniam Teferi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Eman Mohammed", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Eman Mohammed", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliyi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliyi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "11", plotSize: 216, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 32) {
      return {
        id: "BLOCK-032",
        blockNumber: 32,
        zone: "Zone II G+0",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 2800,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 14,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Birhanech Mulugeta", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Beyene", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "Not issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" }
        ]
      };
    }
    if (i + 1 === 33) {
      return {
        id: "BLOCK-033",
        blockNumber: 33,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 2861,
        plotSize: "200-259",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 7,
        activePlots: 7,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 259, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "", remark: "Occupied" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "", remark: "Occupied" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "", remark: "Occupied" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "", remark: "Occupied" },
          { plotNumber: "8", plotSize: 202, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tadese", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" }
        ]
      };
    }
    if (i + 1 === 34) {
      return {
        id: "BLOCK-034",
        blockNumber: 34,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-9, 10-18",
        noOfPlots: 22,
        area: 4603,
        plotSize: "200-338",
        bufferPlots: "P 19-22",
        noOfBufferPlots: 4,
        soldPlots: 10,
        activePlots: 12,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 338, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 300, builtArea: "", purchaserName: "Frezer", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "3", plotSize: 300, builtArea: "", purchaserName: "Aboyneh", titleDeedsStatus: "", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "4", plotSize: 310, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 336, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 278, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 36) {
      return {
        id: "BLOCK-036",
        blockNumber: 36,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-13",
        noOfPlots: 13,
        area: 2981,
        plotSize: "180-400",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 2,
        activePlots: 11,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 180, builtArea: "", purchaserName: "Badhadha", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (2/30)" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (3/30)" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (4/30)" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (5/30)" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (6/30)" },
          { plotNumber: "7", plotSize: 400, builtArea: "", purchaserName: "Church", titleDeedsStatus: "", constructionStatus: "Existing Structure", remark: "Provides Ritual Service" },
          { plotNumber: "8", plotSize: 347, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (7/30)" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (8/30)" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (9/30)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (10/30)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork/ No roofs", remark: "Teshome's Contract (11/30)" },
          { plotNumber: "13", plotSize: 254, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 37) {
      return {
        id: "BLOCK-037",
        blockNumber: 37,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-7",
        noOfPlots: 7,
        area: 1682,
        plotSize: "177-307",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 0,
        activePlots: 7,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 283, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 215, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Partial Stonemason", remark: "" },
          { plotNumber: "3", plotSize: 247, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "4", plotSize: 276, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "5", plotSize: 307, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (12/30)" },
          { plotNumber: "6", plotSize: 177, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "7", plotSize: 177, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    if (i + 1 === 38) {
      return {
        id: "BLOCK-038",
        blockNumber: 38,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-13",
        noOfPlots: 13,
        area: 2600,
        plotSize: "200",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 0,
        activePlots: 13,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (13/30)" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (14/30)" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (15/30)" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (16/30)" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (17/30)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (18/30)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (19/30)" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (20/30)" }
        ]
      };
    }
    if (i + 1 === 39) {
      return {
        id: "BLOCK-039",
        blockNumber: 39,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 3067,
        plotSize: "200-325",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 12,
        activePlots: 2,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 228, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (1/7)" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (2/7)" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (3/7)" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Aboyneh", titleDeedsStatus: "issued", constructionStatus: "75% completion", remark: "There is an existing G+1 house on this plot/Occupied by the homeowner" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Frezer", titleDeedsStatus: "issued", constructionStatus: "75% completion", remark: "There is existing G + 0 house on this plot/Occupied by the homeowner" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (21/30)" },
          { plotNumber: "7", plotSize: 325, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (22/30)" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "75% completion", remark: "There is an existing G+1 house on this plot/Occupied by the homeowner" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (4/7)" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (5/7)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (6/7)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Doyo", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land (7/7)" },
          { plotNumber: "13", plotSize: 274, builtArea: "", purchaserName: "Markos Merga", titleDeedsStatus: "Not issued", constructionStatus: "75% completion", remark: "There is an existing G+1 house on this plot/Occupied by the homeowner" },
          { plotNumber: "14", plotSize: 240, builtArea: "", purchaserName: "Geremachew Bekele", titleDeedsStatus: "Not issued", constructionStatus: "Blockwork", remark: "There is an existing G+1 house on this plot/Occupied by the homeowner" }
        ]
      };
    }
    if (i + 1 === 40) {
      return {
        id: "BLOCK-040",
        blockNumber: 40,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 3176,
        plotSize: "200-246",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 8,
        activePlots: 6,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tamere", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "3", plotSize: 226, builtArea: "", purchaserName: "Shafi Kamil", titleDeedsStatus: "Pending", constructionStatus: "Blockwork + Roofing", remark: ".........Teshome's Contract (23/30)" },
          { plotNumber: "4", plotSize: 226, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (24/30)" },
          { plotNumber: "5", plotSize: 226, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (25/30)" },
          { plotNumber: "6", plotSize: 226, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (26/30)" },
          { plotNumber: "7", plotSize: 226, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (27/30)" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Under Review", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "An ownership claim from third party. No evidence of tittle is provided (1/5)" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Awel Aba Boru", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Yedenekachew", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "11", plotSize: 246, builtArea: "", purchaserName: "Frehiwot", titleDeedsStatus: "Pending", constructionStatus: "Carried out", remark: "Occupied/ Teshome's Contract (28/30)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (29/30)" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Blockwork + Roofing", remark: "Teshome's Contract (30/30)" },
          { plotNumber: "14", plotSize: 200, builtArea: "", purchaserName: "Merga Batu", titleDeedsStatus: "Not issued", constructionStatus: "Carried out", remark: "Occupied" }
        ]
      };
    }
    if (i + 1 === 41) {
      return {
        id: "BLOCK-041",
        blockNumber: 41,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-12",
        noOfPlots: 12,
        area: 2400,
        plotSize: "200-400",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 1,
        activePlots: 11,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "5", plotSize: 400, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "Not issued", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "Column Footings", remark: "" }
        ]
      };
    }
    if (i + 1 === 42) {
      return {
        id: "BLOCK-042",
        blockNumber: 42,
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 1-10",
        noOfPlots: 10,
        area: 2202,
        plotSize: "200-302",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 3,
        activePlots: 7,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 300, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "6", plotSize: 302, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "7", plotSize: 200, builtArea: "", purchaserName: "Tulu Dimtu Real Estate", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Hassen Ibrahim", titleDeedsStatus: "Not issued", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Dereje (Contractor)", titleDeedsStatus: "Not issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Tadiyos", titleDeedsStatus: "Not issued", constructionStatus: "Carried out", remark: "Occupied" }
        ]
      };
    }
    if (i + 1 === 43) {
      return {
        id: "BLOCK-043",
        blockNumber: 43,
        zone: "Zone II G+0",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-12",
        noOfPlots: 12,
        area: 2600,
        plotSize: "200-300",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 12,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 300, builtArea: "", purchaserName: "Sadike", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Semerete Ashenafi", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Mohammed", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Under Review", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "An ownership claim from third party. Evidence of tittle is provided (2/5)" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "7", plotSize: 300, builtArea: "", purchaserName: "Sadike", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" }
        ]
      };
    }
    if (i + 1 === 44) {
      return {
        id: "BLOCK-044",
        blockNumber: 44,
        zone: "Zone II G+0",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 3000,
        plotSize: "200-300",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 14,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Under Review", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "An ownership claim from third party. Evidence of tittle is provided (3/5)" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Mulugeta Kassa", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Atakelete", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Frezere", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "Ayele", titleDeedsStatus: "Not issued", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "Zenabu", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "7", plotSize: 300, builtArea: "", purchaserName: "Tesfaye", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Amanuel Yilema", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Under Review", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "An ownership claim from third party. Evidence of tittle is provided (4/5)" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "14", plotSize: 300, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" }
        ]
      };
    }
    if (i + 1 === 45) {
      return {
        id: "BLOCK-045",
        blockNumber: 45,
        zone: "Zone II G+0",
        status: "sold",
        price: 0,
        primaryPlots: "P 1-14",
        noOfPlots: 14,
        area: 3000,
        plotSize: "200-300",
        bufferPlots: "0",
        noOfBufferPlots: 0,
        soldPlots: 14,
        activePlots: 0,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 200, builtArea: "", purchaserName: "Nuri Hussein", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "2", plotSize: 200, builtArea: "", purchaserName: "Shewaye Fiyati", titleDeedsStatus: "Issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "3", plotSize: 200, builtArea: "", purchaserName: "Beharu Fiseha", titleDeedsStatus: "Issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Under Review", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "An ownership claim from third party. Evidence of tittle is provided (5/5)" },
          { plotNumber: "5", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "6", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "7", plotSize: 300, builtArea: "", purchaserName: "Daniel (Oilibya)", titleDeedsStatus: "issued", constructionStatus: "Blockwork", remark: "" },
          { plotNumber: "8", plotSize: 200, builtArea: "", purchaserName: "Worku", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "9", plotSize: 200, builtArea: "", purchaserName: "Mohammed Dedegeba", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "10", plotSize: 200, builtArea: "", purchaserName: "Zelalem Kebede", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied" },
          { plotNumber: "11", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "12", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "13", plotSize: 200, builtArea: "", purchaserName: "*********", titleDeedsStatus: "issued", constructionStatus: "Carried out", remark: "Occupied (Screeing Buyer's Info.)" },
          { plotNumber: "14", plotSize: 300, builtArea: "", purchaserName: "Daniel (Oilibya)", titleDeedsStatus: "issued", constructionStatus: "Blockwork", remark: "" }
        ]
      };
    }
    if (i + 1 === 46) {
      return {
        id: "BLOCK-046B",
        blockNumber: 462,
        blockLabel: "46B",
        zone: "Zone II G+0",
        status: "reserved",
        price: 0,
        primaryPlots: "P 4",
        noOfPlots: 5,
        area: 1325,
        plotSize: "177-386",
        bufferPlots: "P 1-3, 5",
        noOfBufferPlots: 4,
        soldPlots: 1,
        activePlots: 4,
        remark: "",
        description: "",
        plotsDetail: [
          { plotNumber: "1", plotSize: 348, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" },
          { plotNumber: "2", plotSize: 386, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "3", plotSize: 214, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "Stonemason", remark: "" },
          { plotNumber: "4", plotSize: 200, builtArea: "", purchaserName: "Yahya Aliyi", titleDeedsStatus: "", constructionStatus: "Plastered", remark: "" },
          { plotNumber: "5", plotSize: 177, builtArea: "", purchaserName: "Tulu Dimtu Real Estate (B*)", titleDeedsStatus: "", constructionStatus: "", remark: "Bare Land" }
        ]
      };
    }
    return generateProperty(i + 1);
  }
);

export function getProperty(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getPropertyByBlock(blockNum: number | string): Property | undefined {
  return properties.find((p) => p.blockNumber === blockNum);
}
