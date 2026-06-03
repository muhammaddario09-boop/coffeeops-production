import { CoffeeOpsState, MasterItem } from "./types";

export const defaultMasterItems: MasterItem[] = [
  { code: "BK-001", name: "Biji Kopi Blend Espresso", unit: "kg", par: 2, price: 180000, supplier: "Tanamera Coffee", temp: "Suhu Ruang 20-25°C", shelf: "4 mgg setelah buka", loc: "gudang" },
  { code: "BK-002", name: "Biji Kopi Single Origin", unit: "kg", par: 0.5, price: 320000, supplier: "Two Hands Full", temp: "Suhu Ruang 20-25°C", shelf: "4 mgg setelah buka", loc: "gudang" },
  { code: "BK-004", name: "Cold Brew Concentrate", unit: "liter", par: 2, price: 85000, supplier: "Internal Lab", temp: "2-4°C Kulkas", shelf: "5 hari", loc: "bar" },
  { code: "SU-001", name: "Susu Full Cream Greenfields", unit: "liter", par: 5, price: 22000, supplier: "Greenfields Indonesia", temp: "2-4°C Kulkas", shelf: "Max 24j setelah buka", loc: "bar" },
  { code: "SU-002", name: "Susu Skim Diamond", unit: "liter", par: 2, price: 25000, supplier: "Diamond Distributor", temp: "2-4°C Kulkas", shelf: "Max 24j setelah buka", loc: "bar" },
  { code: "SU-003", name: "Oat Milk Oatside Barista", unit: "liter", par: 2, price: 45000, supplier: "Oatside Official", temp: "Kulkas setelah buka", shelf: "7-10 hari", loc: "bar" },
  { code: "SI-001", name: "Sirup Vanilla Toffin", unit: "botol", par: 2, price: 95000, supplier: "Toffin Indonesia", temp: "Suhu Ruang", shelf: "1 bulan", loc: "bar" },
  { code: "SI-002", name: "Sirup Caramel Toffin", unit: "botol", par: 2, price: 95000, supplier: "Toffin Indonesia", temp: "Suhu Ruang", shelf: "1 bulan", loc: "bar" },
  { code: "SI-005", name: "Gula Pasir Rose Brand", unit: "kg", par: 1, price: 18000, supplier: "Distributor Sembako", temp: "Suhu ruang kedap", shelf: "6 bulan", loc: "gudang" },
  { code: "PW-001", name: "Premium Chocolate Powder", unit: "kg", par: 0.5, price: 120000, supplier: "Toffin Indonesia", temp: "Suhu ruang kedap", shelf: "6 bulan", loc: "gudang" },
  { code: "PW-002", name: "Uji Matcha Powder Powder", unit: "gr", par: 100, price: 85000, supplier: "Uji Matcha Id", temp: "Suhu ruang kedap", shelf: "3 bulan", loc: "gudang" },
  { code: "KM-001", name: "Cup Plastic 12oz (Cold)", unit: "pcs", par: 100, price: 950, supplier: "Multi Kemasan", temp: "Suhu ruang kering", shelf: "—", loc: "gudang" },
  { code: "KM-002", name: "Cup Paper 8oz (Hot)", unit: "pcs", par: 100, price: 850, supplier: "Multi Kemasan", temp: "Suhu ruang kering", shelf: "—", loc: "gudang" },
];

export const initialStats: CoffeeOpsState = {
  branding: {
    name: "Le Parla Café",
    logo: "⚜️",
    tagline: "Modern & Premium Enterprise Coffee Shop Management",
    storageGudangName: "Gudang Utama",
    storageBarName: "Bar Chiller",
    primaryColor: "#D4A853", // Latte gold
    shiftPagiStart: "06:00",
    shiftPagiEnd: "14:00",
    shiftSiangStart: "13:00",
    shiftSiangEnd: "21:00",
    shiftMalamStart: "20:00",
    shiftMalamEnd: "23:00",
    lateThresholdMinutes: 15,
    cafeLat: -2.1283,
    cafeLng: 106.1161,
    gpsVerificationEnabled: true,
    gpsVerificationRadius: 100
  },
  master: defaultMasterItems,
  inventory: {
    "BK-001": { awal: 6, masuk: 0, keluar: 0, waste: 0 },
    "BK-002": { awal: 2.5, masuk: 0, keluar: 0, waste: 0 },
    "BK-004": { awal: 4, masuk: 0, keluar: 0, waste: 0 },
    "SU-001": { awal: 12, masuk: 0, keluar: 0, waste: 0 },
    "SU-002": { awal: 4, masuk: 0, keluar: 0, waste: 0 },
    "SU-003": { awal: 6, masuk: 0, keluar: 0, waste: 0 },
    "SI-001": { awal: 3, masuk: 0, keluar: 0, waste: 0 },
    "SI-002": { awal: 3, masuk: 0, keluar: 0, waste: 0 },
    "SI-005": { awal: 5, masuk: 0, keluar: 0, waste: 0 },
    "PW-001": { awal: 1.5, masuk: 0, keluar: 0, waste: 0 },
    "PW-002": { awal: 350, masuk: 0, keluar: 0, waste: 0 },
    "KM-001": { awal: 300, masuk: 0, keluar: 0, waste: 0 },
    "KM-002": { awal: 200, masuk: 0, keluar: 0, waste: 0 },
  },
  storage: {
    gudang: {
      "BK-001": 4,
      "BK-002": 2,
      "SI-005": 5,
      "PW-001": 1.5,
      "PW-002": 350,
      "KM-001": 300,
      "KM-002": 200,
      "BK-004": 0,
      "SU-001": 0,
      "SU-002": 0,
      "SU-003": 0,
      "SI-001": 0,
      "SI-002": 0,
    },
    bar: {
      "BK-001": 2,
      "BK-002": 0.5,
      "BK-004": 4,
      "SU-001": 12,
      "SU-002": 4,
      "SU-003": 6,
      "SI-001": 3,
      "SI-002": 3,
      "SI-005": 0,
      "PW-001": 0,
      "PW-002": 0,
      "KM-001": 0,
      "KM-002": 0,
    }
  },
  fifo: {
    "BK-001": [
      { qty: 4, inDate: "2026-05-25", expDate: "2026-06-25", used: false },
      { qty: 2, inDate: "2026-05-30", expDate: "2026-06-30", used: false }
    ],
    "SU-001": [
      { qty: 6, inDate: "2026-05-31", expDate: "2026-06-02", used: false },
      { qty: 6, inDate: "2026-06-01", expDate: "2026-06-03", used: false }
    ]
  },
  issues: [
    {
      id: "IS-1",
      time: "2026-06-01 08:30:15",
      isoDate: "2026-06-01T08:30:15",
      code: "BK-001",
      name: "Biji Kopi Blend Espresso",
      qty: 0.5,
      unit: "kg",
      cat: "Pemakaian Produksi",
      by: "Dario Bartender",
      shift: "Pagi (06:00–14:00)",
      note: "Pemakaian espresso bar pagi"
    },
    {
      id: "IS-2",
      time: "2026-06-01 09:15:00",
      isoDate: "2026-06-01T09:15:00",
      code: "SU-001",
      name: "Susu Full Cream Greenfields",
      qty: 3,
      unit: "liter",
      cat: "Pemakaian Produksi",
      by: "Adit Juru Saji",
      shift: "Pagi (06:00–14:00)",
      note: "Untuk menu latte & cappuccino"
    }
  ],
  wastes: [
    {
      id: "W-1",
      time: "2026-05-31 22:15:44",
      rawDate: "2026-05-31",
      code: "SU-001",
      name: "Susu Full Cream Greenfields",
      qty: 1,
      unit: "liter",
      cause: "Kadaluarsa / Expired",
      loss: 22000,
      by: "Restu Closing Staff",
      action: "Susu tertinggal di bar semalaman dan asam. Harus disiplin simpan chiller selesai shift."
    }
  ],
  grns: [
    {
      id: "G-1",
      no: "GRN-098801",
      date: "2026-05-30",
      supplier: "Tanamera Coffee",
      by: "Mega Supervisor",
      dest: "gudang",
      items: [
        { code: "BK-001", name: "Biji Kopi Blend Espresso", qty: 5, unit: "kg", kondisi: "✓ Baik" }
      ],
      totalQty: 5,
      totalItems: 1
    }
  ],
  prs: [
    {
      id: "P-1",
      no: "PR-384911",
      date: "2026-06-01",
      by: "Dario Cafe Manager",
      supplier: "Oatside Distributor",
      items: [
        { code: "SU-003", name: "Oat Milk Oatside Barista", qty: 12, unit: "liter", price: 45000, subtotal: 540000 }
      ],
      total: 540000,
      status: "Menunggu Approval"
    }
  ],
  transfers: [
    {
      id: "TX-1",
      time: "2026-06-01 06:15:00",
      date: "2026-06-01",
      code: "BK-001",
      name: "Biji Kopi Blend Espresso",
      qty: 1,
      unit: "kg",
      from: "gudang",
      to: "bar",
      reason: "Persiapan Bar Pagi",
      by: "Dario Bartender"
    }
  ],
  activities: [
    {
      id: "ACT-1",
      icon: "📤",
      text: "Pemakaian 3 liter Susu Full Cream Greenfields oleh Adit Juru Saji",
      type: "out",
      time: "2026-06-01 09:15:00"
    },
    {
      id: "ACT-2",
      icon: "📤",
      text: "Pemakaian 0.5 kg Biji Kopi Blend Espresso oleh Dario Bartender",
      type: "out",
      time: "2026-06-01 08:30:15"
    },
    {
      id: "ACT-3",
      icon: "🛒",
      text: "Pengajuan PR-384911 untuk Oat Milk Oatside Barista oleh Dario Cafe Manager",
      type: "pr",
      time: "2026-06-01 07:05:00"
    }
  ],
  users: [
    { id: "u-service", name: "Budi Service", role: "Service Staff", pin: "9999", staffCode: "SVC001", email: "budi@gmail.com", whatsappNumber: "081234567890", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u-waiter", name: "Andi Waiter", role: "Waiter", pin: "1111", staffCode: "WTR001", email: "andi@gmail.com", whatsappNumber: "628123333444", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u-hwaiter", name: "Siti Head Waiter", role: "Head Waiter", pin: "2222", staffCode: "HWT001", email: "siti@gmail.com", whatsappNumber: "628124444555", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u1", name: "Dario Owner", role: "Owner", pin: "1234", staffCode: "OWN001", email: "muhammaddario09@gmail.com", whatsappNumber: "628123456789", password: "123456", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u2", name: "Mega Manager", role: "Manager", pin: "8888", staffCode: "MGR001", email: "mega@gmail.com", whatsappNumber: "628987654321", password: "123456", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u3", name: "Hendra Head Barista", role: "Head Barista", pin: "7777", staffCode: "HBR001", email: "hendra@gmail.com", whatsappNumber: "628111222333", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u4", name: "Adit Barista", role: "Barista", pin: "0000", staffCode: "BAR001", email: "adit@gmail.com", whatsappNumber: "628222333444", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" },
    { id: "u5", name: "Chaca Cashier", role: "Cashier", pin: "5555", staffCode: "CSH001", email: "chaca@gmail.com", whatsappNumber: "628333444555", isActive: true, branchId: "Pusat Pangkalpinang (HQ)" }
  ],
  attendance: [
    {
      id: "att-1",
      userId: "u3",
      userName: "Adit Barista",
      role: "Barista",
      date: "2026-06-01",
      checkIn: "05:45",
      checkOut: "14:15",
      shift: "Pagi (06:00–14:00)",
      status: "Hadir",
      hoursWorked: 8.5
    },
    {
      id: "att-2",
      userId: "u2",
      userName: "Mega Manager",
      role: "Manager",
      date: "2026-06-01",
      checkIn: "07:50",
      checkOut: undefined,
      shift: "Pagi (06:00–14:00)",
      status: "Hadir"
    }
  ],
  recipes: [
    {
      id: "R-001",
      name: "Americano (Hot/Ice)",
      category: "Coffee",
      sellPrice: 28000,
      ingredients: [
        { code: "BK-001", qty: 0.018 },
        { code: "KM-001", qty: 1 }
      ]
    },
    {
      id: "R-002",
      name: "Caffe Latte (Full Cream)",
      category: "Milk-based",
      sellPrice: 35000,
      ingredients: [
        { code: "BK-001", qty: 0.018 },
        { code: "SU-001", qty: 0.150 },
        { code: "KM-001", qty: 1 }
      ]
    },
    {
      id: "R-003",
      name: "Caffe Oatside Latte",
      category: "Milk-based",
      sellPrice: 40000,
      ingredients: [
        { code: "BK-001", qty: 0.018 },
        { code: "SU-003", qty: 0.150 },
        { code: "KM-001", qty: 1 }
      ]
    },
    {
      id: "R-004",
      name: "Sweet Vanilla Latte",
      category: "Milk-based",
      sellPrice: 38000,
      ingredients: [
        { code: "BK-001", qty: 0.018 },
        { code: "SU-001", qty: 0.130 },
        { code: "SI-001", qty: 0.02 },
        { code: "KM-001", qty: 1 }
      ]
    },
    {
      id: "R-005",
      name: "Ice Premium Chocolate",
      category: "Non-Coffee",
      sellPrice: 32000,
      ingredients: [
        { code: "PW-001", qty: 0.03 },
        { code: "SU-001", qty: 0.150 },
        { code: "SI-005", qty: 0.01 },
        { code: "KM-001", qty: 1 }
      ]
    },
    {
      id: "R-006",
      name: "Kyoto Uji Matcha Latte",
      category: "Non-Coffee",
      sellPrice: 37000,
      ingredients: [
        { code: "PW-002", qty: 6 },
        { code: "SU-001", qty: 0.150 },
        { code: "SI-005", qty: 0.01 },
        { code: "KM-001", qty: 1 }
      ]
    }
  ],
  sales: [
    { id: "S-101", recipeId: "R-001", recipeName: "Americano (Hot/Ice)", qty: 12, sellPrice: 28000, totalRevenue: 336000, totalCost: 50280, date: "2026-05-25", by: "Adit Barista" },
    { id: "S-102", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 25, sellPrice: 35000, totalRevenue: 875000, totalCost: 187250, date: "2026-05-25", by: "Adit Barista" },
    { id: "S-103", recipeId: "R-003", recipeName: "Caffe Oatside Latte", qty: 15, sellPrice: 40000, totalRevenue: 600000, totalCost: 164100, date: "2026-05-25", by: "Adit Barista" },
    
    { id: "S-104", recipeId: "R-001", recipeName: "Americano (Hot/Ice)", qty: 15, sellPrice: 28000, totalRevenue: 420000, totalCost: 62850, date: "2026-05-26", by: "Adit Barista" },
    { id: "S-105", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 32, sellPrice: 35000, totalRevenue: 1120000, totalCost: 239680, date: "2026-05-26", by: "Mega Manager" },
    { id: "S-106", recipeId: "R-005", recipeName: "Ice Premium Chocolate", qty: 10, sellPrice: 32000, totalRevenue: 320000, totalCost: 78000, date: "2026-05-26", by: "Adit Barista" },

    { id: "S-107", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 28, sellPrice: 35000, totalRevenue: 980000, totalCost: 209720, date: "2026-05-27", by: "Adit Barista" },
    { id: "S-108", recipeId: "R-003", recipeName: "Caffe Oatside Latte", qty: 20, sellPrice: 40000, totalRevenue: 800000, totalCost: 218800, date: "2026-05-27", by: "Mega Manager" },
    { id: "S-109", recipeId: "R-004", recipeName: "Sweet Vanilla Latte", qty: 8, sellPrice: 38000, totalRevenue: 304000, totalCost: 75120, date: "2026-05-27", by: "Adit Barista" },

    { id: "S-110", recipeId: "R-001", recipeName: "Americano (Hot/Ice)", qty: 10, sellPrice: 28000, totalRevenue: 280000, totalCost: 41900, date: "2026-05-28", by: "Adit Barista" },
    { id: "S-111", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 30, sellPrice: 35000, totalRevenue: 1050000, totalCost: 224700, date: "2026-05-28", by: "Adit Barista" },
    { id: "S-112", recipeId: "R-006", recipeName: "Kyoto Uji Matcha Latte", qty: 12, sellPrice: 37000, totalRevenue: 444000, totalCost: 112100, date: "2026-05-28", by: "Adit Barista" },

    { id: "S-113", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 35, sellPrice: 35000, totalRevenue: 1225000, totalCost: 262150, date: "2026-05-29", by: "Adit Barista" },
    { id: "S-114", recipeId: "R-003", recipeName: "Caffe Oatside Latte", qty: 18, sellPrice: 40000, totalRevenue: 720000, totalCost: 196920, date: "2026-05-29", by: "Mega Manager" },
    
    { id: "S-115", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 40, sellPrice: 35000, totalRevenue: 1400000, totalCost: 299600, date: "2026-05-30", by: "Mega Manager" },
    { id: "S-116", recipeId: "R-004", recipeName: "Sweet Vanilla Latte", qty: 15, sellPrice: 38000, totalRevenue: 570000, totalCost: 140850, date: "2026-05-30", by: "Adit Barista" },
    
    { id: "S-117", recipeId: "R-003", recipeName: "Caffe Oatside Latte", qty: 22, sellPrice: 40000, totalRevenue: 880000, totalCost: 240680, date: "2026-05-31", by: "Mega Manager" },
    { id: "S-118", recipeId: "R-005", recipeName: "Ice Premium Chocolate", qty: 18, sellPrice: 32000, totalRevenue: 576000, totalCost: 140400, date: "2026-05-31", by: "Adit Barista" },

    { id: "S-119", recipeId: "R-002", recipeName: "Caffe Latte (Full Cream)", qty: 14, sellPrice: 35000, totalRevenue: 490000, totalCost: 104860, date: "2026-06-01", by: "Adit Barista" },
    { id: "S-120", recipeId: "R-003", recipeName: "Caffe Oatside Latte", qty: 9, sellPrice: 40000, totalRevenue: 360000, totalCost: 98460, date: "2026-06-01", by: "Adit Barista" }
  ],
  homemadeIngredients: [
    {
      id: "HM-001",
      name: "Vanilla Syrup (1:1 Internal)",
      yieldQty: 1000,
      yieldUnit: "ml",
      ingredients: [
        { code: "SI-005", qty: 0.5 }, // 0.5 kg (500 gr) Gula Pasir
        { code: "SI-001", qty: 0.2 }  // 0.2 botol (150 ml) sirup vanilla toffin
      ],
      category: "Syrup",
      description: "Vanilla syrup racikan barista dengan tekstur bodi yang tebal hasil rebusan gula murni 1:1."
    },
    {
      id: "HM-002",
      name: "Spiced Cardamom Cordial",
      yieldQty: 500,
      yieldUnit: "ml",
      ingredients: [
        { code: "SI-005", qty: 0.3 }  // 0.3 kg Gula
      ],
      category: "Cordial",
      description: "Cordial kapulaga pekat untuk campuran es kopi susu signature dan mocktail aromatik."
    }
  ],
  dailyChecklists: [
    {
      id: "CH-001",
      type: "opening",
      date: "2026-06-01",
      time: "05:50",
      staff: "Adit Barista",
      shift: "Pagi",
      outlet: "Bar Utama",
      status: "Selesai",
      notes: "Semua mesin menyala lancar, par stock aman.",
      items: [
        { id: "op-1", category: "Mesin Espresso", task: "Mesin menyala", completed: true },
        { id: "op-2", category: "Mesin Espresso", task: "Tekanan boiler normal", completed: true },
        { id: "op-3", category: "Mesin Espresso", task: "Group head bersih", completed: true },
        { id: "op-4", category: "Mesin Espresso", task: "Backflush selesai", completed: true },
        { id: "op-5", category: "Grinder", task: "Hopper bersih", completed: true },
        { id: "op-6", category: "Grinder", task: "Kalibrasi dilakukan", completed: true },
        { id: "op-7", category: "Grinder", task: "Dose sesuai standar", completed: true },
        { id: "op-8", category: "Bar", task: "Es batu tersedia", completed: true },
        { id: "op-9", category: "Bar", task: "Susu tersedia", completed: true },
        { id: "op-10", category: "Bar", task: "Syrup tersedia", completed: true },
        { id: "op-11", category: "Bar", task: "Cup tersedia", completed: true },
        { id: "op-12", category: "Kebersihan", task: "Lantai bersih", completed: true },
        { id: "op-13", category: "Kebersihan", task: "Toilet bersih", completed: true },
        { id: "op-14", category: "Kebersihan", task: "Area customer bersih", completed: true }
      ]
    },
    {
      id: "CH-002",
      type: "cleaning",
      date: "2026-06-01",
      time: "14:15",
      staff: "Mega Manager",
      shift: "Pagi",
      outlet: "Bar Utama",
      status: "Selesai",
      items: [
        { id: "cln-1", category: "Espresso Machine", task: "Backflush detergent", completed: true },
        { id: "cln-2", category: "Espresso Machine", task: "Backflush water", completed: true },
        { id: "cln-3", category: "Espresso Machine", task: "Steam wand cleaning", completed: true },
        { id: "cln-4", category: "Grinder", task: "Hopper cleaning", completed: true },
        { id: "cln-5", category: "Grinder", task: "Burr inspection", completed: true },
        { id: "cln-6", category: "Bar Area", task: "Counter cleaning", completed: true },
        { id: "cln-7", category: "Bar Area", task: "Sink cleaning", completed: true }
      ]
    }
  ],
  calibrationLogs: [
    {
      id: "CAL-001",
      date: "2026-06-01",
      time: "06:15",
      coffeeBatch: "Ethiopia Blend",
      dose: 18.0,
      yield: 36.0,
      timeSec: 29,
      grinderSetting: "4.2",
      barista: "Adit Barista",
      status: "Pass",
      notes: "Ekstraksi manis kental, bodi tebal."
    }
  ],
  stockCheckLogs: [
    {
      id: "SC-001",
      date: "2026-06-01",
      staff: "Mega Manager",
      items: [
        { code: "SU-001", name: "Susu Full Cream Greenfields", systemQty: 12.0, actualQty: 11.5, unit: "liter", variance: -0.5, varianceCost: -11000 }
      ],
      notes: "Susu tumpah dikit saat bikin kalibrasi."
    }
  ],
  temperatureLogs: [
    {
      id: "TMP-001",
      date: "2026-06-01",
      time: "08:00",
      staff: "Mega Manager",
      chillerTemp: 3,
      freezerTemp: -18,
      milkStorageTemp: 4,
      status: "OK",
      notes: "Semua pendingin operasional normal."
    }
  ],
  shiftHandovers: [
    {
      id: "HND-001",
      date: "2026-06-01",
      time: "14:05",
      fromShift: "Pagi",
      toShift: "Siang",
      staffFrom: "Adit Barista",
      staffTo: "Mega Manager",
      notes: "Susu di bar tersisa 4 liter. Vanilla Syrup buatan homemade tinggal 1 botol, tolong diproduksi lagi. Grinder setting di 4.2 aman.",
      items: [
        { label: "Sisa Susu Creamer", value: "4 Liter" },
        { label: "Stok Vanilla Syrup", value: "Hampir habis" },
        { label: "Setelan Grinder Pagi", value: "4.2 stable" }
      ],
      isConfirmed: true,
      confirmedAt: "14:10"
    }
  ],
  incidentLogs: [
    {
      id: "INC-001",
      date: "2026-06-01",
      time: "10:30",
      pic: "Mega Manager",
      category: "Grinder Macet",
      description: "Grinder blend kedua sempat terselip batu kecil sehingga motor mandek berbunyi keras.",
      actionTaken: "Grinder dimatikan, burr dibongkar, batu dikeluarkan secara hati-hati, burr disikat bersih dan dirakit ulang. Berfungsi normal."
    }
  ],
  auditLogs: [
    {
      id: "AUD-1",
      user: "Dario Owner",
      role: "Owner",
      action: "Login ke sistem",
      page: "Login Screen",
      timestamp: "2026-06-01 06:10:00",
      device: "Chrome / Windows 11",
      ip: "192.168.1.100"
    },
    {
      id: "AUD-2",
      user: "Hendra Head Barista",
      role: "Head Barista",
      action: "Melakukan Kalibrasi Rasa Espresso",
      page: "Daily Checklists & Ops",
      timestamp: "2026-06-01 06:15:30",
      device: "Chrome / Android Unit Bar",
      ip: "192.168.1.102"
    }
  ],
  suppliers: [
    {
      id: "sup-1",
      name: "Tanamera Coffee Wholesale",
      category: "Coffee",
      contactPerson: "Bambang Wijaya",
      phone: "628123456789",
      email: "wholesale@tanameracoffee.com",
      address: "Kawasan Industri Gading, Jakarta",
      leadTimeDays: 2,
      paymentTerms: "COD",
      rating: 95,
      deliveryAccuracy: 98,
      productQuality: 96,
      priceStability: 90,
      responseTime: 95
    },
    {
      id: "sup-2",
      name: "Greenfields Indonesia Corp",
      category: "Dairy",
      contactPerson: "Sherly Putricia",
      phone: "628998877665",
      email: "order@greenfields milk.co.id",
      address: "Malang, Jawa Timur",
      leadTimeDays: 1,
      paymentTerms: "Term of 14 Days",
      rating: 90,
      deliveryAccuracy: 92,
      productQuality: 95,
      priceStability: 85,
      responseTime: 88
    },
    {
      id: "sup-3",
      name: "Toffin Indonesia Cabang Utama",
      category: "Syrup",
      contactPerson: "Andry Kurniawan",
      phone: "628555123456",
      email: "sales@toffin.co.id",
      address: "Kb Jeruk, Jakarta Barat",
      leadTimeDays: 3,
      paymentTerms: "Term of 30 Days",
      rating: 88,
      deliveryAccuracy: 90,
      productQuality: 92,
      priceStability: 80,
      responseTime: 90
    },
    {
      id: "sup-4",
      name: "Multi Kemasan Packindo",
      category: "Packaging",
      contactPerson: "Diana Lestari",
      phone: "62811223344",
      email: "order@multikemasan.com",
      address: "Tangerang, Banten",
      leadTimeDays: 4,
      paymentTerms: "CBD (Cash Before Delivery)",
      rating: 85,
      deliveryAccuracy: 88,
      productQuality: 82,
      priceStability: 85,
      responseTime: 85
    }
  ],
  supplierMapping: {
    "BK-001": { primary: "Tanamera Coffee Wholesale", secondary: "Two Hands Coffee Beans", emergency: "Anomali Coffee Emergency Spot" },
    "BK-002": { primary: "Two Hands Coffee Beans", secondary: "Tanamera Coffee Wholesale", emergency: "Anomali Coffee Emergency Spot" },
    "SU-001": { primary: "Greenfields Indonesia Corp", secondary: "Diamond Milk Supplier", emergency: "Indomaret Point Supermarket" },
    "SU-003": { primary: "Oatside Official Distributor", secondary: "Toffin Indonesia Cabang Utama", emergency: "Indomaret Point Supermarket" },
    "SI-001": { primary: "Toffin Indonesia Cabang Utama", secondary: "Multi Kemasan Packindo", emergency: "Superindo terdekat" }
  },
  pos: [
    {
      id: "PO-001",
      poNumber: "PO-2026-0601-01",
      date: "2026-06-01",
      supplierId: "sup-1",
      supplierName: "Tanamera Coffee Wholesale",
      items: [
        { code: "BK-001", name: "Biji Kopi Blend Espresso", qty: 20, unit: "kg", price: 180000, subtotal: 3600000 }
      ],
      total: 3600000,
      status: "Dikirim ke Supplier"
    },
    {
      id: "PO-002",
      poNumber: "PO-2026-0601-02",
      date: "2026-06-01",
      supplierId: "sup-2",
      supplierName: "Greenfields Indonesia Corp",
      items: [
        { code: "SU-001", name: "Susu Full Cream Greenfields", qty: 30, unit: "liter", price: 22000, subtotal: 660000 }
      ],
      total: 660000,
      status: "Selesai"
    }
  ],
  reportSettings: {
    managerEmail: "mega.manager@leparla-cafe.com",
    managerWhatsapp: "6282123456789",
    isManagerEmailEnabled: true,
    isManagerWhatsappEnabled: true,
    ownerEmail: "owner@leparla-group.com",
    isOwnerEmailEnabled: true,
    emailService: "Gmail"
  },
  reportQueue: [
    {
      id: "REP-LOG-001",
      type: "weekly_manager",
      recipient: "mega.manager@leparla-cafe.com",
      scheduleDate: "2026-06-08",
      sentDate: undefined,
      status: "Pending",
      subject: "Le Parla Café - Weekly Operational Summaries [Automated]"
    },
    {
      id: "REP-LOG-002",
      type: "monthly_owner",
      recipient: "owner@leparla-group.com",
      scheduleDate: "2026-07-01",
      sentDate: undefined,
      status: "Pending",
      subject: "Le Parla Group - Monthly Financial Consolidation & Audit [Automated]"
    },
    {
      id: "REP-LOG-003",
      type: "monthly_owner",
      recipient: "owner@leparla-group.com",
      scheduleDate: "2026-06-01",
      sentDate: "2026-06-01 00:05",
      status: "Terkirim",
      pdfLink: "/api/download-stored-report/2026-05",
      subject: "Le Parla Group - Monthly Financial Consolidation & Audit Report (Mei 2026)"
    }
  ],
  fohChecklists: [
    {
      id: "foh-chk-1",
      type: "opening",
      date: "2026-06-02",
      time: "06:15",
      shift: "Pagi",
      staffName: "Andi Waiter",
      role: "Waiter",
      items: [
        { task: "Area Dining Bersih", completed: true },
        { task: "Semua Meja Bersih", completed: true },
        { task: "Kursi Rapi", completed: true },
        { task: "Tissue Lengkap", completed: true },
        { task: "Menu Tersedia", completed: true },
        { task: "QR Menu Berfungsi", completed: true },
        { task: "Toilet Bersih", completed: true },
        { task: "Tempat Sampah Kosong", completed: true }
      ],
      photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=60",
      status: "Approved"
    }
  ],
  fohFeedback: [
    {
      id: "fb-1",
      customerName: "Rudi H.",
      rating: 5,
      feedback: "Pelayanan sangat cepat, keramahan waiter luar biasa!",
      date: "2026-06-02"
    },
    {
      id: "fb-2",
      customerName: "Sonia G.",
      rating: 4,
      feedback: "Meja bersih, condimen lengkap. Americano segar.",
      date: "2026-06-02"
    }
  ],
  fohComplaints: [
    {
      id: "cpl-1",
      detail: "Tissue di meja 4 sempat habis pas jam padat siang.",
      tableId: "Meja 4",
      timestamp: "2026-06-02 11:30",
      solution: "Di-refill segera oleh Andi dan meminta maaf.",
      status: "Closed"
    }
  ],
  fohTables: [
    { id: "tbl-1", name: "Meja 1 (VIP)", status: "Reserved" },
    { id: "tbl-2", name: "Meja 2", status: "Occupied" },
    { id: "tbl-3", name: "Meja 3", status: "Available" },
    { id: "tbl-4", name: "Meja 4", status: "Cleaning Needed" },
    { id: "tbl-5", name: "Meja 5", status: "Available" },
    { id: "tbl-6", name: "Meja 6", status: "Occupied" }
  ],
  fohInventory: [
    { id: "fi-1", name: "Tissue", category: "Consumables", qty: 250, unit: "pack", parLevel: 100 },
    { id: "fi-2", name: "Wet Tissue", category: "Consumables", qty: 85, unit: "pack", parLevel: 50 },
    { id: "fi-3", name: "Sedotan", category: "Consumables", qty: 1200, unit: "pcs", parLevel: 500 },
    { id: "fi-4", name: "Paper Bag", category: "Consumables", qty: 320, unit: "pcs", parLevel: 200 },
    { id: "fi-5", name: "Cup Carrier", category: "Consumables", qty: 150, unit: "pcs", parLevel: 100 },
    { id: "fi-6", name: "Takeaway Lid", category: "Consumables", qty: 400, unit: "pcs", parLevel: 200 },
    { id: "fi-7", name: "Menu Holder", category: "Dining Equipment", qty: 20, unit: "pcs", parLevel: 20 },
    { id: "fi-8", name: "Table Number", category: "Dining Equipment", qty: 30, unit: "pcs", parLevel: 30 },
    { id: "fi-9", name: "Tray", category: "Dining Equipment", qty: 15, unit: "pcs", parLevel: 15 },
    { id: "fi-10", name: "Water Jug", category: "Dining Equipment", qty: 8, unit: "pcs", parLevel: 8 }
  ],
  fohInventoryRequests: [
    { id: "req-1", name: "Tissue", qty: 20, reason: "Stok meja menipis sisa 3 pack", requestedBy: "Andi Waiter", status: "Approved" }
  ],
  fohKpis: [
    {
      id: "kpi-1",
      staffName: "Andi Waiter",
      period: "Mei 2026",
      attendance: 98,
      sopCompletion: 95,
      customerRating: 94,
      complaintResolution: 100,
      checklistCompletion: 96,
      trainingCompletion: 100,
      score: 96.5,
      category: "Excellent"
    }
  ],
  fohShifts: [
    { id: "sh-1", date: "2026-06-02", staffName: "Andi Waiter", shift: "Pagi", type: "Work", status: "Approved" },
    { id: "sh-2", date: "2026-06-02", staffName: "Siti Head Waiter", shift: "Siang", type: "Work", status: "Approved" }
  ],
  fohTraining: [
    {
      id: "tr-1",
      title: "Product Knowledge",
      category: "Product Knowledge",
      contentUrl: "Edukasi mendalam tentang racikan sajian kopi, non-kopi, dan pastry unggulan Le Parla Café.",
      quiz: [
        {
          question: "Berapa rasio espresso pada Coffee Latte standar?",
          options: ["1:1", "1:2", "1:3", "1:5"],
          answer: "1:2"
        }
      ]
    },
    {
      id: "tr-2",
      title: "Customer Service & Hospitality",
      category: "Customer Service",
      contentUrl: "SOP Menyapa, Melayani, Mengatasi komplain, dan mengantar pelanggan dengan senyum ramah.",
      quiz: [
        {
          question: "Apa tindakan pertama saat menerima komplain makanan dingin?",
          options: ["Meminta maaf & mengganti dengan yang baru/membakarnya", "Berdebat dengan pelanggan", "Mengabaikan", "Menyuruh pelanggan ke dapur"],
          answer: "Meminta maaf & mengganti dengan yang baru/membakarnya"
        }
      ]
    }
  ],
  fohTrainingResults: [
    { id: "res-1", staffName: "Andi Waiter", trainingTitle: "Product Knowledge", score: 100, passed: true, date: "2026-06-01" }
  ],
  fohChecklistTasks: {
    opening: [
      "Area Dining Bersih",
      "Semua Meja Bersih",
      "Kursi Rapi",
      "Tissue Lengkap",
      "Menu Tersedia",
      "QR Menu Berfungsi",
      "Toilet Bersih",
      "Tempat Sampah Kosong"
    ],
    service: [
      "Greeting Customer",
      "Table Monitoring",
      "Complaint Handling",
      "Refill Condiment Station",
      "Refill Tissue"
    ],
    closing: [
      "Semua Meja Dibersihkan",
      "Lantai Dibersihkan",
      "Toilet Dibersihkan",
      "Sampah Dibuang",
      "Area Aman",
      "Lampu Dicek"
    ]
  },
  sopsList: [
    {
      id: "sop-1",
      title: "Kalibrasi Espresso Grinder Pagi",
      category: "Bar SOP",
      steps: [
        "Bersihkan hopper grinder dari residu minyak kopi kemari.",
        "Timbang biji kopi espresso blend sebanyak 18.0 gram presisi.",
        "Lakukan giling espresso ke portafilter double shot.",
        "Lakukan ekstraksi espresso shot target yield 36.0 gram dalam waktu 28-32 detik.",
        "Uji rasa rasa manis, keasaman, dan bodi. Sesuaikan setting burr jika ekstraksi terlalu cepat atau lambat."
      ],
      version: "V1.2",
      lastReviewDate: "2026-06-01",
      attachments: [
        { type: "PDF", name: "Panduan_Grinder_Mahlkonig.pdf", url: "https://example.com/docs/panduan_grinder.pdf" },
        { type: "JPG", name: "Tingkat_Kehalusan_Bubuk.jpg", url: "https://example.com/images/kehalusan.jpg" }
      ],
      history: [
        { id: "h-1-1", version: "V1.0", date: "2026-05-10", editor: "Hendra Head Barista", notes: "Inisiasi draf awal SOP kalibrasi espresso berdasar biji House Blend baru." },
        { id: "h-1-2", version: "V1.1", date: "2026-05-20", editor: "Dario Owner", notes: "Koreksi rentang waktu esktraksi target dari 25-30 detik menjadi 28-32 detik demi kemanisan optimal." },
        { id: "h-1-3", version: "V1.2", date: "2026-06-01", editor: "Mega Manager", notes: "Update langkah pengecekan minyak kopi di hopper pagi." }
      ]
    },
    {
      id: "sop-2",
      title: "Penyeduhan Manual Brew V60 (Rasio Standar)",
      category: "Brewing SOP",
      steps: [
        "Lipas kertas saring V60 dan bilas dengan air panas suhu 93°C untuk menghilangkan bau kertas.",
        "Timbang 15.0 gram biji kopi single origin, giling dengan kehalusan medium-coarse.",
        "Gunakan rasio 1:15, total air seduhan 225 ml.",
        "Lakukan blooming sebanyak 30 ml air selama 45 detik, aduk perlahan agar gas CO2 keluar.",
        "Tuang air bertahap: tuangan kedua hingga 120 ml, tuangan ketiga hingga selesai 225 ml dengan total brewing time 2:15 - 2:30."
      ],
      version: "V1.0",
      lastReviewDate: "2026-05-15",
      attachments: [
        { type: "MP4", name: "Video_Tutorial_V60_Aromatik.mp4", url: "https://example.com/videos/v60.mp4" }
      ],
      history: [
        { id: "h-2-1", version: "V1.0", date: "2026-05-15", editor: "Hendra Head Barista", notes: "Rilis perdana rasio 1:15 pour over standar." }
      ]
    },
    {
      id: "sop-3",
      title: "SOP Greeting dan Hospitalitas Pelanggan",
      category: "Service SOP",
      steps: [
        "Ucapkan salam hangat dengan tersenyum: 'Selamat datang di Le Parla Café! Berapa orang, Kak?'",
        "Antarkan pelanggan ke meja kosong yang bersih pilihan mereka.",
        "Berikan menu fisik atau beri instruksi pemindaian QR Code di atas meja.",
        "Ambil pesanan dengan ramah, ulangi pesanan kembali sebelum dicetak ke POS.",
        "Ucapkan terima kasih dan 'Selamat menikmati waktu Anda di Le Parla!'"
      ],
      version: "V1.1",
      lastReviewDate: "2026-05-25",
      attachments: [
        { type: "DOCX", name: "Hospitality_Standards_Core.docx", url: "https://example.com/docs/hospitality.docx" }
      ],
      history: [
        { id: "h-3-1", version: "V1.0", date: "2026-05-01", editor: "Mega Manager", notes: "Draf awal untuk tim waiter." },
        { id: "h-3-2", version: "V1.1", date: "2026-05-25", editor: "Siti Head Waiter", notes: "Tambahan instruksi pemindaian QR menu di atas meja." }
      ]
    }
  ],
  equipmentList: [
    {
      id: "eq-1",
      assetId: "EQ-COF-001",
      name: "La Marzocco Linea PB 2-Group",
      brand: "La Marzocco",
      model: "Linea PB 2-Group Auto",
      serialNumber: "LM-PB-93821038",
      purchasePrice: 145000000,
      supplier: "Toffin Indonesia Cabang Utama",
      location: "Main Coffee Bar",
      department: "Coffee Equipment",
      status: "Aktif",
      warrantyExpiry: "2027-01-15",
      economicLifeYears: 8,
      purchaseDate: "2024-01-15",
      maintenanceSchedule: "Monthly",
      maintenanceHistory: [
        { id: "emh-1", date: "2026-05-10", technician: "Beni (Toffin Representative)", notes: "Penggantian karet group head gasket, shower screen baru, kalibrasi tekanan boiler ke 9 Bar harian stabil.", cost: 1250000 },
        { id: "emh-2", date: "2026-04-12", technician: "Adit Barista", notes: "Pembersihan menyeluruh, descaling manual boiler penampung air.", cost: 150000 }
      ]
    },
    {
      id: "eq-2",
      assetId: "EQ-COF-002",
      name: "Mahlkönig EK43S White Edition",
      brand: "Mahlkönig",
      model: "EK43S Commercial Grinder",
      serialNumber: "MK-S-904921",
      purchasePrice: 48000000,
      supplier: "Toffin Indonesia Cabang Utama",
      location: "Manual Brew Station",
      department: "Coffee Equipment",
      status: "Aktif",
      warrantyExpiry: "2026-03-10",
      economicLifeYears: 6,
      purchaseDate: "2024-03-10",
      maintenanceSchedule: "Quarterly",
      maintenanceHistory: [
        { id: "emh-3", date: "2026-04-20", technician: "Hendra Head Barista", notes: "Bongkar burr besar, pembersihan kerak kopi dengan sikat halus, kalibrasi titik nol geser gigi.", cost: 200000 }
      ]
    },
    {
      id: "eq-3",
      assetId: "EQ-KIT-001",
      name: "Electrolux Professional Combi Oven",
      brand: "Electrolux",
      model: "AOS061EBA2 6-Tray",
      serialNumber: "EL-OB-4911029",
      purchasePrice: 85000000,
      supplier: "Kitchen Concept Distributor",
      location: "Pastry Kitchen",
      department: "Kitchen Equipment",
      status: "Aktif",
      warrantyExpiry: "2025-05-20",
      economicLifeYears: 5,
      purchaseDate: "2024-05-20",
      maintenanceSchedule: "Weekly",
      maintenanceHistory: [
        { id: "emh-4", date: "2026-05-25", technician: "Karya Mandiri Teknik", notes: "Pemeriksaan elemen pemanas bawah, penggantian seal pintu silicone tahan panas.", cost: 850000 }
      ]
    },
    {
      id: "eq-4",
      assetId: "EQ-FOH-001",
      name: "POS Touchscreen System core-i5",
      brand: "iMin",
      model: "Swan 1 POS Dual-Screen",
      serialNumber: "IM-SW-773190",
      purchasePrice: 15000000,
      supplier: "POS Depot Tangerang",
      location: "Kasir Counter",
      department: "FOH Equipment",
      status: "Aktif",
      warrantyExpiry: "2025-02-12",
      economicLifeYears: 4,
      purchaseDate: "2024-02-12",
      maintenanceSchedule: "Annual",
      maintenanceHistory: []
    },
    {
      id: "eq-5",
      assetId: "EQ-SVC-001",
      name: "AC Daikin Multi-Split 2PK",
      brand: "Daikin",
      model: "FTKQ50UVM4 Inverter",
      serialNumber: "DK-AC-103984",
      purchasePrice: 12000000,
      supplier: "Daikin Pro Store Pangkalpinang",
      location: "Dining Area VIP Room",
      department: "Service Equipment",
      status: "Under Repair",
      warrantyExpiry: "2025-06-01",
      economicLifeYears: 5,
      purchaseDate: "2024-06-01",
      maintenanceSchedule: "Quarterly",
      maintenanceHistory: [
        { id: "emh-5", date: "2026-06-02", technician: "Sinar Jaya AC", notes: "Unit mengalami kebocoran freon r32, sedang dicarikan klem tembaga baru.", cost: 450000 }
      ]
    }
  ],
  deviceSessions: [
    {
      id: "sess-1",
      userId: "u1",
      userName: "Dario Owner",
      role: "Owner",
      device: "MacBook Pro M3 Max",
      browser: "Safari Desktop v17.5",
      ip: "103.155.12.98",
      loginTime: "2026-06-02T10:30:15.000Z"
    },
    {
      id: "sess-2",
      userId: "u2",
      userName: "Mega Manager",
      role: "Manager",
      device: "Samsung Galaxy S24 Ultra",
      browser: "Chrome Mobile v125",
      ip: "114.122.56.241",
      loginTime: "2026-06-02T11:15:22.000Z"
    },
    {
      id: "sess-3",
      userId: "u4",
      userName: "Adit Barista",
      role: "Barista",
      device: "Tablet Kasir Android iMin",
      browser: "Opera Kiosk v82",
      ip: "192.168.1.102",
      loginTime: "2026-06-02T16:45:00.000Z"
    }
  ],
  bepData: {
    fixedCost: 45000000,
    variableCostPerCupPercent: 35,
    estimatedAverageTransaction: 35000,
    sampleMonthlyRevenue: 135000000,
    historicalFixedCosts: [
      { label: "Gaji Kru & Staff (7 Orang)", value: 25000000 },
      { label: "Sewa Ruko & Bangunan Strategis", value: 12000000 },
      { label: "Operasional Listrik PLN, Air PDAM & Wi-Fi", value: 5000000 },
      { label: "Kampanye Pemasaran & Keperluan Umum", value: 3000000 }
    ]
  },
  roiData: {
    initialInvestment: 350000000,
    machineryCost: 150000000,
    renovationCost: 120000000,
    furnitureCost: 50000000,
    marketingCost: 30000000,
    roiTrend: [
      { period: "Jan 2026", netProfit: 15200000, investment: 350000000 },
      { period: "Feb 2026", netProfit: 18400000, investment: 350000000 },
      { period: "Mar 2026", netProfit: 22100000, investment: 350000000 },
      { period: "Apr 2026", netProfit: 25600000, investment: 350000000 },
      { period: "Mei 2026", netProfit: 29800000, investment: 350000000 }
    ]
  },
  midtrans_logs: [],
  midtrans_transactions: [],
  midtrans_settings: {
    merchantId: "G110298751",
    clientKey: "SB-Mid-client-K9sN8m2L0a3jB",
    serverKey: "SB-Mid-server-P6qR5s4t3u2vW",
    webhookUrl: "https://ais-dev-gnndydsx4dtdl3hhsvprlk-471490989099.asia-southeast1.run.app/api/midtrans/webhook",
    status: "disconnected",
    webhookVerified: false,
    isSandbox: true
  },
  kdsQueue: [
    {
      id: "ticket-101-B",
      parentOrderId: "POS-2051",
      orderNo: "POS-2051",
      table: "Meja 2",
      items: [{ name: "Caffe Latte Full Cream", qty: 2 }],
      department: "BARISTA",
      timestamp: "10:15",
      status: "IN_PROGRESS",
      isNew: false,
      history: [
        { status: "PENDING", timestamp: "10:15", updatedBy: "Kasir" },
        { status: "CONFIRMED", timestamp: "10:16", updatedBy: "Kasir" },
        { status: "IN_PROGRESS", timestamp: "10:17", updatedBy: "Barista" }
      ]
    },
    {
      id: "ticket-101-K",
      parentOrderId: "POS-2051",
      orderNo: "POS-2051",
      table: "Meja 2",
      items: [{ name: "Beef Carbonara Pasta", qty: 1 }],
      department: "KITCHEN",
      timestamp: "10:15",
      status: "PENDING",
      isNew: true,
      history: [
        { status: "PENDING", timestamp: "10:15", updatedBy: "Kasir" }
      ]
    },
    {
      id: "ticket-102-K",
      parentOrderId: "POS-2052",
      orderNo: "POS-2052",
      table: "Take Away",
      items: [{ name: "Nasi Goreng Kampung", qty: 1 }],
      department: "KITCHEN",
      timestamp: "10:18",
      status: "PENDING",
      isNew: true,
      history: [
        { status: "PENDING", timestamp: "10:18", updatedBy: "Kasir" }
      ]
    },
    {
      id: "ticket-103-B",
      parentOrderId: "POS-2049",
      orderNo: "POS-2049",
      table: "Meja 1 (VIP)",
      items: [{ name: "Double Espresso", qty: 1 }],
      department: "BARISTA",
      timestamp: "09:55",
      status: "READY",
      isNew: false,
      history: [
        { status: "PENDING", timestamp: "09:55", updatedBy: "Kasir" },
        { status: "CONFIRMED", timestamp: "09:56", updatedBy: "Kasir" },
        { status: "IN_PROGRESS", timestamp: "09:58", updatedBy: "Barista" },
        { status: "READY", timestamp: "10:02", updatedBy: "Barista" }
      ]
    }
  ]
};
