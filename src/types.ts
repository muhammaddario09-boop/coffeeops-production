export interface BrandBranding {
  name: string;
  logo: string; // Emoji logo e.g. "☕"
  tagline: string;
  storageGudangName: string; // e.g. "Gudang Utama"
  storageBarName: string; // e.g. "Bar Chiller"
  primaryColor: string; // Hex color or pre-configured tailwind class theme
  shiftPagiStart?: string;
  shiftPagiEnd?: string;
  shiftSiangStart?: string;
  shiftSiangEnd?: string;
  shiftMalamStart?: string;
  shiftMalamEnd?: string;
  lateThresholdMinutes?: number;
  cafeLat?: number;
  cafeLng?: number;
  gpsVerificationEnabled?: boolean;
  gpsVerificationRadius?: number;
}

export interface MasterItem {
  code: string;
  name: string;
  unit: string;
  par: number;
  price: number;
  supplier: string;
  temp: string;
  shelf: string;
  loc: "gudang" | "bar" | "both";
}

export interface InventoryItemState {
  awal: number;
  masuk: number;
  keluar: number;
  waste: number;
}

export interface InventoryState {
  [code: string]: InventoryItemState;
}

export interface StorageState {
  gudang: { [code: string]: number };
  bar: { [code: string]: number };
}

export interface FifoBatch {
  qty: number;
  inDate: string;
  expDate: string;
  used: boolean;
}

export interface FifoState {
  [code: string]: FifoBatch[];
}

export interface IssueItem {
  id: string;
  time: string;
  isoDate: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  cat: string;
  by: string;
  shift: string;
  note?: string;
}

export interface WasteItem {
  id: string;
  time: string;
  rawDate: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  cause: string;
  loss: number;
  by: string;
  action?: string;
}

export interface GrnItemRow {
  code: string;
  name: string;
  qty: number;
  unit: string;
  kondisi: string;
}

export interface GrnDoc {
  id: string;
  no: string;
  date: string;
  supplier: string;
  by: string;
  dest: "gudang" | "bar" | "both";
  items: GrnItemRow[];
  totalQty: number;
  totalItems: number;
}

export interface PrItemRow {
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface PrDoc {
  id: string;
  no: string;
  date: string;
  by: string;
  supplier: string;
  items: PrItemRow[];
  total: number;
  status: "Menunggu Approval" | "Menunggu Approval Head Barista" | "Menunggu Approval Manager" | "Menunggu Approval Owner" | "Disetujui" | "Ditolak" | "Selesai Order";
}

export interface TransferLog {
  id: string;
  time: string;
  date: string;
  code: string;
  name: string;
  qty: number;
  unit: string;
  from: "gudang" | "bar";
  to: "gudang" | "bar";
  reason: string;
  by: string;
}

export interface ActivityLog {
  id: string;
  icon: string;
  text: string;
  type: "in" | "out" | "waste" | "pr" | "transfer" | "info";
  time: string;
}

export interface User {
  id: string;
  name: string;
  role: "Owner" | "Manager" | "Supervisor" | "Head Barista" | "Barista" | "Bartender" | "Cashier" | "Kitchen" | "Service Staff" | "Head Waiter" | "Waiter" | "Front of House" | "Cleaning Service" | "Security";
  pin: string;
  staffCode?: string;
  email?: string;
  whatsappNumber?: string;
  branchId?: string;
  profilePhoto?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
}

export interface AttendanceLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  shift: string;
  status: "Hadir" | "Terlambat";
  hoursWorked?: number;
  facePhoto?: string;
}

export interface RecipeIngredient {
  code: string;
  qty: number;
}

export interface DrinkRecipe {
  id: string;
  name: string;
  category: string;
  sellPrice: number;
  ingredients: RecipeIngredient[];
  isSecret?: boolean;
  secretBaseName?: string; // e.g. "West Fusion Base"
  secretBaseQty?: number; // e.g. 30 ml
  secretBaseUnit?: string; // e.g. "ml"
}

export interface SaleTransaction {
  id: string;
  recipeId: string;
  recipeName: string;
  qty: number;
  sellPrice: number;
  totalRevenue: number;
  totalCost: number;
  date: string;
  by: string;
}

export interface HomemadeIngredient {
  id: string;
  name: string;
  yieldQty: number;
  yieldUnit: "ml" | "gram" | "pcs";
  ingredients: { code: string; qty: number }[]; // Raw materials from master (represented as standard base quantities e.g. 0.5 kg for 500 grams)
  category: "Syrup" | "Cordial" | "Premix" | "Other";
  description?: string;
  createdAt?: string;
}

export interface DailyChecklistRecord {
  id: string;
  type: "opening" | "closing" | "cleaning";
  date: string;
  time: string;
  staff: string;
  shift: string;
  outlet: string;
  status: "Belum Dikerjakan" | "Sedang Dikerjakan" | "Selesai";
  notes?: string;
  photoUrl?: string;
  items: {
    id: string;
    category: string;
    task: string;
    completed: boolean;
  }[];
}

export interface CalibrationLog {
  id: string;
  date: string;
  time: string;
  coffeeBatch: string;
  dose: number;
  yield: number;
  timeSec: number;
  grinderSetting: string;
  barista: string;
  status: "Pass" | "Fail";
  notes?: string;
}

export interface StockCheckItem {
  code: string;
  name: string;
  systemQty: number;
  actualQty: number;
  unit: string;
  variance: number;
  varianceCost: number;
}

export interface StockCheckLog {
  id: string;
  date: string;
  staff: string;
  items: StockCheckItem[];
  notes?: string;
}

export interface TemperatureLog {
  id: string;
  date: string;
  time: string;
  staff: string;
  chillerTemp: number;
  freezerTemp: number;
  milkStorageTemp: number;
  status: "OK" | "ALERT";
  notes?: string;
}

export interface ShiftHandover {
  id: string;
  date: string;
  time: string;
  fromShift: string;
  toShift: string;
  staffFrom: string;
  staffTo: string;
  notes: string;
  items: { label: string; value: string }[];
  isConfirmed: boolean;
  confirmedAt?: string;
}

export interface IncidentLogItem {
  id: string;
  date: string;
  time: string;
  pic: string;
  category: "Mesin Rusak" | "Grinder Macet" | "Komplain Customer" | "Barang Hilang" | "Lainnya";
  description: string;
  actionTaken: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  before_stock: number;
  after_stock: number;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface ActivityLogGlobal {
  id: string;
  user_id: string;
  action: "LOGIN" | "LOGOUT" | "CREATE_EMPLOYEE" | "UPDATE_EMPLOYEE" | "DELETE_EMPLOYEE" | "ADD_STOCK" | "REMOVE_STOCK" | "CREATE_SALE" | "CLOCK_IN" | "CLOCK_OUT";
  description: string;
  created_at: string;
}

export interface CoffeeOpsState {
  branding: BrandBranding;
  master: MasterItem[];
  inventory: InventoryState;
  storage: StorageState;
  fifo: FifoState;
  issues: IssueItem[];
  wastes: WasteItem[];
  grns: GrnDoc[];
  prs: PrDoc[];
  transfers: TransferLog[];
  activities: ActivityLog[];
  stockMovements?: StockMovement[];
  activityLogsGlobal?: ActivityLogGlobal[];
  users?: User[];
  recipes?: DrinkRecipe[];
  sales?: SaleTransaction[];
  homemadeIngredients?: HomemadeIngredient[];
  dailySopChecklistRules?: { id: string; type: "opening" | "closing" | "cleaning"; category: string; task: string }[];
  customHandoverFields?: { id: string; label: string }[];
  dailyChecklists?: DailyChecklistRecord[];
  calibrationLogs?: CalibrationLog[];
  stockCheckLogs?: StockCheckLog[];
  temperatureLogs?: TemperatureLog[];
  shiftHandovers?: ShiftHandover[];
  incidentLogs?: IncidentLogItem[];
  auditLogs?: AuditLogItem[];
  suppliers?: SupplierItem[];
  supplierMapping?: { [code: string]: { primary: string; secondary: string; emergency: string } };
  pos?: PoDoc[];
  reportSettings?: ReportSettings;
  reportQueue?: ReportLog[];
  serviceInventory?: ServiceInventoryItem[];
  serviceSop?: ServiceSopItem[];
  serviceCleaning?: ServiceCleaningTask[];
  serviceMaintenance?: ServiceMaintenanceItem[];
  serviceDailyReports?: ServiceDailyReport[];
  serviceEvidences?: ServiceEvidence[];
  serviceKPIs?: ServiceKPIRecord[];
  fohChecklists?: FohChecklistRecord[];
  fohFeedback?: FohFeedback[];
  fohComplaints?: FohComplaint[];
  fohTables?: FohTable[];
  fohInventory?: FohInventoryItem[];
  fohInventoryRequests?: FohInventoryRequest[];
  fohKpis?: FohKpi[];
  fohShifts?: FohShift[];
  fohTraining?: FohTraining[];
  fohTrainingResults?: FohTrainingResult[];
  employees?: FohEmployee[];
  employeeTasks?: FohEmployeeTask[];
  employeeKpis?: FohEmployeeKpi[];
  customerFeedbacks?: FohCustomerFeedback[];
  incidentReports?: FohIncidentReport[];
  fohChecklistTasks?: {
    opening: string[];
    service: string[];
    closing: string[];
  };
  sopsList?: SopItem[];
  equipmentList?: EquipmentAsset[];
  deviceSessions?: DeviceSession[];
  revokedSessionIds?: string[];
  bepData?: BepAnalytics;
  roiData?: RoiAnalytics;
  backupsList?: BackupItem[];
  backupAuditLogs?: BackupAuditLog[];
  disasterRecoveryActive?: boolean;
  disasterRecoveryMockFailure?: boolean;
  backupNotificationSettings?: BackupNotificationSettings;
  navigationSettings?: NavigationItemSetting[];
  shifts?: ShiftDefinition[];
  shiftSchedules?: ShiftSchedule[];
  shiftAttendanceLogs?: ShiftAttendanceLog[];
  shiftBreakLogs?: BreakLog[];
  shiftOvertimeLogs?: OvertimeLog[];
  shiftSwapRequests?: ShiftSwapRequest[];
  staffRoles?: StaffRoleDefinition[];
  smallwaresInventory?: SmallwareItem[];
  smallwareStockOpnames?: SmallwareStockOpname[];
  smallwareLossReports?: SmallwareLossReport[];
  smallwareBreakageReports?: SmallwareBreakageReport[];
  smallwareAuditLogs?: SmallwareAuditLog[];

  // Enterprise POS Collections
  pos_devices?: PosDevice[];
  printer_logs?: PrinterLog[];
  payment_qris?: PaymentQris[];
  cashier_permissions?: CashierPermissions;
  device_registry?: PosDevice[]; // Alias or duplicate for device compatibility
  receipt_settings?: ReceiptSettings;
  plugin_settings?: PluginSettings;
  shift_history?: any[];
  refund_logs?: RefundLog[];
  midtrans_logs?: MidtransLog[];
  midtrans_transactions?: MidtransTransaction[];
  midtrans_settings?: MidtransSettings;
  kdsQueue?: KdsTicket[];
}

export interface KdsTicket {
  id: string;
  parentOrderId: string;
  orderNo: string;
  table: string;
  items: {
    name: string;
    qty: number;
    notes?: string;
  }[];
  department: "BARISTA" | "KITCHEN";
  timestamp: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED";
  isNew: boolean;
  history?: {
    status: string;
    timestamp: string;
    updatedBy: string;
  }[];
}

export interface PosDevice {
  id: string;
  name: string;
  lastConnected: string;
  battery: number;
  firmware: string;
  status: "Online" | "Offline" | "Maintenance";
  assignedStation: string;
  assignedUser: string;
  connectionHistory: { timestamp: string; action: string }[];
}

export interface PrinterLog {
  id: string;
  printerId: string;
  timestamp: string;
  message: string;
  status: "Success" | "Failed";
}

export interface PaymentQris {
  id: string;
  transactionId: string;
  amount: number;
  qrCodeUrl: string;
  status: "Pending" | "Paid" | "Expired";
  expiryTime: string;
  callbackWebhookUrl?: string;
  notes?: string;
}

export interface CashierPermissions {
  Owner: string[];
  Manager: string[];
  Cashier: string[];
  FOH: string[];
  Barista: string[];
}

export interface ReceiptSettings {
  headerText: string;
  footerText: string;
  showCashierName: boolean;
  showTableNumber: boolean;
  autoPrintKitchenCopy: boolean;
  printCopiesCount: number;
  logoUrl?: string;
  qrPaymentFooter?: boolean;
}

export interface PluginSettings {
  whatsappInvoice: {
    enabled: boolean;
    autoSend: boolean;
    messageTemplate: string;
    resendCount: number;
  };
  midtransQris: {
    enabled: boolean;
    autoGenerate: boolean;
    apiKey: string;
    feeHandling: "None" | "Customer Pays" | "Merchant Bears";
    expiredMinutes: number;
  };
  selfOrder: {
    enabled: boolean;
    tableScanEnabled: boolean;
    autoAcceptToCashier: boolean;
    defaultPaymentDirect: boolean;
  };
  kitchenDisplay: {
    enabled: boolean;
    soundNotification: boolean;
    autoRefreshIntervalSeconds: number;
  };
}

export interface RefundLog {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  timestamp: string;
  approvedBy: string;
}


export interface NavigationItemSetting {
  id: string;
  label: string;
  icon: string;
  section: string;
  isDeleted?: boolean;
}

export interface BackupItem {
  id: string;
  name: string;
  createdDate: string;
  backupType: "Daily" | "Weekly" | "Monthly" | "Manual";
  fileSize: string;
  createdBy: string;
  filePath?: string;
  isProtected?: boolean;
  notes?: string;
  isStorageBackup?: boolean;
}

export interface BackupAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  actionType: "CREATE_BACKUP" | "RESTORE" | "DELETE" | "RECOVERY" | "CONFIG_CHANGE";
  timestamp: string;
  details: string;
  moduleRestored?: string;
  status: "SUCCESS" | "FAILED";
}

export interface BackupNotificationSettings {
  email: string;
  isEmailEnabled: boolean;
  whatsapp: string;
  isWhatsappEnabled: boolean;
  telegram: string;
  isTelegramEnabled: boolean;
}

export interface ReportSettings {
  managerEmail: string;
  managerWhatsapp: string;
  isManagerEmailEnabled: boolean;
  isManagerWhatsappEnabled: boolean;
  ownerEmail: string;
  isOwnerEmailEnabled: boolean;
  emailService: "Gmail" | "SendGrid" | "LocalProxy" | "SMTP" | "EmailJS" | "Webhook";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  emailjsPrivateKey?: string;
  webhookUrl?: string;
}

export interface ReportLog {
  id: string;
  type: "weekly_manager" | "monthly_owner";
  recipient: string;
  scheduleDate: string;
  sentDate?: string;
  status: "Pending" | "Terkirim" | "Gagal";
  pdfLink?: string;
  subject: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  role: string;
  action: string;
  page: string;
  timestamp: string;
  device: string;
  ip: string;
}

export interface SupplierItem {
  id: string;
  name: string;
  category: "Coffee" | "Dairy" | "Syrup" | "Packaging" | "Pastry" | "Equipment" | "Maintenance";
  contactPerson: string;
  phone: string; // WhatsApp Number
  email: string;
  address: string;
  leadTimeDays: number;
  paymentTerms: string;
  rating: number; // 0-100 score
  deliveryAccuracy: number; // 0-100 score
  productQuality: number; // 0-100 score
  priceStability: number; // 0-100 score
  responseTime: number; // 0-100 score
}

export interface PoItemRow {
  code: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface PoDoc {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PoItemRow[];
  total: number;
  status: "Draft" | "Dikirim ke Supplier" | "Dikonfirmasi" | "Selesai";
}

export interface ServiceInventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  minQty: number;
  location: string;
  notes?: string;
  updatedAt: string;
}

export interface ServiceSopItem {
  id: string;
  title: string;
  category: string;
  steps: string[];
  lastReviewDate: string;
}

export interface ServiceCleaningTask {
  id: string;
  taskName: string;
  frequency: "Harian" | "Mingguan" | "Bulanan";
  status: "Belum Selesai" | "Selesai";
  assignedTo: string;
  completedAt?: string;
  notes?: string;
}

export interface ServiceMaintenanceItem {
  id: string;
  equipmentName: string;
  parameter: string;
  status: "Normal" | "Butuh Tindakan" | "Kerusakan Kritis";
  lastCheckDate: string;
  checkedBy: string;
  notes?: string;
}

export interface ServiceDailyReport {
  id: string;
  date: string;
  staffName: string;
  shift: "Pagi" | "Siang" | "Malam";
  tasksCompletedCount: number;
  maintenanceDone: string;
  incidentsNotes: string;
  generalNotes?: string;
  createdAt: string;
}

export interface ServiceEvidence {
  id: string;
  title: string;
  category: string;
  photoUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  description: string;
}

export interface ServiceKPIRecord {
  id: string;
  period: string;
  staffName: string;
  cleaningScore: number;
  maintenanceScore: number;
  sopCompliance: number;
  reportingScore: number;
  avgScore: number;
  notes?: string;
}

export interface FohChecklistRecord {
  id: string;
  type: "opening" | "service" | "closing";
  date: string;
  time: string;
  shift: string;
  staffName: string;
  role: string;
  items: { task: string; completed: boolean }[];
  photoUrl?: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface FohFeedback {
  id: string;
  customerName: string;
  rating: number;
  feedback: string;
  complaint?: string;
  date: string;
}

export interface FohComplaint {
  id: string;
  detail: string;
  tableId: string;
  timestamp: string;
  solution?: string;
  status: "Open" | "Followed Up" | "Closed" | "Escalated";
}

export interface FohTable {
  id: string;
  name: string;
  status: "Available" | "Occupied" | "Reserved" | "Cleaning Needed";
}

export interface FohInventoryItem {
  id: string;
  name: string;
  category: "Consumables" | "Dining Equipment";
  qty: number;
  unit: string;
  parLevel: number;
}

export interface FohInventoryRequest {
  id: string;
  name: string;
  qty: number;
  reason: string;
  requestedBy: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface FohKpi {
  id: string;
  staffName: string;
  period: string;
  attendance: number;
  sopCompletion: number;
  customerRating: number;
  complaintResolution: number;
  checklistCompletion: number;
  trainingCompletion: number;
  score: number;
  category: "Excellent" | "Good" | "Average" | "Needs Improvement";
}

export interface FohShift {
  id: string;
  date: string;
  staffName: string;
  shift: "Pagi" | "Siang" | "Malam";
  type: "Work" | "Swap" | "Leave" | "Izin";
  status: "Approved" | "Pending" | "Rejected";
  swapWith?: string;
  reason?: string;
}

export interface FohTraining {
  id: string;
  title: string;
  category: "Product Knowledge" | "Coffee Knowledge" | "Customer Service" | "Upselling Technique" | "Hygiene Standard";
  contentUrl?: string;
  videoUrl?: string; // YouTube mock URL or placeholder
  pdfUrl?: string;
  quiz?: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

export interface FohTrainingResult {
  id: string;
  staffName: string;
  trainingTitle: string;
  score: number;
  passed: boolean;
  date: string;
}

export interface SopAttachment {
  type: "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG" | "MP4";
  name: string;
  url: string; // URL link or base64 DataURL
}

export interface SopChangeHistory {
  id: string;
  version: string; // e.g. "V1.0", "V1.1" etc.
  date: string;
  editor: string;
  notes: string;
}

export interface SopItem {
  id: string;
  title: string;
  category: "Bar SOP" | "Brewing SOP" | "Service SOP" | "Kitchen SOP" | "Cleaning SOP" | "Maintenance SOP" | "Inventory SOP";
  steps: string[];
  version: string;
  isArchived?: boolean;
  photoUrl?: string; // photo reference
  videoUrl?: string; // video tutorial
  docUrl?: string; // pendukung document
  attachments?: SopAttachment[];
  history?: SopChangeHistory[];
  lastReviewDate: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  userName: string;
  role: string;
  device: string;
  browser: string;
  ip: string;
  loginTime: string;
}

export interface EquipmentAsset {
  id: string;
  assetId: string; // e.g. "EQ-COF-001"
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  supplier: string;
  location: string;
  department: "Coffee Equipment" | "Kitchen Equipment" | "FOH Equipment" | "Service Equipment" | "Office Equipment";
  status: "Aktif" | "Damaged" | "Maintenance Needed" | "Under Repair";
  photoUrl?: string;
  warrantyExpiry: string; // YYYY-MM-DD
  economicLifeYears: number; // e.g. 5
  purchaseDate: string; // YYYY-MM-DD
  maintenanceSchedule: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual";
  maintenanceHistory?: EquipmentMaintenanceLog[];
}

export interface EquipmentMaintenanceLog {
  id: string;
  date: string;
  technician: string;
  notes: string;
  cost: number;
  photoBefore?: string;
  photoAfter?: string;
}

export interface BepAnalytics {
  fixedCost: number; // e.g. Gaji, Sewa, Listrik
  variableCostPerCupPercent: number; // e.g. 35% of revenue
  estimatedAverageTransaction: number; // e.g. 35000
  sampleMonthlyRevenue: number;
  historicalFixedCosts?: { label: string; value: number }[];
}

export interface RoiAnalytics {
  initialInvestment: number;
  machineryCost: number;
  renovationCost: number;
  furnitureCost: number;
  marketingCost: number;
  roiTrend?: { period: string; netProfit: number; investment: number }[];
}

export interface FohEmployee {
  id: string;
  userId?: string;
  branchId?: string;
  employeeCode: string;
  fullName: string;
  gender: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface FohEmployeeTask {
  id: string;
  employeeId: string;
  taskName: string;
  category: "opening" | "service" | "closing";
  status: "Pending" | "Completed" | "Approved" | "Rejected";
  assignedDate: string;
  completedAt?: string;
  notes?: string;
}

export interface FohEmployeeKpi {
  id: string;
  employeeId: string;
  period: string;
  attendanceRate: number;
  sopCompliance: number;
  customerRating: number;
  finalScore: number;
  notes?: string;
  evaluatedBy?: string;
  createdAt: string;
}

export interface FohCustomerFeedback {
  id: string;
  customerName?: string;
  rating: number;
  feedback: string;
  complaint?: string;
  branchId?: string;
  transactionId?: string;
  createdAt: string;
}

export interface FohIncidentReport {
  id: string;
  reporterId: string;
  incidentType: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  branchId?: string;
  status: "Open" | "Investigating" | "Resolved" | "Closed";
  resolutionNotes?: string;
  incidentDate: string;
  createdAt: string;
}

export interface ShiftDefinition {
  id: string;
  name: string;
  code: "Morning" | "Middle" | "Night" | "Full Day" | "Custom Shift";
  startTime: string;
  endTime: string;
  color: string;
}

export interface ShiftSchedule {
  id: string;
  userId: string;
  userName: string;
  role: string;
  date: string; // "YYYY-MM-DD"
  shiftId: string;
  notes?: string;
}

export interface ShiftAttendanceLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  date: string; // "YYYY-MM-DD"
  shiftId: string;
  checkIn: string; // "HH:MM:SS" or ""
  checkOut?: string; // "HH:MM:SS"
  status: "Hadir" | "Terlambat" | "Tidak Hadir" | "Izin";
  latenessMinutes: number;
  overtimeMinutes: number;
  breakStartTime?: string; // "HH:MM:SS"
  breakEndTime?: string; // "HH:MM:SS"
  totalBreakMinutes?: number;
  qrScanned?: boolean;
  facePhoto?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  distanceRadiusMeters?: number;
}

export interface BreakLog {
  id: string;
  attendanceLogId: string;
  userId: string;
  userName: string;
  startTime: string; // "HH:MM:SS"
  endTime?: string; // "HH:MM:SS"
  durationMinutes?: number;
}

export interface OvertimeLog {
  id: string;
  attendanceLogId: string;
  userId: string;
  userName: string;
  hoursRequested: number;
  approvedBy?: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  date: string; // "YYYY-MM-DD"
}

export interface ShiftSwapRequest {
  id: string;
  requestorId: string;
  requestorName: string;
  targetId: string;
  targetName: string;
  dateRequested: string; // "YYYY-MM-DD"
  dateTarget: string; // "YYYY-MM-DD"
  requestorShiftId: string;
  targetShiftId: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  reason: string;
  createdAt: string;
}

export interface StaffRoleDefinition {
  id: string;
  name: string;
  canEditSchedule: boolean;
  canViewAllReports: boolean;
  canApproveSwaps: boolean;
}

export interface SmallwareItem {
  id: string; // e.g. "SW-001"
  name: string;
  category: "Glassware" | "Bar Equipment" | "Kitchen Equipment" | "Service Equipment";
  storageLocation: string;
  initialQty: number;
  currentQty: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  status: "Active" | "Broken" | "Lost" | "Repair" | "Retired";
  isSoftDeleted?: boolean;
}

export interface SmallwareStockOpname {
  id: string;
  date: string;
  type: "Daily" | "Weekly" | "Monthly";
  itemId: string;
  itemName: string;
  category: string;
  expectedQty: number;
  actualQty: number;
  difference: number;
  status: "Draft" | "Pending Approval" | "Approved";
  auditedBy: string;
  auditedByRole: string;
  notes?: string;
  createdAt: string;
}

export interface SmallwareLossReport {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  category: string;
  qtyLost: number;
  lossValue: number;
  cause: "Missing" | "Misplaced" | "Theft" | "Operational Loss" | "Unknown";
  staffInCharge: string;
  reportedBy: string;
  imageUrl?: string;
  timestamp: string;
  outletLocation: string;
  isSoftDeleted?: boolean;
}

export interface SmallwareBreakageReport {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  category: string;
  qtyBroken: number;
  lossValue: number;
  cause: "Accident" | "Customer Accident" | "Operational Error" | "Wear and Tear" | "Manufacturing Defect";
  staffReporter: string;
  imageUrl?: string;
  timestamp: string;
  outletLocation: string;
  isSoftDeleted?: boolean;
}

export interface SmallwareAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface MidtransLog {
  id: string;
  timestamp: string;
  type: "api" | "webhook" | "simulation" | "debug";
  endpoint?: string;
  message: string;
  payload?: string;
  response?: string;
  status: "success" | "failed" | "info" | "warning";
}

export interface MidtransTransaction {
  orderId: string;
  amount: number;
  paymentType: "qris" | "gopay" | "shopeepay" | "credit_card" | "bank_transfer";
  status: "pending" | "settlement" | "expire" | "deny" | "refund" | "failure";
  qrString?: string;
  qrUrl?: string;
  snapToken?: string;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string;
  retries?: number;
  customerName?: string;
  itemsCount?: number;
}

export interface MidtransSettings {
  merchantId: string;
  clientKey: string;
  serverKey: string;
  webhookUrl: string;
  status: "connected" | "disconnected" | "unconfigured";
  webhookVerified: boolean;
  isSandbox: boolean;
}





