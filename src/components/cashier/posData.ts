import { MasterItem } from "../../types";

export interface PosProduct {
  id: string;
  name: string;
  price: number;
  category: "Espresso" | "Milk Beverage" | "Manual Brew" | "Tea" | "Non Coffee" | "Food" | "Pastry";
  imageUrl: string;
  modifiers: string[];
  addOns: { name: string; price: number }[];
  recipe: { code: string; qty: number }[]; // raw material rules for stock deduction
}

export interface PosCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  visitCount: number;
  totalSpending: number;
  points: number;
}

export interface PosPrinter {
  id: string;
  name: string;
  type: "bluetooth" | "usb" | "network";
  connected: boolean;
  battery: number;
  status: "Connected" | "Disconnected" | "Printing" | "Error";
  size: "58mm" | "80mm";
}

export interface PosOrder {
  id: string;
  tableId: string;
  tableName: string;
  type: "Dine In" | "Take Away" | "Delivery" | "Reservation" | "Pre Order";
  items: {
    product: PosProduct;
    qty: number;
    notes?: string;
    selectedModifier?: string;
    selectedAddOns?: string[];
  }[];
  customerName?: string;
  discountId?: string;
  discountName?: string;
  discountAmount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export const posProducts: PosProduct[] = [
  // Espresso
  {
    id: "pos-1",
    name: "Double Espresso",
    price: 22000,
    category: "Espresso",
    imageUrl: "☕",
    modifiers: ["Standard", "Ristretto", "Lungo"],
    addOns: [{ name: "Extra Cup", price: 1000 }],
    recipe: [{ code: "BK-001", qty: 0.018 }]
  },
  {
    id: "pos-2",
    name: "Americano Hot / Ice",
    price: 28000,
    category: "Espresso",
    imageUrl: "🥃",
    modifiers: ["Hot", "Iced (Ice Cube Level Normal)", "Iced Less Ice", "Iced Extra Ice"],
    addOns: [{ name: "Extra Shot", price: 10000 }, { name: "Syrup vanilla", price: 5000 }],
    recipe: [{ code: "BK-001", qty: 0.018 }, { code: "KM-001", qty: 1 }]
  },
  // Milk Beverage
  {
    id: "pos-3",
    name: "Cappuccino Special",
    price: 32500,
    category: "Milk Beverage",
    imageUrl: "🥛",
    modifiers: ["Hot", "Iced", "Less Sweet"],
    addOns: [{ name: "Extra Shot Esp", price: 10000 }, { name: "Caramel Drizzle", price: 4000 }],
    recipe: [{ code: "BK-001", qty: 0.018 }, { code: "SU-001", qty: 0.150 }, { code: "KM-001", qty: 1 }]
  },
  {
    id: "pos-4",
    name: "Caffe Latte Full Cream",
    price: 35000,
    category: "Milk Beverage",
    imageUrl: "🥤",
    modifiers: ["Hot Pure Foam", "Iced Smooth", "Less Ice Light"],
    addOns: [{ name: "Vanilla Toffin Sirup", price: 5000 }, { name: "Oat Side Upgrade", price: 10000 }],
    recipe: [{ code: "BK-001", qty: 0.018 }, { code: "SU-001", qty: 0.150 }, { code: "KM-001", qty: 1 }]
  },
  {
    id: "pos-5",
    name: "Caramel Macchiato",
    price: 38000,
    category: "Milk Beverage",
    imageUrl: "🍯",
    modifiers: ["Hot Creamy", "Iced Caramelized"],
    addOns: [{ name: "Extra Caramel Shot", price: 6000 }],
    recipe: [{ code: "BK-001", qty: 0.018 }, { code: "SU-001", qty: 0.130 }, { code: "SI-002", qty: 0.02 }, { code: "KM-001", qty: 1 }]
  },
  // Manual Brew
  {
    id: "pos-6",
    name: "V60 Single Origin",
    price: 28000,
    category: "Manual Brew",
    imageUrl: "🧪",
    modifiers: ["Ethiopia Kochere", "Gayo Honey", "Toraja Sapan"],
    addOns: [{ name: "Ice Sharing Cup", price: 0 }],
    recipe: [{ code: "BK-002", qty: 0.015 }]
  },
  // Tea
  {
    id: "pos-7",
    name: "Lychee Iced Tea",
    price: 27000,
    category: "Tea",
    imageUrl: "🍹",
    modifiers: ["Normal Sweet", "Less Sweet", "No Sweet"],
    addOns: [{ name: "Extra Lychee Fruit (1pcs)", price: 4000 }],
    recipe: [{ code: "SI-005", qty: 0.01 }]
  },
  // Non Coffee
  {
    id: "pos-8",
    name: "Ice Premium Chocolate",
    price: 32000,
    category: "Non Coffee",
    imageUrl: "🍫",
    modifiers: ["Less Sweetened", "Super Dark Creamy", "Iced Milk Based"],
    addOns: [{ name: "Marshmallows (5pcs)", price: 5000 }],
    recipe: [{ code: "PW-001", qty: 0.03 }, { code: "SU-001", qty: 0.150 }, { code: "KM-001", qty: 1 }]
  },
  {
    id: "pos-9",
    name: "Kyoto Uji Matcha Latte",
    price: 37000,
    category: "Non Coffee",
    imageUrl: "🍵",
    modifiers: ["Hot Signature", "Cold Sweeter", "Less Sugar Mode"],
    addOns: [{ name: "Red Bean Paste", price: 6000 }],
    recipe: [{ code: "PW-002", qty: 6 }, { code: "SU-001", qty: 0.150 }, { code: "KM-001", qty: 1 }]
  },
  // Food
  {
    id: "pos-10",
    name: "Beef Carbonara Pasta",
    price: 48000,
    category: "Food",
    imageUrl: "🍝",
    modifiers: ["Medium Creamy", "Spicy Chili Olive", "Kid Friendly Non Spicy"],
    addOns: [{ name: "Extra Smoke Beef Slice", price: 10000 }, { name: "Gratin Melt Cheese", price: 8000 }],
    recipe: [{ code: "SI-005", qty: 0.005 }]
  },
  {
    id: "pos-11",
    name: "Nasi Goreng Kampung",
    price: 45000,
    category: "Food",
    imageUrl: "🍛",
    modifiers: ["Tidak Pedas", "Sedikit Pedas (Level 1)", "Pedas Sedang (Level 2)", "Super Pedas (Level 3)"],
    addOns: [{ name: "Telur Ceplok Matang", price: 4000 }, { name: "Kerupuk Extra Pack", price: 2000 }],
    recipe: [{ code: "SI-005", qty: 0.005 }]
  },
  // Pastry
  {
    id: "pos-12",
    name: "Butter Croissant",
    price: 25000,
    category: "Pastry",
    imageUrl: "🥐",
    modifiers: ["Heated / Warm up", "Plain Cold"],
    addOns: [{ name: "Nutella Cocoa Dip", price: 6000 }, { name: "Salted Butter Spread", price: 3000 }],
    recipe: []
  },
  {
    id: "pos-13",
    name: "Chocolate Danish Golden",
    price: 28000,
    category: "Pastry",
    imageUrl: "🥯",
    modifiers: ["Warm Grilled", "As Standard Box"],
    addOns: [{ name: "Choco Sprinkles Extra", price: 3000 }],
    recipe: []
  }
];

export const defaultCustomers: PosCustomer[] = [
  { id: "cust-1", name: "Dario Varsel", phone: "081234567890", email: "dario@la-parla.com", birthday: "1997-08-14", visitCount: 35, totalSpending: 1250000, points: 125 },
  { id: "cust-2", name: "Mega Lestari", phone: "089876543210", email: "mega@la-parla.com", birthday: "2000-01-20", visitCount: 18, totalSpending: 560000, points: 56 },
  { id: "cust-3", name: "Rian Hidayat", phone: "081122334455", email: "rian.hid@gmail.com", birthday: "1995-11-23", visitCount: 8, totalSpending: 220000, points: 22 },
  { id: "cust-4", name: "Giselle Anastasya", phone: "085566778899", email: "giselle@gmail.com", birthday: "2002-05-02", visitCount: 3, totalSpending: 75000, points: 7 },
  { id: "cust-5", name: "Pak Anton Juri", phone: "083244234324", email: "anton@bumn.go.id", birthday: "1988-12-12", visitCount: 42, totalSpending: 1980000, points: 198 }
];

export const defaultPrinters: PosPrinter[] = [
  { id: "prn-1", name: "Panda Mobile 58mm", type: "bluetooth", connected: true, battery: 84, status: "Connected", size: "58mm" },
  { id: "prn-2", name: "Panda Bar Counter 80mm", type: "bluetooth", connected: false, battery: 100, status: "Disconnected", size: "80mm" },
  { id: "prn-3", name: "Kitchen Thermal PR3", type: "network", connected: true, battery: 100, status: "Connected", size: "80mm" },
  { id: "prn-4", name: "Barista Label Printer", type: "usb", connected: false, battery: 95, status: "Disconnected", size: "58mm" }
];

export interface ShiftDrawerState {
  cashOpening: number;
  cashSales: number;
  nonCashSales: number;
  refundsAmount: number;
  voidAmount: number;
  cashClosingExpected: number;
  cashClosingActual: number;
  isShiftActive: boolean;
  notes?: string;
  history?: {
    openedAt: string;
    closedAt: string;
    opening: number;
    expected: number;
    actual: number;
    difference: number;
    cashierName: string;
  }[];
}

export const initialShiftState: ShiftDrawerState = {
  cashOpening: 500000, // standard IDR opening float
  cashSales: 0,
  nonCashSales: 0,
  refundsAmount: 0,
  voidAmount: 0,
  cashClosingExpected: 500000,
  cashClosingActual: 500000,
  isShiftActive: false,
  history: [
    { openedAt: "2026-06-02 06:15", closedAt: "2026-06-02 14:02", opening: 500000, expected: 1350000, actual: 1350000, difference: 0, cashierName: "Chaca Cashier" },
    { openedAt: "2026-06-02 14:05", closedAt: "2026-06-02 21:55", opening: 500000, expected: 1680000, actual: 1675000, difference: -5000, cashierName: "Adit Barista" }
  ]
};

export const computeLoyaltyTier = (visitCount: number, spending: number): "Bronze" | "Silver" | "Gold" | "VIP" => {
  if (visitCount > 30 || spending > 1500000) return "VIP";
  if (visitCount > 15 || spending > 750000) return "Gold";
  if (visitCount > 5 || spending > 250000) return "Silver";
  return "Bronze";
};

export const getTierColor = (tier: "Bronze" | "Silver" | "Gold" | "VIP"): string => {
  switch (tier) {
    case "VIP": return "bg-purple-900/40 text-purple-300 border-purple-500/35";
    case "Gold": return "bg-amber-900/45 text-amber-300 border-amber-500/35";
    case "Silver": return "bg-slate-700 text-slate-200 border-slate-500/30";
    default: return "bg-orange-950/40 text-orange-400 border-orange-900/30";
  }
};
