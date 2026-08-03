export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "QUOTE_SHARED" | "WON" | "LOST";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface AuthUser { id: string; email: string; name: string; role: string; }
export interface Role { id: string; name: string; userCount?: number; }
export interface LeadSource { id: string; name: string; }

export interface Customer {
  id: string;
  customerName: string;
  contactPerson?: string | null;
  company?: string | null;
  gstin?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country?: string | null;
  balance: number;
  totalValue: number;
}

export interface Product {
  id: string;
  name: string;
  make: string;
  model: string;
  category?: string | null;
  description?: string | null;
  unitPrice: number;
}

export interface LeadSummary {
  id: string;
  status: LeadStatus;
  priority: Priority;
  approxValue: number;
  customer: { id: string; customerName: string; company?: string | null };
  source?: string;
  productCount: number;
  nextFollowUp?: string | null;
}

export interface BoardColumn {
  status: LeadStatus;
  count: number;
  leads: { id: string; customer?: string; approxValue: number; priority: Priority; productCount: number }[];
}

export interface LeadProductLine {
  id: string;
  productId: string;
  name?: string;
  make?: string;
  model?: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface TimelineEntry {
  id: string;
  fromStatus?: LeadStatus | null;
  toStatus: LeadStatus;
  note?: string | null;
  actor?: string | null;
  createdAt: string;
}

export interface FollowUp { id: string; dueAt: string; note?: string | null; done: boolean; }
export interface Quote { id: string; quoteNumber: string; quoteDate: string; fileUrl?: string | null; remarks?: string | null; }

export interface WonDeal {
  id: string;
  finalValue: number;
  invoiceNumber?: string | null;
  closingDate?: string | null;
  products: { id: string; name: string; make?: string | null; model?: string | null; quantity: number; amount: number }[];
}

export interface LostDeal { id: string; reason: string; competitor?: string | null; remarks?: string | null; }

export interface LeadDetail {
  id: string;
  status: LeadStatus;
  approxValue: number;
  priority: Priority;
  notes?: string | null;
  sourceOther?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  source?: { id: string; name: string };
  owner?: { id: string; name: string } | null;
  products: LeadProductLine[];
  timeline: TimelineEntry[];
  quotes: Quote[];
  followUps: FollowUp[];
  wonDeal: WonDeal | null;
  lostDeal: LostDeal | null;
}

export interface DashboardOverview {
  cards: {
    totalCustomers: number; totalLeads: number; new: number; contacted: number; qualified: number;
    quoteShared: number; won: number; lost: number; revenue: number; conversionRate: number; winLossRatio: number;
  };
  totalWonLost: { label: string; value: number }[];
  stageCounts: { status: LeadStatus; count: number }[];
  funnel: { status: LeadStatus; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  upcomingFollowUps: { leadId: string; customer: string; dueAt: string }[];
  recentActivity: { leadId: string; customer: string; fromStatus?: LeadStatus | null; toStatus: LeadStatus; at: string }[];
}

export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number; }
export interface Paginated<T> { items: T[]; meta: PaginationMeta; }
export interface AppSettings { currency?: string; orgName?: string; listPageSize?: string; maxProductsPerLead?: string; }
export interface Notification { id: string; type: string; message: string; read: boolean; createdAt: string; }
