import React, { useState } from "react";
import { CoffeeOpsState, DrinkRecipe, RecipeIngredient, SaleTransaction, IssueItem, ActivityLog, User } from "../types";

interface CogsProps {
  state: CoffeeOpsState;
  currentUser: User | null;
  syncState: (updatedState: CoffeeOpsState) => Promise<void>;
  triggerToast: (message: string) => void;
}

export default function CogsManagement({ state, currentUser, syncState, triggerToast }: CogsProps) {
  const { master, inventory, storage, wastes, users = [], stockMovements = [], activityLogsGlobal = [] } = state;
  const userRole = currentUser?.role || "Barista";
  const isAuthorized = userRole === "Owner" || userRole === "Manager";

  // Tabs for the COGS panel
  const [activeSubTab, setActiveSubTab] = useState<"recipes" | "homemade" | "simulation" | "reports" | "ai">("recipes");

  // Local state for recipes & sales fallback to defaults from data.ts
  const recipesList: DrinkRecipe[] = state.recipes || [];
  const salesList: SaleTransaction[] = state.sales || [];

  // Currently logged-in or default staff list
  const staffList = users.length > 0 ? users : [
    { id: "u1", name: "Dario Owner", role: "Owner", pin: "1234" },
    { id: "u2", name: "Mega Manager", role: "Manager", pin: "8888" },
    { id: "u3", name: "Adit Barista", role: "Barista", pin: "0000" }
  ];

  // Selected recipe detail for "HPP Info" card
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<string | null>(recipesList[0]?.id || null);

  // Simulation Form State
  const [simSaleRecipeId, setSimSaleRecipeId] = useState(recipesList[0]?.id || "");
  const [simSaleQty, setSimSaleQty] = useState<number>(1);
  const [simSaleBy, setSimSaleBy] = useState(staffList[0]?.name || "Adit Barista");

  // Recipe Creation/Edit Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  
  // Recipe form state
  const [recipeFormName, setRecipeFormName] = useState("");
  const [recipeFormCategory, setRecipeFormCategory] = useState("Coffee");
  const [recipeFormSellPrice, setRecipeFormSellPrice] = useState<number>(30000);
  const [recipeFormIngredients, setRecipeFormIngredients] = useState<RecipeIngredient[]>([]);

  // Secret formula state declarations
  const [recipeFormIsSecret, setRecipeFormIsSecret] = useState(false);
  const [recipeFormSecretBaseName, setRecipeFormSecretBaseName] = useState("Kopi Signature Concentrate");
  const [recipeFormSecretBaseQty, setRecipeFormSecretBaseQty] = useState<number>(30);
  const [recipeFormSecretBaseUnit, setRecipeFormSecretBaseUnit] = useState("ml");

  // Temp ingredient builder
  const [currIngCode, setCurrIngCode] = useState(master[0]?.code || "");
  const [currIngQty, setCurrIngQty] = useState<number>(0);

  // ==========================================
  // Homemade Formulation State Engine
  // ==========================================
  const [isHmModalOpen, setIsHmModalOpen] = useState(false);
  const [hmModalMode, setHmModalMode] = useState<"create" | "edit">("create");
  const [editingHmId, setEditingHmId] = useState<string | null>(null);

  const [hmFormName, setHmFormName] = useState("");
  const [hmFormCategory, setHmFormCategory] = useState<"Syrup" | "Cordial" | "Premix" | "Other">("Syrup");
  const [hmFormYieldQty, setHmFormYieldQty] = useState<number>(1000);
  const [hmFormYieldUnit, setHmFormYieldUnit] = useState<"ml" | "gram" | "pcs">("ml");
  const [hmFormDescription, setHmFormDescription] = useState("");
  const [hmFormIngredients, setHmFormIngredients] = useState<{ code: string; qty: number }[]>([]);

  // Temp ingredient builder for homemade formulary
  const [currHmIngCode, setCurrHmIngCode] = useState(master[0]?.code || "");
  const [currHmIngQty, setCurrHmIngQty] = useState<number>(0);

  // Manufacture batch log helper state
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [selectedMfgId, setSelectedMfgId] = useState<string | null>(null);
  const [mfgQtySelect, setMfgQtySelect] = useState<number>(1); // Number of batches to manufacture
  const [mfgBy, setMfgBy] = useState(staffList[0]?.name || "Adit Barista");

  // Master unit converter to recipe-level units (gram, ml, pcs)
  const getUnitConversion = (item: any) => {
    if (!item) {
      return {
        unitLabel: "unit",
        pricePerUnit: 0,
        factor: 1,
      };
    }

    if (item.id && item.id.startsWith("HM-")) {
      const priceVal = calculateIngredientCost(item.id, 1);
      return {
        unitLabel: item.yieldUnit || "ml",
        pricePerUnit: priceVal,
        factor: 1,
      };
    }

    const unitLower = item?.unit?.toLowerCase() || "";
    
    // 1. Gram conversion or kg to gram
    if (unitLower === "kg" || unitLower === "kilogram") {
      return {
        unitLabel: "gram",
        pricePerUnit: item.price / 1000,
        factor: 1000, // 1 kg = 1000 grams
      };
    }
    if (unitLower === "gr" || unitLower === "gram" || unitLower === "g") {
      return {
        unitLabel: "gram",
        pricePerUnit: item.price,
        factor: 1, // 1 gram = 1 gram
      };
    }

    // 2. Ml conversion or liter/botol to ml
    if (unitLower === "liter" || unitLower === "litre" || unitLower === "l") {
      return {
        unitLabel: "ml",
        pricePerUnit: item.price / 1000,
        factor: 1000, // 1 liter = 1000 ml
      };
    }
    if (unitLower === "botol" || unitLower === "bottle") {
      // Standard specialty syrup bottle is 750 ml
      const vol = 750;
      return {
        unitLabel: "ml",
        pricePerUnit: item.price / vol,
        factor: vol, // 1 botol = 750 ml
      };
    }
    if (unitLower === "ml" || unitLower === "mili") {
      return {
        unitLabel: "ml",
        pricePerUnit: item.price,
        factor: 1, // 1 ml = 1 ml
      };
    }

    // 3. Discrete pieces
    return {
      unitLabel: "pcs",
      pricePerUnit: item.price,
      factor: 1, // 1 pcs = 1 ...
    };
  };

  // Helper: Calc cost of a single ingredient (supports both Raw master food items and complex Homemade Ingredients recursive formula)
  const calculateIngredientCost = (code: string, qty: number): number => {
    if (code.startsWith("HM-")) {
      const hmList = state.homemadeIngredients || [];
      const hm = hmList.find((h) => h.id === code);
      if (!hm) return 0;
      
      // Calculate formula raw cost recursively
      let formulaTotalCost = 0;
      hm.ingredients.forEach((ing) => {
        formulaTotalCost += calculateIngredientCost(ing.code, ing.qty);
      });
      
      const costPerUnit = hm.yieldQty > 0 ? formulaTotalCost / hm.yieldQty : 0;
      return costPerUnit * qty;
    }

    const item = master.find((m) => m.code === code);
    if (!item) return 0;
    return item.price * qty;
  };

  // Helper: Calc total HPP cost of a recipe
  const calculateRecipeTotalCost = (recipe: DrinkRecipe): number => {
    return recipe.ingredients.reduce((sum, ing) => {
      return sum + calculateIngredientCost(ing.code, ing.qty);
    }, 0);
  };

  // Setup Default Input states on list modifications
  const syncSimulationDefaults = (updatedRecipes: DrinkRecipe[]) => {
    if (updatedRecipes.length > 0) {
      if (!simSaleRecipeId || !updatedRecipes.find(r => r.id === simSaleRecipeId)) {
        setSimSaleRecipeId(updatedRecipes[0].id);
      }
      if (!selectedRecipeDetail || !updatedRecipes.find(r => r.id === selectedRecipeDetail)) {
        setSelectedRecipeDetail(updatedRecipes[0].id);
      }
    }
  };

  // Add ingredient callback from Recipe Unit Form Input
  const handleAddIngredientToForm = () => {
    if (!currIngCode || currIngQty <= 0) {
      triggerToast("Pilih bahan baku dan masukkan takaran resep yang valid.");
      return;
    }

    let baseQty = 0;
    if (currIngCode.startsWith("HM-")) {
      const hmList = state.homemadeIngredients || [];
      const hmItem = hmList.find(h => h.id === currIngCode);
      if (!hmItem) return;
      // Already calibrated to standard yield unit, direct 1:1 match
      baseQty = currIngQty;
    } else {
      const item = master.find(m => m.code === currIngCode);
      if (!item) return;
      const conv = getUnitConversion(item);
      // Convert recipe unit quantity (e.g. 18 grams) to base inventory quantity (e.g. 0.018 kg)
      baseQty = parseFloat((currIngQty / conv.factor).toFixed(6));
    }

    // Check if duplicate
    const existsIdx = recipeFormIngredients.findIndex(ri => ri.code === currIngCode);
    if (existsIdx !== -1) {
      const updated = [...recipeFormIngredients];
      updated[existsIdx].qty = parseFloat((updated[existsIdx].qty + baseQty).toFixed(6));
      setRecipeFormIngredients(updated);
    } else {
      setRecipeFormIngredients([...recipeFormIngredients, { code: currIngCode, qty: baseQty }]);
    }
    setCurrIngQty(0);
    triggerToast("Bahan ditambahkan ke rancangan resep.");
  };

  const handleRemoveIngredientFromForm = (code: string) => {
    setRecipeFormIngredients(recipeFormIngredients.filter(ri => ri.code !== code));
  };

  // Open Create Recipe Modal
  const openCreateRecipeModal = () => {
    setModalMode("create");
    setRecipeFormName("");
    setRecipeFormCategory("Coffee");
    setRecipeFormSellPrice(30000);
    setRecipeFormIngredients([]);
    setRecipeFormIsSecret(false);
    setRecipeFormSecretBaseName("Kopi Signature Concentrate");
    setRecipeFormSecretBaseQty(30);
    setRecipeFormSecretBaseUnit("ml");
    setEditingRecipeId(null);
    setCurrIngCode(master[0]?.code || "");
    setCurrIngQty(0);
    setIsRecipeModalOpen(true);
  };

  // Open Edit Recipe Modal
  const openEditRecipeModal = (recipe: DrinkRecipe) => {
    setModalMode("edit");
    setRecipeFormName(recipe.name);
    setRecipeFormCategory(recipe.category);
    setRecipeFormSellPrice(recipe.sellPrice);
    setRecipeFormIngredients([...recipe.ingredients]);
    setRecipeFormIsSecret(recipe.isSecret || false);
    setRecipeFormSecretBaseName(recipe.secretBaseName || "Kopi Signature Concentrate");
    setRecipeFormSecretBaseQty(recipe.secretBaseQty || 30);
    setRecipeFormSecretBaseUnit(recipe.secretBaseUnit || "ml");
    setEditingRecipeId(recipe.id);
    setCurrIngCode(master[0]?.code || "");
    setCurrIngQty(0);
    setIsRecipeModalOpen(true);
  };

  // Submit Recipe (Save/Update)
  const handleSubmitRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeFormName.trim()) {
      triggerToast("Nama resep tidak boleh kosong.");
      return;
    }
    if (recipeFormIngredients.length === 0) {
      triggerToast("Harap tambahkan minimal 1 jenis bahan baku untuk membuat resep.");
      return;
    }

    const nextState = { ...state };
    nextState.recipes = nextState.recipes || [];

    if (modalMode === "create") {
      const newRecipe: DrinkRecipe = {
        id: "R-" + Date.now(),
        name: recipeFormName,
        category: recipeFormCategory,
        sellPrice: recipeFormSellPrice,
        ingredients: recipeFormIngredients,
        isSecret: recipeFormIsSecret,
        secretBaseName: recipeFormSecretBaseName,
        secretBaseQty: recipeFormSecretBaseQty,
        secretBaseUnit: recipeFormSecretBaseUnit
      };
      nextState.recipes = [...nextState.recipes, newRecipe];
      
      const actLog: ActivityLog = {
        id: "ACT-" + Date.now(),
        icon: "📜",
        text: `Menambahkan formulasi resep baru "${recipeFormName}" (HPP: Rp ${calculateRecipeTotalCost(newRecipe).toLocaleString("id-ID")})`,
        type: "info",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      };
      nextState.activities = [actLog, ...state.activities];
      triggerToast(`✓ Resep "${recipeFormName}" berhasil disimpan ke database.`);
    } else {
      const idx = nextState.recipes.findIndex(r => r.id === editingRecipeId);
      if (idx !== -1) {
        const oldName = nextState.recipes[idx].name;
        nextState.recipes[idx] = {
          ...nextState.recipes[idx],
          name: recipeFormName,
          category: recipeFormCategory,
          sellPrice: recipeFormSellPrice,
          ingredients: recipeFormIngredients,
          isSecret: recipeFormIsSecret,
          secretBaseName: recipeFormSecretBaseName,
          secretBaseQty: recipeFormSecretBaseQty,
          secretBaseUnit: recipeFormSecretBaseUnit
        };
        const actLog: ActivityLog = {
          id: "ACT-" + Date.now(),
          icon: "⚙️",
          text: `Memperbarui detail form resep "${recipeFormName}" (Sebelumnya: "${oldName}")`,
          type: "info",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
        };
        nextState.activities = [actLog, ...state.activities];
        triggerToast(`✓ Resep "${recipeFormName}" berhasil diperbarui.`);
      }
    }

    await syncState(nextState);
    syncSimulationDefaults(nextState.recipes || []);
    setIsRecipeModalOpen(false);
  };

  // Delete Recipe
  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus formulasi resep "${name}"?`)) {
      return;
    }
    const nextState = { ...state };
    nextState.recipes = (nextState.recipes || []).filter(r => r.id !== id);
    
    const actLog: ActivityLog = {
      id: "ACT-" + Date.now(),
      icon: "🗑",
      text: `Menghapus formulasi resep "${name}" dari sistem`,
      type: "info",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    };
    nextState.activities = [actLog, ...state.activities];

    await syncState(nextState);
    syncSimulationDefaults(nextState.recipes || []);
    triggerToast(`✓ Resep "${name}" dihapus.`);
  };

  // ==========================================
  // Homemade Formulation Callbacks
  // ==========================================
  const handleAddHmIngredientToForm = () => {
    if (!currHmIngCode || currHmIngQty <= 0) {
      triggerToast("Pilih bahan baku dan masukkan takaran formulasi yang valid.");
      return;
    }
    const item = master.find(m => m.code === currHmIngCode);
    if (!item) return;

    const conv = getUnitConversion(item);
    // Convert to base inventory qty
    const baseQty = parseFloat((currHmIngQty / conv.factor).toFixed(6));

    const existsIdx = hmFormIngredients.findIndex(hi => hi.code === currHmIngCode);
    if (existsIdx !== -1) {
      const updated = [...hmFormIngredients];
      updated[existsIdx].qty = parseFloat((updated[existsIdx].qty + baseQty).toFixed(6));
      setHmFormIngredients(updated);
    } else {
      setHmFormIngredients([...hmFormIngredients, { code: currHmIngCode, qty: baseQty }]);
    }
    setCurrHmIngQty(0);
    triggerToast("Bahan ditambahkan ke resep homemade.");
  };

  const handleRemoveHmIngredientFromForm = (code: string) => {
    setHmFormIngredients(hmFormIngredients.filter(hi => hi.code !== code));
  };

  const handleSaveHomemadeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hmFormName.trim()) {
      triggerToast("Nama bahan homemade wajib diisi.");
      return;
    }
    if (hmFormIngredients.length === 0) {
      triggerToast("Tambahkan minimal 1 bahan baku ke rancangan formula.");
      return;
    }

    const nextState = { ...state };
    nextState.homemadeIngredients = nextState.homemadeIngredients || [];

    if (hmModalMode === "create") {
      const newId = "HM-" + (nextState.homemadeIngredients.length + 101);
      const newItem = {
        id: newId,
        name: hmFormName,
        yieldQty: hmFormYieldQty,
        yieldUnit: hmFormYieldUnit,
        ingredients: hmFormIngredients,
        category: hmFormCategory,
        description: hmFormDescription
      };
      nextState.homemadeIngredients = [...nextState.homemadeIngredients, newItem];

      const actLog: ActivityLog = {
        id: "ACT-" + Date.now(),
        icon: "✨",
        text: `Menambahkan formulasi Homemade baru: "${hmFormName}" kategori ${hmFormCategory}`,
        type: "info",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      };
      nextState.activities = [actLog, ...state.activities];
      triggerToast(`✓ Berhasil menambahkan formulasi "${hmFormName}".`);
    } else {
      const oldItemName = hmFormName;
      nextState.homemadeIngredients = nextState.homemadeIngredients.map(h => {
        if (h.id === editingHmId) {
          return {
            ...h,
            name: hmFormName,
            yieldQty: hmFormYieldQty,
            yieldUnit: hmFormYieldUnit,
            ingredients: hmFormIngredients,
            category: hmFormCategory,
            description: hmFormDescription
          };
        }
        return h;
      });

      const actLog: ActivityLog = {
        id: "ACT-" + Date.now(),
        icon: "⚙️",
        text: `Memperbarui detail Homemade Ingredient "${hmFormName}"`,
        type: "info",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      };
      nextState.activities = [actLog, ...state.activities];
      triggerToast(`✓ Formula "${oldItemName}" berhasil diperbarui.`);
    }

    await syncState(nextState);
    setIsHmModalOpen(false);
  };

  const handleDeleteHomemadeItem = async (id: string, name: string) => {
    if (!window.confirm(`Hapus formulasi homemade "${name}"? Minuman yang menggunakan formulasi ini akan kehilangan hitungan HPP yang valid.`)) {
      return;
    }
    const nextState = { ...state };
    nextState.homemadeIngredients = (nextState.homemadeIngredients || []).filter(h => h.id !== id);

    const actLog: ActivityLog = {
      id: "ACT-" + Date.now(),
      icon: "🗑",
      text: `Menghapus formulasi homemade "${name}" dari sistem`,
      type: "info",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    };
    nextState.activities = [actLog, ...state.activities];

    await syncState(nextState);
    triggerToast(`✓ Formula "${name}" berhasil dihapus.`);
  };

  // Manufacture / Rebus Batch Action
  const handleManufactureHomemadeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMfgId) return;

    const hmList = state.homemadeIngredients || [];
    const hm = hmList.find(h => h.id === selectedMfgId);
    if (!hm) return;

    const nextState = { ...state };
    nextState.storage = { ...nextState.storage };
    nextState.storage.bar = { ...nextState.storage.bar };
    
    // Check stock for all raw ingredients required
    let canMfg = true;
    const missingIngredients: string[] = [];

    hm.ingredients.forEach(ing => {
      const required = ing.qty * mfgQtySelect;
      const current = nextState.storage.bar[ing.code] || 0;
      if (current < required) {
        canMfg = false;
        const rawM = master.find(mItem => mItem.code === ing.code);
        missingIngredients.push(`${rawM?.name || ing.code} (Sedia: ${current.toFixed(4)}, Butuh: ${required.toFixed(4)})`);
      }
    });

    if (!canMfg) {
      alert(`Stok bahan baku di BAR tidak mencukupi untuk memproduksi ${mfgQtySelect} batch ini:\n\n` + missingIngredients.join("\n"));
      return;
    }

    // Deduct stock
    hm.ingredients.forEach(ing => {
      const required = ing.qty * mfgQtySelect;
      nextState.storage.bar[ing.code] = parseFloat((nextState.storage.bar[ing.code] - required).toFixed(6));
    });

    nextState.storage.gudang = { ...nextState.storage.gudang };

    // Logging & Adding to Storage representation or activity log
    const producedQty = hm.yieldQty * mfgQtySelect;
    const productionCost = calculateIngredientCost(hm.id, producedQty);

    // Automatically add produced stock to Gudang Utama & Bar Chiller
    const currentGudangHM = nextState.storage.gudang[hm.id] || 0;
    const currentBarHM = nextState.storage.bar[hm.id] || 0;
    nextState.storage.gudang[hm.id] = parseFloat((currentGudangHM + producedQty).toFixed(4));
    nextState.storage.bar[hm.id] = parseFloat((currentBarHM + producedQty).toFixed(4));

    const actLog: ActivityLog = {
      id: "ACT-" + Date.now(),
      icon: "🏭",
      text: `${mfgBy} memproduksi ${producedQty} ${hm.yieldUnit} ${hm.name} (HPP Produksi: Rp ${productionCost.toLocaleString("id-ID")}). Stok otomatis masuk ke ${state.branding.storageGudangName} & ${state.branding.storageBarName}.`,
      type: "info",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    };
    nextState.activities = [actLog, ...state.activities];

    await syncState(nextState);
    setIsMfgModalOpen(false);
    triggerToast(`🏭 Sukses memproduksi ${producedQty} ${hm.yieldUnit} ${hm.name}! Stok bahan baku terpotong dan hasil otomatis masuk ke Gudang & Bar.`);
  };


  // EXECUTE SALES SIMULATION WITH AUTOMATIC STOCK DEDUCTION
  const handleProcessSaleSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipesList.find(r => r.id === simSaleRecipeId);
    if (!recipe) {
      triggerToast("Pilih jenis minuman terlebih dahulu.");
      return;
    }
    if (simSaleQty <= 0) {
      triggerToast("Masukkan jumlah pesanan minimal 1 cup.");
      return;
    }

    const nextState = { ...state };
    nextState.recipes = nextState.recipes || [];
    nextState.sales = nextState.sales || [];
    nextState.inventory = { ...nextState.inventory };
    nextState.storage = {
      gudang: { ...nextState.storage.gudang },
      bar: { ...nextState.storage.bar }
    };
    nextState.issues = [...nextState.issues];

    // 1. Verify enough physical stock in Bar Storage
    const errors: string[] = [];
    recipe.ingredients.forEach(ing => {
      const requiredQty = ing.qty * simSaleQty;
      const currentBarStock = nextState.storage.bar[ing.code] || 0;
      const mItem = master.find(m => m.code === ing.code);
      if (currentBarStock < requiredQty) {
        errors.push(`${mItem?.name || ing.code}: Kurang ${requiredQty - currentBarStock} ${mItem?.unit}`);
      }
    });

    if (errors.length > 0) {
      const proceed = window.confirm(
        `🚨 PERINGATAN: Stok di ${state.branding.storageBarName} tidak mencukupi!\n\n` +
        errors.join("\n") +
        "\n\nApakah tetap ingin memproses transaksi ini dengan konsekuensi stok bar menjadi minus / defisit?"
      );
      if (!proceed) return;
    }

    // Determine current shift based on local hour
    const localHour = new Date().getHours();
    let currentShift = "Pagi (06:00–14:00)";
    if (localHour >= 14 && localHour < 22) {
      currentShift = "Siang (14:00–22:00)";
    } else if (localHour >= 22 || localHour < 6) {
      currentShift = "Malam (22:00–06:00)";
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const timestampStr = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).replace(/\./g, ":");

    const tempStockMovements = nextState.stockMovements || [];

    // 2. Perform automated deduction & detailed logging
    recipe.ingredients.forEach(ing => {
      const requiredQty = ing.qty * simSaleQty;
      const mItem = master.find(m => m.code === ing.code);

      // Deduct from Bar storage
      const currentBarVal = nextState.storage.bar[ing.code] || 0;
      nextState.storage.bar[ing.code] = parseFloat((currentBarVal - requiredQty).toFixed(4));

      // Increase 'keluar' in daily inventory calculations
      if (!nextState.inventory[ing.code]) {
        nextState.inventory[ing.code] = { awal: 0, masuk: 0, keluar: 0, waste: 0 };
      }
      const prevInv = nextState.inventory[ing.code];
      const prevKeluar = prevInv.keluar || 0;
      nextState.inventory[ing.code].keluar = parseFloat((prevKeluar + requiredQty).toFixed(4));

      const beforeStock = Math.max(0, prevInv.awal + prevInv.masuk - prevInv.keluar - prevInv.waste);
      const afterStock = Math.max(0, beforeStock - requiredQty);

      // Record Stock Movement log entry
      const newMovement = {
        id: "SM-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
        item_id: ing.code,
        type: "OUT" as const,
        quantity: requiredQty,
        before_stock: beforeStock,
        after_stock: afterStock,
        reason: `Deduction penjualan menu: ${simSaleQty}x ${recipe.name}`,
        created_by: simSaleBy || "System",
        created_at: new Date().toISOString()
      };
      tempStockMovements.unshift(newMovement);

      // Create an audit issue log for tracking
      const newIssue: IssueItem = {
        id: "IS-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        time: timestampStr,
        isoDate: new Date().toISOString(),
        code: ing.code,
        name: mItem?.name || ing.code,
        qty: requiredQty,
        unit: mItem?.unit || "unit",
        cat: "Pemakaian Produksi (Otomatis Resep)",
        by: simSaleBy,
        shift: currentShift,
        note: `Pemotongan bahan otomatis dari penjualan ${simSaleQty} x ${recipe.name}`
      };
      nextState.issues.push(newIssue);
    });

    nextState.stockMovements = tempStockMovements;

    // 3. Register financial sale transaction
    const totalRecipeCost = calculateRecipeTotalCost(recipe);
    const revenueVal = recipe.sellPrice * simSaleQty;
    const costVal = totalRecipeCost * simSaleQty;

    const newSale: SaleTransaction = {
      id: "S-" + Date.now(),
      recipeId: recipe.id,
      recipeName: recipe.name,
      qty: simSaleQty,
      sellPrice: recipe.sellPrice,
      totalRevenue: revenueVal,
      totalCost: costVal,
      date: todayDate,
      by: simSaleBy
    };
    nextState.sales = [newSale, ...nextState.sales];

    // Create the global activity log
    const tempGlobalLogs = nextState.activityLogsGlobal || [];
    const newGlobalLog = {
      id: "GL-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
      user_id: simSaleBy || "System",
      action: "CREATE_SALE" as const,
      description: `Penjualan ${simSaleQty}x ${recipe.name}. Pendapatan: Rp ${revenueVal.toLocaleString("id-ID")} | HPP Pokok: Rp ${costVal.toLocaleString("id-ID")}`,
      created_at: new Date().toISOString()
    };
    tempGlobalLogs.unshift(newGlobalLog);
    nextState.activityLogsGlobal = tempGlobalLogs;

    //4. Log overall System Activity log
    const activity: ActivityLog = {
      id: "ACT-" + Date.now(),
      icon: "🥤",
      text: `Penjualan ${simSaleQty}x ${recipe.name} oleh ${simSaleBy}. Pendapatan: Rp ${revenueVal.toLocaleString("id-ID")} | HPP Pokok: Rp ${costVal.toLocaleString("id-ID")} (Stok Bar otomatis berkurang)`,
      type: "out",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    };
    nextState.activities = [activity, ...state.activities];

    await syncState(nextState);
    setSimSaleQty(1);
    triggerToast(`✓ Transaksi Berhasil! Berkurang ${simSaleQty} porsi ${recipe.name}.`);
  };


  // --- COGS FINANCING PRESENTATION CALCULATORS (Tab 3 & 4) ---
  const getMonthlyAggregateReport = () => {
    // Collect unique months
    const monthSet = new Set<string>();
    salesList.forEach(s => {
      const m = s.date.substring(0, 7); // YYYY-MM
      monthSet.add(m);
    });
    // Ensure current month is represented
    const currentMonth = new Date().toISOString().substring(0, 7);
    monthSet.add(currentMonth);

    const sortedMonths = Array.from(monthSet).sort();

    return sortedMonths.map(m => {
      // Sales for this month
      const mSales = salesList.filter(s => s.date.startsWith(m));
      const totalRev = mSales.reduce((acc, s) => acc + s.totalRevenue, 0);
      const totalCostBase = mSales.reduce((acc, s) => acc + s.totalCost, 0);

      // Waste loss for this month
      // wastes have rawDate "YYYY-MM-DD" or isoDate or date
      const mWaste = wastes.filter(w => {
        const dateVal = w.rawDate || w.time; // Backup checks
        return dateVal.startsWith(m);
      });
      const totalWasteLoss = mWaste.reduce((acc, w) => acc + (w.loss || 0), 0);

      // COGS (HPP Ideal) is the formula: Raw Material Cost for Sold items
      // Actual COGS (HPP Aktual) matches Raw Material Cost + Waste losses
      const rawCogsIdeal = totalCostBase;
      const rawCogsActual = totalCostBase + totalWasteLoss;

      const idealCogsPercent = totalRev > 0 ? (rawCogsIdeal / totalRev) * 100 : 0;
      const actualCogsPercent = totalRev > 0 ? (rawCogsActual / totalRev) * 100 : 0;
      const grossProfitMargin = totalRev > 0 ? ((totalRev - rawCogsActual) / totalRev) * 100 : 100;

      // Translate month string to Name
      const [year, monthNum] = m.split("-");
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const label = `${monthNames[parseInt(monthNum, 10) - 1]} ${year}`;

      return {
        monthCode: m,
        label,
        revenue: totalRev,
        cogsIdeal: rawCogsIdeal,
        cogsActual: rawCogsActual,
        wasteLoss: totalWasteLoss,
        percentIdeal: idealCogsPercent,
        percentActual: actualCogsPercent,
        grossMargin: grossProfitMargin,
        salesCount: mSales.reduce((acc, s) => acc + s.qty, 0)
      };
    });
  };

  const monthlyReport = getMonthlyAggregateReport();
  const activeMonthReport = monthlyReport[monthlyReport.length - 1] || {
    label: "Juni 2026",
    revenue: 0,
    cogsIdeal: 0,
    cogsActual: 0,
    wasteLoss: 0,
    percentIdeal: 0,
    percentActual: 0,
    grossMargin: 100,
    salesCount: 0
  };

  // CATEGORY METRIC ANALYSIS
  const categoryAnalysis = () => {
    const analysis: { [cat: string]: { rev: number; cost: number; qty: number } } = {
      "Coffee": { rev: 0, cost: 0, qty: 0 },
      "Milk-based": { rev: 0, cost: 0, qty: 0 },
      "Non-Coffee": { rev: 0, cost: 0, qty: 0 }
    };

    salesList.forEach(s => {
      const rec = recipesList.find(r => r.id === s.recipeId);
      const cat = rec?.category || "Coffee";
      if (!analysis[cat]) {
        analysis[cat] = { rev: 0, cost: 0, qty: 0 };
      }
      analysis[cat].rev += s.totalRevenue;
      analysis[cat].cost += s.totalCost;
      analysis[cat].qty += s.qty;
    });

    return Object.entries(analysis).map(([cat, val]) => {
      const hppPct = val.rev > 0 ? (val.cost / val.rev) * 100 : 0;
      return { category: cat, ...val, hppPercent: hppPct };
    });
  };

  const categoryMetrics = categoryAnalysis();

  return (
    <div className="space-y-6 animate-fadeIn text-amber-50">
      
      {/* 🚀 HEADER SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a0a00]/60 border border-[#D4A853]/15 rounded-2xl p-4.5">
          <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-mono">Omset Bulan Ini ({activeMonthReport.label})</p>
          <div className="flex justify-between items-baseline mt-2">
            <h4 className="font-serif text-xl font-bold text-amber-100">Rp {activeMonthReport.revenue.toLocaleString("id-ID")}</h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">+{activeMonthReport.salesCount} Qty</span>
          </div>
        </div>

        <div className="bg-[#1a0a00]/60 border border-[#D4A853]/15 rounded-2xl p-4.5">
          <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-mono">COGS Pokok Ideal</p>
          <div className="flex justify-between items-baseline mt-2">
            <h4 className="font-serif text-xl font-bold text-amber-300">Rp {activeMonthReport.cogsIdeal.toLocaleString("id-ID")}</h4>
            <span className="text-[11px] font-mono font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
              {activeMonthReport.percentIdeal.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-[#1a0a00]/60 border border-[#D4A853]/15 rounded-2xl p-4.5">
          <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-mono">Waste &amp; Kerugian Bahan</p>
          <div className="flex justify-between items-baseline mt-2">
            <h4 className="font-serif text-xl font-bold text-red-400">Rp {activeMonthReport.wasteLoss.toLocaleString("id-ID")}</h4>
            <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Rugi Bar</span>
          </div>
        </div>

        <div className="bg-[#1a0a00]/60 border border-[#D4A853]/15 rounded-2xl p-4.5">
          <p className="text-[10px] text-amber-200/40 uppercase tracking-widest font-mono">COGS Aktual (HPP + Waste %)</p>
          <div className="flex justify-between items-baseline mt-2">
            <h4 className="font-serif text-xl font-bold text-orange-400">Rp {activeMonthReport.cogsActual.toLocaleString("id-ID")}</h4>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
              activeMonthReport.percentActual <= 35 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {activeMonthReport.percentActual.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 🧭 COGS MODULE SUB-TABS */}
      <div className="flex border-b border-[#D4A853]/15 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("recipes")}
          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition border-[#D4A853]/0 border-b-2 whitespace-nowrap ${
            activeSubTab === "recipes"
              ? "border-amber-400 text-amber-300"
              : "transparent text-amber-100/50 hover:text-amber-100/80"
          }`}
        >
          📜 Drink Cost &amp; Resep HPP
        </button>
        <button
          onClick={() => setActiveSubTab("homemade")}
          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition border-[#D4A853]/0 border-b-2 whitespace-nowrap ${
            activeSubTab === "homemade"
              ? "border-amber-400 text-amber-300"
              : "transparent text-amber-100/50 hover:text-amber-100/80"
          }`}
        >
          ✨ Homemade Ingredient Engine
        </button>
        <button
          onClick={() => setActiveSubTab("simulation")}
          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition border-[#D4A853]/0 border-b-2 whitespace-nowrap ${
            activeSubTab === "simulation"
              ? "border-amber-400 text-amber-300"
              : "transparent text-amber-100/50 hover:text-amber-100/80"
          }`}
        >
          ⚡ Cashier / Potong Stok Otomatis
        </button>
        <button
          onClick={() => setActiveSubTab("reports")}
          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition border-[#D4A853]/0 border-b-2 whitespace-nowrap ${
            activeSubTab === "reports"
              ? "border-amber-400 text-amber-300"
              : "transparent text-amber-100/50 hover:text-amber-100/80"
          }`}
        >
          📅 Laporan Presentasi COGS
        </button>
        <button
          onClick={() => setActiveSubTab("ai")}
          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition border-[#D4A853]/0 border-b-2 whitespace-nowrap ${
            activeSubTab === "ai"
              ? "border-amber-400 text-amber-300"
              : "transparent text-amber-100/50 hover:text-amber-100/80"
          }`}
        >
          💡 Analisis &amp; Rekomendasi Efisiensi
        </button>
      </div>


      {/* TAB 1: RECIPES AND COST LIST (HPP) */}
      {activeSubTab === "recipes" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Specialty Coffee Premium Dynamic Unit Cost Deck */}
          {(() => {
            const coffeeItem = master.find(m => m.code === "BK-001") || master.find(m => m.name.toLowerCase().includes("kopi"));
            const milkItem = master.find(m => m.code === "SU-001") || master.find(m => m.name.toLowerCase().includes("susu"));
            const syrupItem = master.find(m => m.code === "SI-001") || master.find(m => m.name.toLowerCase().includes("sirup"));
            const sugarItem = master.find(m => m.code === "SI-005") || master.find(m => m.name.toLowerCase().includes("gula"));
            const cupItem = master.find(m => m.code === "KM-001") || master.find(m => m.name.toLowerCase().includes("cup"));

            const coffeeRate = coffeeItem ? getUnitConversion(coffeeItem).pricePerUnit : 180;
            const milkRate = milkItem ? getUnitConversion(milkItem).pricePerUnit : 22;
            const syrupRate = syrupItem ? getUnitConversion(syrupItem).pricePerUnit : 126.67;
            const sugarRate = sugarItem ? getUnitConversion(sugarItem).pricePerUnit : 18;
            const cupRate = cupItem ? getUnitConversion(cupItem).pricePerUnit : 950;

            return (
              <div className="bg-gradient-to-r from-[#1c0c02] to-[#2d1403] border border-[#D4A853]/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/5 rounded-full blur-2xl"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-[#D4A853]/15 pb-3.5 mb-4">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#D4A853] tracking-wide uppercase flex items-center gap-2">
                      <span>✨</span> Specialty Coffee Real-Time Unit Cost Estimator
                    </h4>
                    <p className="text-[11px] text-amber-200/50 mt-0.5">
                      Kalkulator harga riil satuan terkecil per gram/ml/pcs berdasarkan data pembelian operasional terbaru
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-mono font-bold animate-pulse">
                    ● Live Updated
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Card 1: Coffee */}
                  <div className="bg-black/20 p-3 rounded-xl border border-[#D4A853]/5 hover:border-[#D4A853]/25 transition flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-200/40 uppercase">1 Gram Kopi</span>
                      <p className="font-mono font-bold text-sm text-amber-100 mt-1">Rp {coffeeRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[9px] text-[#D4A853]/40 font-mono mt-2 truncate bg-black/10 px-1 py-0.5 rounded">
                      {coffeeItem ? coffeeItem.name : "Blend Espresso"}
                    </span>
                  </div>

                  {/* Card 2: Milk */}
                  <div className="bg-black/20 p-3 rounded-xl border border-[#D4A853]/5 hover:border-[#D4A853]/25 transition flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-200/40 uppercase">1 Ml Susu</span>
                      <p className="font-mono font-bold text-sm text-amber-100 mt-1">Rp {milkRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[9px] text-[#D4A853]/40 font-mono mt-2 truncate bg-black/10 px-1 py-0.5 rounded">
                      {milkItem ? milkItem.name : "Greenfields"}
                    </span>
                  </div>

                  {/* Card 3: Syrup */}
                  <div className="bg-black/20 p-3 rounded-xl border border-[#D4A853]/5 hover:border-[#D4A853]/25 transition flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-200/40 uppercase">1 Ml Syrup</span>
                      <p className="font-mono font-bold text-sm text-amber-300 mt-1">Rp {syrupRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[9px] text-[#D4A853]/40 font-mono mt-2 truncate bg-black/10 px-1 py-0.5 rounded">
                      {syrupItem ? syrupItem.name : "Vanilla Toffin"}
                    </span>
                  </div>

                  {/* Card 4: Sugar */}
                  <div className="bg-black/20 p-3 rounded-xl border border-[#D4A853]/5 hover:border-[#D4A853]/25 transition flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-amber-200/40 uppercase">1 Gram Gula</span>
                      <p className="font-mono font-bold text-sm text-amber-100 mt-1">Rp {sugarRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[9px] text-[#D4A853]/40 font-mono mt-2 truncate bg-black/10 px-1 py-0.5 rounded">
                      {sugarItem ? sugarItem.name : "Rose Brand"}
                    </span>
                  </div>

                  {/* Card 5: Cup */}
                  <div className="bg-black/20 p-3 rounded-xl border border-[#D4A853]/5 hover:border-[#D4A853]/25 transition flex flex-col justify-between col-span-2 md:col-span-1">
                    <div>
                      <span className="text-[9px] font-mono text-amber-200/40 uppercase">1 Pcs Cup</span>
                      <p className="font-mono font-bold text-sm text-amber-100 mt-1">Rp {cupRate.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</p>
                    </div>
                    <span className="text-[9px] text-[#D4A853]/40 font-mono mt-2 truncate bg-black/10 px-1 py-0.5 rounded">
                      {cupItem ? cupItem.name : "Cup Plastic"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recipe List Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-black/10 px-4 py-2.5 rounded-xl border border-amber-500/5">
              <span className="text-xs font-mono text-amber-100/40">Daftar Formulasi Menu Active ({recipesList.length})</span>
              <button
                onClick={openCreateRecipeModal}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg active:scale-95 transition cursor-pointer"
              >
                ➕ Buat Formulir Resep
              </button>
            </div>

            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/30 font-mono text-[10px] text-amber-200/40 uppercase tracking-wider py-3 border-b border-[#D4A853]/10">
                      <th className="py-3 px-4">Nama Produk</th>
                      <th className="py-3 px-4 text-center">Kategori</th>
                      <th className="py-3 px-4 text-right">Harga Jual (Rp)</th>
                      <th className="py-3 px-4 text-right">HPP Pokok (Rp)</th>
                      <th className="py-3 px-4 text-center">COGS (%)</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4A853]/5">
                    {recipesList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-amber-100/20 italic">
                          Belum ada formulasi resep minum dicatat. Buat sekarang!
                        </td>
                      </tr>
                    ) : (
                      recipesList.map((recipe) => {
                        const totalCost = calculateRecipeTotalCost(recipe);
                        const cogsPercent = recipe.sellPrice > 0 ? (totalCost / recipe.sellPrice) * 100 : 0;
                        const isSelected = selectedRecipeDetail === recipe.id;

                        // Ideal COGS in F&B is < 35%
                        const statusColor = cogsPercent <= 30 
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : cogsPercent <= 35
                          ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                          : "text-red-400 bg-red-500/10 border-red-500/20";

                        return (
                          <tr
                            key={recipe.id}
                            className={`transition hover:bg-amber-500/5 ${isSelected ? "bg-amber-500/10" : ""}`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-amber-100">
                              <button
                                onClick={() => setSelectedRecipeDetail(recipe.id)}
                                className="text-left w-full hover:underline hover:text-amber-300 cursor-pointer text-xs"
                              >
                                {recipe.name}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="bg-amber-400/5 text-amber-200/60 px-2 py-0.5 rounded text-[10px]">
                                {recipe.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold font-mono">
                              Rp {recipe.sellPrice.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold font-mono text-amber-300">
                              {isAuthorized ? `Rp ${totalCost.toLocaleString("id-ID")}` : "Rp [Terkunci]"}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isAuthorized ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border font-semibold ${statusColor}`}>
                                  {cogsPercent.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-amber-140/40 text-[11px]">🔒 [Terkunci]</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => setSelectedRecipeDetail(recipe.id)}
                                  className="bg-amber-400/10 text-amber-300 p-1 rounded hover:bg-amber-400/20 text-[11px] cursor-pointer"
                                  title="Detail Resep"
                                >
                                  🔍
                                </button>
                                {isAuthorized && (
                                  <>
                                    <button
                                      onClick={() => openEditRecipeModal(recipe)}
                                      className="bg-blue-400/10 text-blue-300 p-1 rounded hover:bg-blue-400/20 text-[11px] cursor-pointer"
                                      title="Edit Resep"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecipe(recipe.id, recipe.name)}
                                      className="bg-red-400/10 text-red-400 p-1 rounded hover:bg-red-400/20 text-[11px] cursor-pointer"
                                      title="Hapus Resep"
                                    >
                                      🗑
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Active Recipe Detail Panel */}
          <div>
            {(() => {
              const activeRecipe = recipesList.find(r => r.id === selectedRecipeDetail);
              if (!activeRecipe) {
                return (
                  <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-6 text-center text-amber-100/30 text-xs italic">
                    Pilih resep pada tabel di samping untuk melihat rincian kalkulasi detail Cost drink &amp; HPP.
                  </div>
                );
              }

              const totalRecipeCostObj = calculateRecipeTotalCost(activeRecipe);
              const marginRp = activeRecipe.sellPrice - totalRecipeCostObj;
              const marginPercent = activeRecipe.sellPrice > 0 ? (marginRp / activeRecipe.sellPrice) * 100 : 100;
              const markupRatio = totalRecipeCostObj > 0 ? activeRecipe.sellPrice / totalRecipeCostObj : 0;

              return (
                <div className="bg-[#1a0a00]/50 border border-[#D4A853]/20 rounded-2xl p-5 space-y-5 shadow-xl animate-fadeIn">
                  <div className="border-b border-[#D4A853]/15 pb-3">
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase font-bold text-center">
                      🔬 RINCIAN COGS MENU
                    </span>
                    <h3 className="font-serif font-bold text-lg text-amber-100 mt-2">{activeRecipe.name}</h3>
                    <p className="text-xs text-amber-200/40 mt-0.5">Kategori: {activeRecipe.category}</p>
                  </div>

                  {/* Pricing Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-amber-500/5">
                      <p className="text-[9px] text-amber-200/40 uppercase font-mono">Harga Jual</p>
                      <p className="font-mono font-bold text-sm text-center text-amber-100 mt-1">
                        Rp {activeRecipe.sellPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-amber-500/5">
                      <p className="text-[9px] text-amber-200/40 uppercase font-mono">HPP Drick Pokok</p>
                      <p className="font-mono font-bold text-sm text-center text-amber-300 mt-1">
                        {isAuthorized ? `Rp ${totalRecipeCostObj.toLocaleString("id-ID")}` : "Rp [Terkunci]"}
                      </p>
                    </div>
                  </div>

                  {/* Margin Analytics Gauge */}
                  <div className="bg-amber-500/5 p-4 rounded-xl border border-[#D4A853]/10 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-100/60 font-semibold">Gross Profit Margin</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {isAuthorized ? `${marginPercent.toFixed(1)}%` : "[Terkunci]"}
                      </span>
                    </div>
                    <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${isAuthorized ? marginPercent : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-200/45 pt-1 border-t border-amber-500/5">
                      <span>Laba Kotor Rp:</span>
                      <span className="font-mono font-semibold text-amber-100">
                        {isAuthorized ? `Rp ${marginRp.toLocaleString("id-ID")}` : "Rp [Terkunci]"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-200/45">
                      <span>Markup Ratio:</span>
                      <span className="font-[#D4A853] font-semibold text-amber-100">
                        {isAuthorized ? `${markupRatio.toFixed(2)} x HPP` : "[Terkunci]"}
                      </span>
                    </div>
                  </div>

                  {/* Constituent ingredients breakdown */}
                  <div>
                    <h5 className="text-[10px] text-amber-200/40 font-mono tracking-wider uppercase mb-2">Bahan Baku &amp; Takaran Resep:</h5>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {!isAuthorized && activeRecipe.isSecret ? (
                        <div className="flex justify-between items-center text-xs bg-amber-950/20 p-3 rounded-lg border border-amber-500/15 font-sans">
                          <div>
                            <p className="font-semibold text-amber-300">🔒 {activeRecipe.secretBaseName || "Kopi Signature Concentrate"}</p>
                            <p className="text-[10px] text-amber-200/40 font-mono mt-0.5">
                              Takaran: <span className="text-amber-100 font-bold">{activeRecipe.secretBaseQty || 30} {activeRecipe.secretBaseUnit || "ml"}</span>
                            </p>
                          </div>
                          <span className="font-mono text-amber-200/45 text-[10px] uppercase font-bold tracking-wider">
                            [Formula Terkunci]
                          </span>
                        </div>
                      ) : (
                        activeRecipe.ingredients.map((ing) => {
                          const isHm = ing.code.startsWith("HM-");
                          const mItem = isHm
                            ? (state.homemadeIngredients || []).find(h => h.id === ing.code)
                            : master.find(m => m.code === ing.code);
                          const ingCost = calculateIngredientCost(ing.code, ing.qty);
                          const conv = mItem ? getUnitConversion(mItem) : { unitLabel: "unit", factor: 1, pricePerUnit: 0 };
                          const nameString = isHm ? (mItem as any)?.name : (mItem as any)?.name || ing.code;
                          const qtyString = parseFloat((ing.qty * (isHm ? 1 : conv.factor)).toFixed(4));
                          return (
                            <div
                              key={ing.code}
                              className="flex justify-between items-center text-xs bg-black/15 p-2 rounded-lg border border-amber-500/5 font-sans"
                            >
                              <div>
                                <p className="font-semibold text-amber-100/90">{nameString}</p>
                                <p className="text-[10px] text-amber-200/40 font-mono mt-0.5">
                                  Takaran: <span className="text-amber-200 font-bold">{qtyString} {conv.unitLabel}</span> @ {isAuthorized ? `Rp ${conv.pricePerUnit.toLocaleString("id-ID")}/${conv.unitLabel}` : "[Terkunci]"}
                                </p>
                              </div>
                              <span className="font-mono font-semibold text-amber-300 font-bold">
                                {isAuthorized ? `Rp ${ingCost.toLocaleString("id-ID")}` : "Rp [Terkunci]"}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}


      {/* ========================================================
          TAB 1.5: HOMEMADE INGREDIENTS ENGINE PANEL
          ======================================================== */}
      {activeSubTab === "homemade" && (
        <div className="space-y-6 animate-fadeIn text-amber-100 font-sans">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1a0a00]/40 p-5 rounded-2xl border border-amber-500/10 gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-amber-300">✨ Homemade Ingredient Formulary Engine</h3>
              <p className="text-xs text-amber-250/50 mt-1 max-w-2xl">
                Hitung COGS murni dari syrup, cordial, premix, dan saus racikan internal Anda sendiri. Biaya bahan baku otomatis terintegrasi langsung ke resep minuman final secara real-time.
              </p>
            </div>
            <button
              onClick={() => {
                setHmModalMode("create");
                setHmFormName("");
                setHmFormCategory("Syrup");
                setHmFormYieldQty(1000);
                setHmFormYieldUnit("ml");
                setHmFormDescription("");
                setHmFormIngredients([]);
                setCurrHmIngCode(master[0]?.code || "");
                setCurrHmIngQty(0);
                setIsHmModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#D4A853] hover:from-amber-600 hover:to-amber-500 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer transform hover:-translate-y-0.5"
            >
              Buat Formula Baru
            </button>
          </div>

          {(state.homemadeIngredients || []).length === 0 ? (
            <div className="text-center py-16 bg-black/20 border border-amber-500/5 rounded-2xl">
              <span className="text-4xl">🍯</span>
              <h4 className="mt-3 font-serif font-bold text-amber-200">Belum Ada Formulasi Homemade</h4>
              <p className="text-xs text-amber-100/40 mt-1 max-w-md mx-auto">
                Silakan buat formulasi pertamamu (misal: Vanilla Syrup Internal, Pandan Extract, atau Kyoto Matcha Base) untuk mulai menghitung COGS racikan kustommu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(state.homemadeIngredients || []).map(hm => {
                // Compute batch total cost
                let batchTotalCost = 0;
                hm.ingredients.forEach(ing => {
                  batchTotalCost += calculateIngredientCost(ing.code, ing.qty);
                });
                const unitCost = hm.yieldQty > 0 ? batchTotalCost / hm.yieldQty : 0;

                return (
                  <div key={hm.id} className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400/50 transition duration-300 relative overflow-hidden group shadow-md">
                    {/* Glow effect on hover */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
                    
                    <div>
                      {/* Badge and ID row */}
                      <div className="flex justify-between items-center mb-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border ${
                          hm.category === "Syrup" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          hm.category === "Cordial" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                          hm.category === "Premix" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          "bg-stone-500/10 text-stone-400 border-stone-500/20"
                        }`}>
                          🍯 {hm.category}
                        </span>
                        <span className="text-[10px] text-amber-200/30 font-mono">{hm.id}</span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-amber-100 mb-1 group-hover:text-amber-300 transition duration-200">
                        {hm.name}
                      </h4>
                      
                      <p className="text-[11px] text-amber-100/55 line-clamp-2 min-h-[32px] mb-4 italic leading-relaxed">
                        {hm.description || "Tidak ada deksripsi khusus rumus formulasi."}
                      </p>

                      {/* Financial breakdown block */}
                      <div className="bg-black/25 rounded-xl border border-amber-400/5 p-3 mb-4 space-y-1.5 font-mono">
                        <div className="flex justify-between items-center text-[10px] text-amber-200/40">
                          <span>Yield Standar Batch:</span>
                          <span className="text-amber-200 font-bold">{hm.yieldQty.toLocaleString("id-ID")} {hm.yieldUnit}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-amber-200/40">
                          <span>HPP Total Batch:</span>
                          <span className="text-amber-100 font-bold">Rp {batchTotalCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="border-t border-amber-500/10 my-1 pt-1 flex justify-between items-center text-xs">
                          <span className="text-amber-400 font-semibold font-serif">Nilai per {hm.yieldUnit}:</span>
                          <span className="text-amber-300 font-bold text-sm">
                            Rp {unitCost.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Ingredients List */}
                      <div className="mb-5 space-y-1">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-amber-200/30">Rasio Komposisi:</p>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                          {hm.ingredients.map(ing => {
                            const rawM = master.find(m => m.code === ing.code);
                            const conv = rawM ? getUnitConversion(rawM) : { unitLabel: "unit", factor: 1, pricePerUnit: 0 };
                            const calculatedCost = calculateIngredientCost(ing.code, ing.qty);
                            return (
                              <div key={ing.code} className="flex justify-between text-[11px] font-mono leading-relaxed text-amber-100/70 border-b border-amber-500/5 pb-0.5">
                                <span className="truncate max-w-[120px]">{rawM?.name || ing.code}</span>
                                <span>
                                  {parseFloat((ing.qty * conv.factor).toFixed(3))} {conv.unitLabel} 
                                  <span className="text-amber-200/30 text-[9px] ml-1">(Rp {calculatedCost.toLocaleString("id-ID", { maximumFractionDigits: 0 })})</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-amber-500/5 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedMfgId(hm.id);
                          setMfgQtySelect(1);
                          setIsMfgModalOpen(true);
                        }}
                        className="flex-1 bg-amber-50 hover:bg-amber-600 text-black font-semibold rounded-xl py-2 text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        🏭 Rebus Batch
                      </button>
                      <button
                        onClick={() => {
                          setHmModalMode("edit");
                          setEditingHmId(hm.id);
                          setHmFormName(hm.name);
                          setHmFormCategory(hm.category as any);
                          setHmFormYieldQty(hm.yieldQty);
                          setHmFormYieldUnit(hm.yieldUnit as any);
                          setHmFormDescription(hm.description || "");
                          setHmFormIngredients([...hm.ingredients]);
                          setCurrHmIngCode(master[0]?.code || "");
                          setCurrHmIngQty(0);
                          setIsHmModalOpen(true);
                        }}
                        className="p-2 border border-[#D4A853]/20 hover:border-amber-400 rounded-xl text-amber-200 hover:text-amber-100 transition duration-200 cursor-pointer"
                        title="Edit Formula"
                      >
                        ⚙️
                      </button>
                      <button
                        onClick={() => handleDeleteHomemadeItem(hm.id, hm.name)}
                        className="p-2 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition duration-200 cursor-pointer"
                        title="Hapus"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* TAB 2: CASHER SIMULATION / AUTOPOTONG STOCK */}
      {activeSubTab === "simulation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Sale Input Form */}
          <div className="bg-[#1a0a00]/50 border border-[#D4A853]/25 rounded-2xl p-5 space-y-4">
            <div className="border-b border-[#D4A853]/15 pb-2">
              <h3 className="font-serif font-bold text-base text-amber-300">⚡ POS / Kasir Otomatis Pemotong Stok</h3>
              <p className="text-[11px] text-amber-200/45 mt-0.5">
                Simulasi transaksi kasir. Setiap menu terjual akan otomatis memotong ketersediaan bahan baku di <b>{state.branding.storageBarName}</b> dan meng-update logs stock opname harian.
              </p>
            </div>

            <form onSubmit={handleProcessSaleSimulation} className="space-y-4 text-xs font-sans">
              
              {/* Product selector */}
              <div>
                <label className="block text-amber-200/50 mb-1 font-mono text-[10px] uppercase">Pilih Produk</label>
                <select
                  value={simSaleRecipeId}
                  onChange={(e) => setSimSaleRecipeId(e.target.value)}
                  className="w-full bg-[#150700] text-amber-100 border border-[#D4A853]/20 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 text-xs"
                >
                  {recipesList.length === 0 ? (
                    <option value="">(Belum ada resep terdata)</option>
                  ) : (
                    recipesList.map(r => {
                      const cost = calculateRecipeTotalCost(r);
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} - Rp {r.sellPrice.toLocaleString("id-ID")}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* Quantity and Barista */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-200/50 mb-1 font-mono text-[10px] uppercase">Jumlah (Cup)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={simSaleQty}
                    onChange={(e) => setSimSaleQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-[#150700] text-amber-100 border border-[#D4A853]/20 rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-amber-200/50 mb-1 font-mono text-[10px] uppercase">Kasir / Barista</label>
                  <select
                    value={simSaleBy}
                    onChange={(e) => setSimSaleBy(e.target.value)}
                    className="w-full bg-[#150700] text-amber-100 border border-[#D4A853]/20 rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-xs"
                  >
                    {staffList.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic ingredients display */}
              {(() => {
                const activeRec = recipesList.find(r => r.id === simSaleRecipeId);
                if (!activeRec) return null;

                return (
                  <div className="bg-black/25 p-3.5 rounded-xl border border-amber-500/5 space-y-2">
                    <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Kandungan Resep &amp; Logistik Terpotong:</p>
                    <div className="space-y-1">
                      {!isAuthorized && activeRec.isSecret ? (
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-amber-300 font-bold">🔒 {activeRec.secretBaseName || "Kopi Signature Concentrate"}</span>
                          <span className="font-mono text-amber-200/50">
                            {(activeRec.secretBaseQty || 30) * simSaleQty} {activeRec.secretBaseUnit || "ml"} [Terpotong]
                          </span>
                        </div>
                      ) : (
                        activeRec.ingredients.map(ing => {
                          const isHm = ing.code.startsWith("HM-");
                          const m = isHm
                            ? (state.homemadeIngredients || []).find(h => h.id === ing.code)
                            : master.find(m => m.code === ing.code);
                          const requiredTotal = ing.qty * simSaleQty;
                          const barStock = isHm ? 999 : (storage.bar[ing.code] || 0); // Homemade ingredients assumed prepared
                          const isStockLow = !isHm && barStock < requiredTotal;
                          const nameString = isHm ? (m as any)?.name : (m as any)?.name || ing.code;
                          const unitString = isHm ? (m as any)?.yieldUnit : (m as any)?.unit || "unit";

                          return (
                            <div key={ing.code} className="flex justify-between text-[11px] font-sans">
                              <span className="text-amber-100/60 truncate max-w-[160px]">{nameString}</span>
                              <span className={`font-mono font-semibold ${isStockLow ? "text-red-400" : "text-amber-200"}`}>
                                {requiredTotal.toFixed(2)} / <span className="text-amber-200/40">{isHm ? "Sedia" : `${barStock} ${unitString}`}</span>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Process submit button */}
              <button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-xl py-2.5 cursor-pointer text-xs active:scale-95 transition tracking-wider shadow-lg shadow-amber-950/20"
              >
                🥤 Proses Penjualan &amp; Potong Stok
              </button>
            </form>
          </div>

          {/* Today's Live Sales Logging */}
          <div className="lg:col-span-2 flex flex-col bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden min-h-[350px]">
            <div className="bg-black/25 px-5 py-3 border-b border-[#D4A853]/10">
              <span className="text-xs font-mono text-amber-200/50">RIWAYAT PENJUALAN HARIAN ({salesList.length} Transaksi)</span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-black/10 font-mono text-[10px] text-amber-200/30 uppercase tracking-wider border-b border-[#D4A853]/5 py-2.5">
                    <th className="py-2.5 px-4">ID Transaksi</th>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">Nama Produk</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-4 text-right">Subtotal Omset</th>
                    <th className="py-2.5 px-4 text-right">Estimasi HPP</th>
                    <th className="py-2.5 px-4">Pencatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4A853]/5 font-sans">
                  {salesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-amber-100/20 italic">
                        Belum ada riwayat transaksi penjualan terdata di sistem hari ini.
                      </td>
                    </tr>
                  ) : (
                    salesList.map((sale) => (
                      <tr key={sale.id} className="hover:bg-amber-500/5 transition">
                        <td className="py-3 px-4 font-mono text-[10px] text-amber-200/40">{sale.id}</td>
                        <td className="py-3 px-4 text-amber-200/60 font-mono">{sale.date}</td>
                        <td className="py-3 px-4 font-semibold text-amber-100">{sale.recipeName}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-amber-200">{sale.qty}</td>
                        <td className="py-3 px-4 text-right font-mono">Rp {sale.sellPrice.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                          Rp {sale.totalRevenue.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">
                          Rp {sale.totalCost.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 text-amber-200/75">{sale.by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* TAB 3: MONTHLY FINANCIALS & SVG CHARTS */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 animate-fadeIn font-sans">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SVG Interactive Financial Performance Chart */}
            <div className="lg:col-span-2 bg-[#1a0a00]/50 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-300">📈 Grafik Laporan Keuangan &amp; COGS Bulanan</h3>
                <p className="text-xs text-amber-200/40 mt-1">
                  Realisasi perbandingan bulanan antara total Omset Pendapatan menu, HPP bahan baku, dan total waste logistik.
                </p>
              </div>

              {/* 📊 INTERACTIVE HANDCRAFTED CUSTOM SVG CHART */}
              {(() => {
                if (monthlyReport.length === 0) {
                  return <div className="text-center py-20 text-amber-150/20 italic">Belum tersedia data penjualan bulanan.</div>;
                }

                // Gather maximum value for dynamic scaling
                const maxVal = Math.max(...monthlyReport.map(r => Math.max(r.revenue, r.cogsActual, r.wasteLoss)), 100000);
                const chartHeight = 240;
                const chartWidth = 560;
                const padding = 40;

                // Generate points
                const xStep = monthlyReport.length > 1 ? (chartWidth - padding * 2) / (monthlyReport.length - 1) : chartWidth / 2;
                
                const revenuePoints = monthlyReport.map((m, i) => {
                  const x = padding + i * xStep;
                  const y = chartHeight - padding - ((m.revenue / maxVal) * (chartHeight - padding * 2));
                  return { x, y };
                });

                const cogsPoints = monthlyReport.map((m, i) => {
                  const x = padding + i * xStep;
                  const y = chartHeight - padding - ((m.cogsActual / maxVal) * (chartHeight - padding * 2));
                  return { x, y };
                });

                const wastePoints = monthlyReport.map((m, i) => {
                  const x = padding + i * xStep;
                  const y = chartHeight - padding - ((m.wasteLoss / maxVal) * (chartHeight - padding * 2));
                  return { x, y };
                });

                return (
                  <div className="bg-black/30 p-2.5 rounded-xl border border-amber-500/5 relative">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = padding + ratio * (chartHeight - padding * 2);
                        const val = maxVal * (1 - ratio);
                        return (
                          <g key={idx} className="opacity-40">
                            <line
                              x1={padding}
                              y1={y}
                              x2={chartWidth - padding}
                              y2={y}
                              stroke="#D4A853"
                              strokeWidth="0.5"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={padding - 8}
                              y={y + 4}
                              fill="#D4A853"
                              fontSize="8"
                              fontFamily="monospace"
                              textAnchor="end"
                              className="fill-amber-100/40"
                            >
                              Rp {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                            </text>
                          </g>
                        );
                      })}

                      {/* X Axis month titles */}
                      {monthlyReport.map((m, i) => {
                        const x = padding + i * xStep;
                        return (
                          <text
                            key={i}
                            x={x}
                            y={chartHeight - 12}
                            fill="#D4A853"
                            fontSize="8"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="fill-amber-100/40"
                          >
                            {m.monthCode}
                          </text>
                        );
                      })}

                      {/* Dynamic Multi-line Paths */}
                      <path
                        d={`M ${revenuePoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                      />
                      <path
                        d={`M ${cogsPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                      />
                      <path
                        d={`M ${wastePoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="drop-shadow-[0_2px_8px_rgba(239,68,68,0.2)]"
                      />

                      {/* Data coordinates interactive circular anchors */}
                      {revenuePoints.map((p, idx) => (
                        <circle key={`rev-${idx}`} cx={p.x} cy={p.y} r="4" fill="#10B981" stroke="#ffffff" strokeWidth="1" />
                      ))}
                      {cogsPoints.map((p, idx) => (
                        <circle key={`cogs-${idx}`} cx={p.x} cy={p.y} r="3.5" fill="#F59E0B" stroke="#ffffff" strokeWidth="1" />
                      ))}
                      {wastePoints.map((p, idx) => (
                        <circle key={`waste-${idx}`} cx={p.x} cy={p.y} r="3" fill="#EF4444" stroke="#ffffff" strokeWidth="1" />
                      ))}
                    </svg>

                    {/* Legend */}
                    <div className="flex gap-4.5 justify-center items-center mt-3 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-1 bg-emerald-500 rounded"></span> Total Omset
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-3 h-1 bg-amber-500 rounded"></span> HPP Aktual
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <span className="w-3 h-1 bg-red-500 rounded"></span> Rugi Waste Bar
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Category analysis details bento */}
            <div className="bg-[#1a0a00]/50 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-300">🥛 Distribusi Cost Berdasarkan Kategori</h3>
                <p className="text-xs text-amber-200/40 mt-1">Karakteristik margin profit per pos minuman di Axes Coffee.</p>
              </div>

              <div className="space-y-4">
                {categoryMetrics.map(catItem => {
                  return (
                    <div key={catItem.category} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-amber-150">{catItem.category}</span>
                        <span className="text-amber-100/60 font-mono">HPP: {catItem.hppPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/30 h-2.5 rounded-full overflow-hidden border border-amber-500/5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            catItem.hppPercent <= 20 
                              ? "bg-emerald-500" 
                              : catItem.hppPercent <= 30 
                              ? "bg-amber-400" 
                              : "bg-orange-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, catItem.hppPercent))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-amber-200/35 font-mono">
                        <span>Pemasukan: Rp {catItem.rev.toLocaleString("id-ID")}</span>
                        <span>{catItem.qty} Cup</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="text-[10px] text-amber-250 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg italic">
                  💡 Tips: Standard ideal HPP di industri F&amp;B adalah kisaran <b>28% s.d 35%</b>. Kategori dengan HPP di atas 35% membutuhkan penyesuaian porsi takaran resep.
                </p>
              </div>
            </div>
          </div>

          {/* Month Table Presentation statement */}
          <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl overflow-hidden">
            <div className="bg-black/25 px-5 py-3 border-b border-[#D4A853]/10">
              <span className="text-xs font-mono text-amber-200/50">RINCIAN PRESENTASI LAPORAN HPP BULANAN SECARA BULANAN</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-black/10 font-mono text-[10px] text-amber-200/40 uppercase tracking-wider border-b border-[#D4A853]/5 py-3">
                    <th className="py-3 px-5">Bulan</th>
                    <th className="py-3 px-4 text-center">Total Penjualan Qty</th>
                    <th className="py-3 px-4 text-right">Laporan Omset (Rp)</th>
                    <th className="py-3 px-4 text-right">COGS Pokok Berjalan</th>
                    <th className="py-3 px-4 text-right">Rugi Waste Terdata</th>
                    <th className="py-3 px-4 text-right">COGS Aktual (Rp)</th>
                    <th className="py-3 px-4 text-center">Rasio COGS Aktual (%)</th>
                    <th className="py-3 px-5 text-center">Gross Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4A853]/5">
                  {monthlyReport.map(rep => {
                    const statusText = rep.percentActual <= 35 
                      ? "text-emerald-400 font-semibold"
                      : "text-red-400 font-semibold";

                    return (
                      <tr key={rep.monthCode} className="hover:bg-amber-500/5 transition">
                        <td className="py-3.5 px-5 font-bold text-amber-100">{rep.label}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{rep.salesCount} pcs</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          Rp {rep.revenue.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">Rp {rep.cogsIdeal.toLocaleString("id-ID")}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-red-300">Rp {rep.wasteLoss.toLocaleString("id-ID")}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-orange-400">
                          Rp {rep.cogsActual.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded ${statusText}`}>
                            {rep.percentActual.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-emerald-400 font-bold">
                          {rep.grossMargin.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Panel: Audit Logs & Stock Movements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Audit Logs */}
            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-300">📋 Log Audit Aktivitas Global</h3>
                <p className="text-[11px] text-amber-200/40 mt-1">
                  Catatan kronologis aktivitas operasional (Login, Logout, CRUD Employee, Penjualan, Absensi, dll).
                </p>
              </div>
              <div className="bg-black/30 rounded-xl border border-[#D4A853]/10 max-h-[350px] overflow-y-auto divide-y divide-[#D4A853]/5 font-mono text-xs">
                {activityLogsGlobal.length === 0 ? (
                  <div className="p-4 text-center text-amber-200/20 italic">Belum ada log aktivitas global yang dicatat.</div>
                ) : (
                  activityLogsGlobal.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-amber-500/5 transition space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded text-[10px] font-bold">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-amber-200/40">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <p className="text-amber-100">{log.description}</p>
                      <div className="text-[10px] text-amber-200/30">Oleh: {log.user_id}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stock Movements */}
            <div className="bg-[#1a0a00]/40 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-serif font-bold text-sm text-amber-300">🔄 Log Histori Mutasi Stok</h3>
                <p className="text-[11px] text-amber-200/40 mt-1">
                  Pergerakan fisik stok bahan baku (In, Out, Adjust) dengan perbandingan volume stok Sebelum &amp; Sesudah.
                </p>
              </div>
              <div className="bg-black/30 rounded-xl border border-[#D4A853]/10 max-h-[350px] overflow-y-auto divide-y divide-[#D4A853]/5 font-mono text-xs text-amber-100 font-sans">
                {stockMovements.length === 0 ? (
                  <div className="p-4 text-center text-amber-200/20 italic">Belum ada mutasi stok yang tercatat.</div>
                ) : (
                  stockMovements.map((sm) => {
                    const material = master.find((m) => m.code === sm.item_id);
                    const unitLabel = material?.unit || "unit";
                    const itemLabel = material?.name || sm.item_id;
                    const changeColor = sm.type === "IN" ? "text-emerald-400" : sm.type === "OUT" ? "text-red-400" : "text-amber-400";
                    const prefix = sm.type === "IN" ? "+" : sm.type === "OUT" ? "-" : "~";

                    return (
                      <div key={sm.id} className="p-3 hover:bg-amber-500/5 transition space-y-1 font-sans">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-amber-200">{itemLabel}</span>
                          <span className="text-[10px] text-amber-200/40 font-mono">
                            {new Date(sm.created_at).toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <div>
                            <span className="text-amber-200/40">Mutasi: </span>
                            <span className={`font-bold ${changeColor}`}>{prefix}{sm.quantity} {unitLabel}</span>
                          </div>
                          <div>
                            <span className="text-amber-200/40">Stok: </span>
                            <span className="font-mono">{sm.before_stock} → {sm.after_stock}</span>
                          </div>
                        </div>
                        <p className="text-xs text-amber-300/70 italic mt-1">{sm.reason}</p>
                        <div className="text-[10px] text-amber-200/30">Diproses oleh: {sm.created_by}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 4: INTELLIGENT COGS RECOMMENDATIONS */}
      {activeSubTab === "ai" && (
        <div className="bg-[#1a0a00]/50 border border-[#D4A853]/15 rounded-2xl p-6 space-y-6 animate-fadeIn font-sans">
          
          <div className="border-b border-[#D4A853]/15 pb-3">
            <h3 className="font-serif font-bold text-lg text-amber-300">✨ Rekomendasi Efisiensi &amp; Analisis COGS Pintar</h3>
            <p className="text-xs text-amber-200/40 mt-1">
              Rekomendasi taktis untuk menekan COGS (HPP) dan mengeliminasi kebocoran raw material di Axes Coffee, diolah langsung berdasarkan histori transaksi dan database real-time Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
            
            {/* 1. High HPP items analysis card */}
            <div className="bg-black/25 p-5 rounded-2xl border border-amber-500/5 space-y-4">
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
                ⚠️ Formulasi Menu dengan HPP Tertinggi
              </h4>
              <p className="text-xs text-amber-100/50">
                Menu-menu berikut memiliki persentase COGS di atas 30%. Memerlukan peninjauan porsi takaran bahan atau optimasi suplai pembelian supplier:
              </p>

              <div className="space-y-2.5 text-xs">
                {recipesList.map(recipe => {
                  const cost = calculateRecipeTotalCost(recipe);
                  const pct = recipe.sellPrice > 0 ? (cost / recipe.sellPrice) * 100 : 0;
                  return { ...recipe, cost, pct };
                })
                .sort((a, b) => b.pct - a.pct)
                .slice(0, 3)
                .map((recItem, idx) => {
                  return (
                    <div key={recItem.id} className="bg-black/15 p-3 rounded-xl border border-red-500/10 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-red-300">{idx + 1}. {recItem.name}</span>
                        <div className="text-[10px] text-amber-200/40 font-mono mt-0.5">
                          Harga Jual: Rp {recItem.sellPrice.toLocaleString("id-ID")} | Cost HPP: Rp {recItem.cost.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <span className="font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15">
                        {recItem.pct.toFixed(1)}% HPP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Waste financial leakage card */}
            <div className="bg-black/25 p-5 rounded-2xl border border-amber-500/5 space-y-4">
              <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
                🗑️ Analisis Kebocoran Keuangan (Waste Impact)
              </h4>
              <p className="text-xs text-amber-100/50">
                Kebocoran pemborosan logistik di bar/gudang sangat berdampak pada margin profit bulanan. Berikut kalkulasi persentase kebocoran:
              </p>

              {(() => {
                const totalLossVal = wastes.reduce((acc, w) => acc + (w.loss || 0), 0);
                const totalRevenueVal = salesList.reduce((acc, s) => acc + s.totalRevenue, 1);
                const leakagePct = (totalLossVal / totalRevenueVal) * 100;

                return (
                  <div className="space-y-4">
                    <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-mono text-amber-200/40">Waste Leakage Margin</p>
                        <p className="font-mono font-bold text-red-300 text-sm mt-1">Rp {totalLossVal.toLocaleString("id-ID")} Terbuang</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-mono text-amber-200/40">Persentase Kebocoran</p>
                        <p className="font-mono font-extrabold text-red-400 text-lg mt-1">{leakagePct.toFixed(2)}% dari Omset</p>
                      </div>
                    </div>

                    <p className="text-xs text-amber-200/45 italic leading-relaxed">
                      💡 Dampak Keuangan: Kebocoran bahan mentah sebesar <b>{leakagePct.toFixed(2)}%</b> mengikis keuntungan bersih Anda. Idealnya kebocoran logistik F&amp;B wajib dikunci di bawah <b>1%</b> dari total pendapatan kotor bulanan.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* AI Strategy recommendations bullet timeline */}
          <div className="bg-amber-500/5 border border-[#D4A853]/15 rounded-2xl p-5 space-y-4 text-xs">
            <h4 className="font-serif font-bold text-amber-300 text-sm flex items-center gap-1.5">
              ☕ STRATEGI PENGAWASAN COGS DAN PROTEKSI MARGIN CAFE
            </h4>
            
            <div className="space-y-3.5 leading-relaxed font-sans">
              <div className="flex gap-3">
                <span className="text-lg shrink-0">🟢</span>
                <div>
                  <p className="font-bold text-amber-100">Disiplin FIFO pada Kulkas Bar Chiller</p>
                  <p className="text-amber-150/70 mt-1">
                    Susu cair fresh dan konsentrat cair menyerap 45% pemborosan (waste) akibat expired yang terlalu cepat setelah kemasan dibuka (umur simpan 24 jam). Gunakan botol pump bertanggal untuk mendisiplinkan crew dalam menghabiskan stok lama terlebih dahulu.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg shrink-0">🟢</span>
                <div>
                  <p className="font-bold text-amber-100">Evaluasi Takaran Oat Milk Oatside pada Menu Latte</p>
                  <p className="text-amber-150/70 mt-1">
                    Saat ini <b>Caffe Oatside Latte</b> memiliki persentase COGS tertinggi (27.3%) akibat harga beli Oat Milk Oatside Barista yang relatif premium (Rp 45.000 / liter). Batasi porsi tuang oatside maksimal 145ml, atau sesuaikan harga jual ke level Rp 42.000 untuk meningkatkan margin laba kotor kembali ke angka 75%.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-lg shrink-0">🟢</span>
                <div>
                  <p className="font-bold text-amber-100">Kalibrasi Grinder Espresso Pagi (Preventive Weight Guard)</p>
                  <p className="text-amber-150/70 mt-1">
                    Lakukan Dial-In kalibrasi pagi secara ketat maksimal 2 kali coba. Kegagalan barista menyetel kehalusan biji kopi di pagi hari menyebabkan penumpukan espresso shot terbuang pecuma (waste espresso dregs) yang sering tidak tercatat namun mendistorsi laba aktual bulanan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: BUAT / EDIT RECIPE --- */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-[#1c0c02] border border-[#D4A853]/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-black/35 px-6 py-4 border-b border-[#D4A853]/15 flex justify-between items-center">
              <h3 className="font-serif font-bold text-amber-300 text-sm">
                {modalMode === "create" ? "➕ Buat Formulasi Menu Resep Baru" : "✏️ Edit Formulasi Menu Resep"}
              </h3>
              <button
                onClick={() => setIsRecipeModalOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRecipe} className="p-6 space-y-4 text-xs font-sans">
              
              {/* Product details details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-250 mb-1">Nama Minuman / Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Es Kopi Susu Gula Aren"
                    value={recipeFormName}
                    onChange={(e) => setRecipeFormName(e.target.value)}
                    className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-amber-250 mb-1">Kategori Menu</label>
                  <select
                    value={recipeFormCategory}
                    onChange={(e) => setRecipeFormCategory(e.target.value)}
                    className="w-full bg-[#1c0c02] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                  >
                    <option value="Coffee">Coffee</option>
                    <option value="Milk-based">Milk-based</option>
                    <option value="Non-Coffee">Non-Coffee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Harga Jual Menu (Harga Point Of Sale)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={recipeFormSellPrice}
                  onChange={(e) => setRecipeFormSellPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* Secret Recipe Mode Config (Module 17) */}
              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-300 text-xs">
                  <input
                    type="checkbox"
                    checked={recipeFormIsSecret}
                    onChange={(e) => setRecipeFormIsSecret(e.target.checked)}
                    className="rounded border-[#D4A853]/30 bg-black/40 text-amber-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>🔒 Aktifkan Secret Recipe Mode (Sembunyikan Formula dari Barista)</span>
                </label>
                
                {recipeFormIsSecret && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn text-[11px] border-t border-amber-500/5 pt-3">
                    <div className="sm:col-span-1">
                      <label className="block text-amber-100/40 mb-1 font-mono uppercase">Nama Masking Base (Tampilan Barista)</label>
                      <input
                        type="text"
                        value={recipeFormSecretBaseName}
                        onChange={(e) => setRecipeFormSecretBaseName(e.target.value)}
                        className="w-full bg-black/35 text-amber-100 border border-amber-500/10 rounded-lg p-1.5 focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-100/40 mb-1 font-mono uppercase">Beban Qty Tampilan</label>
                      <input
                        type="number"
                        value={recipeFormSecretBaseQty}
                        onChange={(e) => setRecipeFormSecretBaseQty(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/35 text-amber-100 border border-amber-500/10 rounded-lg p-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-amber-100/40 mb-1 font-mono uppercase">Unit Tampilan</label>
                      <input
                        type="text"
                        value={recipeFormSecretBaseUnit}
                        onChange={(e) => setRecipeFormSecretBaseUnit(e.target.value)}
                        className="w-full bg-black/35 text-amber-100 border border-amber-500/10 rounded-lg p-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ingredients builder */}
              <div className="bg-black/25 p-4 rounded-xl border border-amber-500/10 space-y-3">
                <p className="font-mono text-[10px] text-amber-400 uppercase tracking-widest font-semibold">
                  🛠 Alat Pembuat Resep (Tambah Bahan Baku)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="sm:col-span-1.5">
                    <label className="block text-amber-100/40 text-[9px] mb-1 font-mono uppercase">Pilih Bahan</label>
                    <select
                      value={currIngCode}
                      onChange={(e) => setCurrIngCode(e.target.value)}
                      className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/10 px-2 py-1.5 rounded-lg outline-none text-[11px]"
                    >
                      <optgroup label="Bahan Baku Master" className="bg-[#1c0c02] text-[#D4A853]">
                        {master.map(m => (
                          <option key={m.code} value={m.code}>
                            {m.name} ({m.unit})
                          </option>
                        ))}
                      </optgroup>
                      {(state.homemadeIngredients || []).length > 0 && (
                        <optgroup label="Homemade (Syrup / Cordial / Premix)" className="bg-[#1c0c02] text-amber-400">
                          {(state.homemadeIngredients || []).map(hm => (
                            <option key={hm.id} value={hm.id}>
                              ✨ {hm.name} ({hm.yieldUnit})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {(() => {
                    const selectedItem = currIngCode.startsWith("HM-")
                      ? (state.homemadeIngredients || []).find(h => h.id === currIngCode)
                      : master.find(m => m.code === currIngCode);
                    const conv = selectedItem ? getUnitConversion(selectedItem) : { unitLabel: "porsi", pricePerUnit: 0, factor: 1 };
                    return (
                      <div>
                        <label className="block text-amber-100/40 text-[9px] mb-1 font-mono uppercase">
                          Takaran ({conv.unitLabel})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.0001"
                          value={currIngQty || ""}
                          onChange={(e) => setCurrIngQty(parseFloat(e.target.value) || 0)}
                          placeholder={conv.unitLabel === "gram" ? "Contoh: 18" : conv.unitLabel === "ml" ? "Contoh: 15" : "Contoh: 1"}
                          className="w-full bg-black/35 text-[#D4A853] border border-[#D4A853]/25 px-2 py-1.5 rounded-lg outline-none text-[11px] font-mono font-bold"
                        />
                        <span className="block text-[8px] text-amber-200/50 mt-1 font-mono">
                          Rate: Rp {conv.pricePerUnit.toLocaleString("id-ID", { maximumFractionDigits: 2 })} / {conv.unitLabel}
                        </span>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={handleAddIngredientToForm}
                    className="bg-[#D4A853] hover:bg-amber-600 text-black font-semibold rounded-lg py-1.5 text-center leading-3 transition text-[10.5px] cursor-pointer"
                  >
                    Masukan Bahan
                  </button>
                </div>

                {/* List of current recipe draft ingredients */}
                <div className="border-t border-[#D4A853]/10 pt-3">
                  <span className="text-[9px] font-mono text-amber-200/50 uppercase">Rancangan Detail Resep:</span>
                  <div className="space-y-1 mt-1.5 max-h-32 overflow-y-auto">
                    {recipeFormIngredients.length === 0 ? (
                      <p className="text-[10px] text-amber-100/20 italic py-3 text-center">Belum ada bahan baku dimasukkan ke formulasi ini.</p>
                    ) : (
                      recipeFormIngredients.map(ing => {
                        const m = ing.code.startsWith("HM-")
                          ? (state.homemadeIngredients || []).find(h => h.id === ing.code)
                          : master.find(m => m.code === ing.code);
                        const rowCost = calculateIngredientCost(ing.code, ing.qty);
                        const conv = m ? getUnitConversion(m) : { unitLabel: "unit", factor: 1, pricePerUnit: 0 };
                        const nameString = ing.code.startsWith("HM-") ? (m as any)?.name : (m as any)?.name || ing.code;
                        const factorValue = ing.code.startsWith("HM-") ? 1 : conv.factor;
                        return (
                          <div key={ing.code} className="flex justify-between items-center text-[11px] bg-[#1c0c02] p-1.5 rounded border border-[#D4A853]/10">
                            <span className="text-amber-100">
                              {nameString} - <b className="text-[#D4A853]">{parseFloat((ing.qty * factorValue).toFixed(4))}</b> {conv.unitLabel}
                              <span className="text-amber-200/40 text-[9px] ml-1.5 font-mono">(@ Rp {conv.pricePerUnit.toLocaleString("id-ID", { maximumFractionDigits: 1 })}/{conv.unitLabel})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-300 font-mono">Rp {rowCost.toLocaleString("id-ID")}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredientFromForm(ing.code)}
                                className="text-red-400 hover:text-red-300 font-bold px-1.5 cursor-pointer text-xs"
                                title="Hapus Bahan"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Simulated Cost Summary */}
                {recipeFormIngredients.length > 0 && (
                  <div className="border-t border-amber-500/10 pt-2 flex justify-between text-xs text-amber-300 font-mono bg-black/10 p-2 rounded-lg font-bold">
                    <span>Estimasi HPP Resep:</span>
                    <span>
                      Rp {recipeFormIngredients.reduce((s, ing) => s + calculateIngredientCost(ing.code, ing.qty), 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action operations buttons */}
              <div className="flex gap-3.5 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecipeModalOpen(false)}
                  className="bg-black/25 text-amber-100 border border-[#D4A853]/15 rounded-xl px-4 py-2 cursor-pointer transition hover:bg-black/45"
                >
                  Batal ke Menu
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A853] text-black font-semibold rounded-xl px-6 py-2 cursor-pointer shadow-md shadow-[#D4A853]/10 active:scale-95 transition"
                >
                  💾 Simpan Resep Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: BUAT / EDIT HOMEMADE INGREDIENT FORMULATION --- */}
      {isHmModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-[#1c0c02] border border-[#D4A853]/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp text-xs">
            
            {/* Modal Header */}
            <div className="bg-black/35 px-6 py-4 border-b border-[#D4A853]/15 flex justify-between items-center">
              <h3 className="font-serif font-bold text-amber-300 text-sm">
                {hmModalMode === "create" ? "🍯 Buat Formula Racikan Homemade Baru" : "✏️ Edit Formula Racikan Homemade"}
              </h3>
              <button
                type="button"
                onClick={() => setIsHmModalOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 font-bold cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHomemadeItem} className="p-6 space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-250 mb-1">Nama Racikan Homemade</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Vanilla Syrup 1:1"
                    value={hmFormName}
                    onChange={(e) => setHmFormName(e.target.value)}
                    className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-250 mb-1">Kategori Racikan</label>
                  <select
                    value={hmFormCategory}
                    onChange={(e) => setHmFormCategory(e.target.value as any)}
                    className="w-full bg-[#1c0c02] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="Syrup">🍯 Syrup</option>
                    <option value="Cordial">🍊 Cordial</option>
                    <option value="Premix">📦 Premix</option>
                    <option value="Other">✨ Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-amber-250 mb-1">Yield Standar Hasil Rebusan</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hmFormYieldQty}
                    onChange={(e) => setHmFormYieldQty(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black/35 text-[#D4A853] border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-250 mb-1">Yield Unit</label>
                  <select
                    value={hmFormYieldUnit}
                    onChange={(e) => setHmFormYieldUnit(e.target.value as any)}
                    className="w-full bg-[#1c0c02] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 font-mono text-xs"
                  >
                    <option value="ml">ml (Milliliter)</option>
                    <option value="gram">g (Gram)</option>
                    <option value="pcs">pcs (Pieces)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-amber-250 mb-1">Petunjuk Pembuatan / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rebus gula pasir murni 1:1, masukkan sirup vanilla Toffin setelah dingin..."
                  value={hmFormDescription}
                  onChange={(e) => setHmFormDescription(e.target.value)}
                  className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Formulation Ingredients Builder */}
              <div className="bg-black/25 p-4 rounded-xl border border-amber-500/10 space-y-3">
                <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest font-semibold">
                  🌿 Rasio Formulasi Komposisi Bahan
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="sm:col-span-1.5">
                    <label className="block text-amber-100/40 text-[9px] mb-1 font-mono uppercase">Komponen Bahan</label>
                    <select
                      value={currHmIngCode}
                      onChange={(e) => setCurrHmIngCode(e.target.value)}
                      className="w-full bg-black/35 text-amber-100 border border-[#D4A853]/10 px-2 py-1.5 rounded-lg outline-none text-[11px]"
                    >
                      {master.map(m => (
                        <option key={m.code} value={m.code}>
                          {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const selItem = master.find(m => m.code === currHmIngCode);
                    const conv = selItem ? getUnitConversion(selItem) : { unitLabel: "komponen", pricePerUnit: 0, factor: 1 };
                    return (
                      <div>
                        <label className="block text-amber-100/40 text-[9px] mb-1 font-mono uppercase">
                          Jumlah ({conv.unitLabel})
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.0001"
                          value={currHmIngQty || ""}
                          onChange={(e) => setCurrHmIngQty(parseFloat(e.target.value) || 0)}
                          placeholder="Jumlah"
                          className="w-full bg-black/35 text-[#D4A853] border border-[#D4A853]/25 px-2 py-1.5 rounded-lg outline-none text-[11px] font-mono font-bold"
                        />
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={handleAddHmIngredientToForm}
                    className="bg-[#D4A853] hover:bg-amber-600 text-black font-semibold rounded-lg py-1.5 text-center transition text-[10.5px] cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>

                {/* Live Formula Draft components */}
                <div className="border-t border-[#D4A853]/10 pt-3">
                  <span className="text-[9px] font-mono text-amber-200/50 uppercase">Rancangan Komposisi:</span>
                  <div className="space-y-1 mt-1.5 max-h-32 overflow-y-auto">
                    {hmFormIngredients.length === 0 ? (
                      <p className="text-[10px] text-amber-100/20 italic py-3 text-center animate-pulse">Formulasi masih kosong.</p>
                    ) : (
                      hmFormIngredients.map(ing => {
                        const m = master.find(m => m.code === ing.code);
                        const conv = m ? getUnitConversion(m) : { unitLabel: "unit", factor: 1, pricePerUnit: 0 };
                        return (
                          <div key={ing.code} className="flex justify-between items-center text-[10px] bg-[#1c0c02] p-1.5 rounded border border-[#D4A853]/10 font-mono">
                            <span className="text-amber-100">
                              {m?.name || ing.code} - <b className="text-[#D4A853]">{parseFloat((ing.qty * conv.factor).toFixed(4))}</b> {conv.unitLabel}
                              <span className="text-amber-200/35 text-[9px] ml-1.5">(@ Rp {conv.pricePerUnit.toLocaleString("id-ID")}/{conv.unitLabel})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-300 font-mono font-bold">Rp {calculateIngredientCost(ing.code, ing.qty).toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHmIngredientFromForm(ing.code)}
                                className="text-red-400 hover:text-red-300 font-bold px-1.5 cursor-pointer text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Simulated Recipe Draft Batch cost */}
                {hmFormIngredients.length > 0 && (
                  <div className="border-t border-amber-500/10 pt-2 flex justify-between text-xs text-amber-300 font-mono bg-black/10 p-2 rounded-lg font-bold">
                    <span>Estimasi HPP Total Batch:</span>
                    <span>
                      Rp {hmFormIngredients.reduce((s, ing) => s + calculateIngredientCost(ing.code, ing.qty), 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit / Action buttons */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsHmModalOpen(false)}
                  className="bg-black/25 text-amber-100 border border-[#D4A853]/15 rounded-xl px-4 py-2 cursor-pointer transition hover:bg-black/45 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#D4A853] text-black font-semibold rounded-xl px-6 py-2 cursor-pointer transition shadow-md hover:bg-amber-400 text-xs"
                >
                  💾 Simpan Formula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: LIHAT & MANUFAKTUR PRODUCTION BATCH --- */}
      {isMfgModalOpen && selectedMfgId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-[#1c0c02] border border-[#D4A853]/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleUp text-xs font-sans">
            <div className="bg-[#241104] px-6 py-4 border-b border-[#D4A853]/15 flex justify-between items-center">
              <h3 className="font-serif font-bold text-amber-300 text-xs">
                🏭 Manufaktur &amp; Rebus Batch Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsMfgModalOpen(false)}
                className="text-amber-100/50 hover:text-amber-100 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const hm = (state.homemadeIngredients || []).find(h => h.id === selectedMfgId);
              if (!hm) return null;
              
              return (
                <form onSubmit={handleManufactureHomemadeItem} className="p-6 space-y-4 text-xs font-sans">
                  <div className="space-y-1">
                    <p className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">RESEP SEDANG DIPRODUKSI:</p>
                    <p className="text-sm font-semibold text-amber-100">{hm.name}</p>
                    <p className="text-[11px] text-amber-200/50 italic leading-relaxed">{hm.description}</p>
                  </div>

                  {/* Quantity selector */}
                  <div>
                    <label className="block text-amber-250 mb-1">Jumlah Batch Yang Diproduksi (Multiplexer)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={mfgQtySelect}
                      onChange={(e) => setMfgQtySelect(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-black/35 text-amber-300 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none font-mono font-bold text-sm"
                    />
                    <span className="block text-[9px] text-[#D4A853]/40 mt-1">
                      1 batch = {hm.yieldQty} {hm.yieldUnit}. Total produksi: <b>{hm.yieldQty * mfgQtySelect} {hm.yieldUnit}</b>.
                    </span>
                  </div>

                  <div>
                    <label className="block text-amber-250 mb-1">Barista Penangungjawab</label>
                    <select
                      value={mfgBy}
                      onChange={(e) => setMfgBy(e.target.value)}
                      className="w-full bg-[#1c0c02] text-amber-100 border border-[#D4A853]/15 rounded-xl px-3 py-2 outline-none text-xs"
                    >
                      {staffList.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Logistik terbuang display */}
                  <div className="bg-black/25 rounded-xl p-3 border border-amber-500/10 space-y-1.5">
                    <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">PENGURANGAN STOK BAR:</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {hm.ingredients.map(ing => {
                        const m = master.find(m => m.code === ing.code);
                        const conv = m ? getUnitConversion(m) : { unitLabel: "unit", factor: 1 };
                        const reqVal = ing.qty * mfgQtySelect;
                        const barS = storage.bar[ing.code] || 0;
                        const isLow = barS < reqVal;

                        return (
                          <div key={ing.code} className="flex justify-between font-mono text-[9px] text-amber-100/60 pb-0.5 border-b border-amber-500/5">
                            <span className="truncate max-w-[150px]">{m?.name || ing.code}</span>
                            <span className={isLow ? "text-red-400 font-bold" : "text-amber-200"}>
                              {(reqVal * conv.factor).toFixed(1)} {conv.unitLabel} (Ada: {(barS * conv.factor).toFixed(1)})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsMfgModalOpen(false)}
                      className="flex-1 bg-black/25 text-amber-100 border border-[#D4A853]/15 rounded-xl py-2 cursor-pointer transition hover:bg-black/45 font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl py-2 cursor-pointer transition shadow-[#D4A853]/10 shadow-md font-semibold"
                    >
                      🏭 Rebus Batch
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
