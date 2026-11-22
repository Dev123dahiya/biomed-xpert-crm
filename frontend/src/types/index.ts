export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "QUOTE_SHARED" | "WON" | "LOST";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface AuthUser { id: string; email: string; name: string; role: string; }
export interface Role { id: string; name: string; userCount?: number; }
export interface LeadSource { id: string; name: string; }
export interface TeamMember { id: string; name: string; email: string; role: string; }
export interface UserRecord { id: string; name: string; email: string; active: boolean; createdAt: string; role: { id: string; name: string }; }

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
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerLead {
  leadId: string;
  status: LeadStatus;
  approxValue: number;
  priority: Priority;
  source: string | null;
  owner: string | null;
  productCount: number;
  nextFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
  finalValue: number | null;
  closingDate: string | null;
  lostReason: string | null;
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
  customer: { id: string; customerName: string; company?: string | null; city?: string | null };
  source?: string;
  owner?: { id: string; name: string } | null;
  productCount: number;
  nextFollowUp?: string | null;
  finalValue?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardCard {
  id: string;
  customer?: string;
  contact?: string;
  city?: string | null;
  approxValue: number;
  priority: Priority;
  productCount: number;
  quoteCount?: number;
  owner?: { id: string; name: string } | null;
  source?: string | null;
  nextFollowUp?: string | null;
  finalValue?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardColumn {
  status: LeadStatus;
  count: number;
  value?: number;
  leads: BoardCard[];
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

export interface AgendaFollowUp {
  id: string;
  leadId: string;
  customer: string;
  contact?: string;
  dueAt: string;
  note?: string | null;
}

export interface PeriodNumbers { newLeads: number; wonCount: number; lostCount: number; revenue: number; }

export interface DashboardOverview {
  range: { from: string | null; to: string | null };
  cards: {
    totalCustomers: number; newCustomers: number; totalLeads: number; new: number; contacted: number; qualified: number;
    quoteShared: number; won: number; lost: number; revenue: number; wonDeals: number; avgDealSize: number;
    pipelineValue: number; openLeads: number; conversionRate: number; winRate: number; winLossRatio: number;
    overdueFollowUps: number; dueTodayFollowUps: number;
  };
  current: PeriodNumbers;
  previous: PeriodNumbers | null;
  target: { monthly: number; achieved: number; month: string; progress: number };
  totalWonLost: { label: string; value: number }[];
  stageCounts: { status: LeadStatus; count: number; value: number }[];
  funnel: { status: LeadStatus; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  trend: { month: string; revenue: number; deals: number; leads: number }[];
  sourceBreakdown: { id: string; name: string; leads: number; won: number; revenue: number; winRate: number }[];
  topCustomers: { customerId: string; name: string; company: string | null; city: string | null; revenue: number; deals: number }[];
  lostReasons: { reason: string; count: number }[];
  team: { id: string; name: string; open: number; pipeline: number; won: number; revenue: number; winRate: number }[];
  upcomingFollowUps: AgendaFollowUp[];
  overdueFollowUps: AgendaFollowUp[];
  recentActivity: { leadId: string; customer: string; fromStatus?: LeadStatus | null; toStatus: LeadStatus; actor?: string | null; note?: string | null; at: string }[];
}

export interface FollowUpRow {
  id: string;
  dueAt: string;
  note?: string | null;
  done: boolean;
  lead: {
    id: string;
    status: LeadStatus;
    priority: Priority;
    approxValue: number;
    owner?: { id: string; name: string } | null;
    customer: { id: string; customerName: string; company?: string | null; phone?: string | null; email?: string | null; city?: string | null };
  };
}

export interface SearchResults {
  customers: { id: string; customerName: string; company?: string | null; city?: string | null; phone?: string | null }[];
  leads: { id: string; status: LeadStatus; approxValue: number; customer: string; contact: string }[];
  products: { id: string; name: string; make: string; model: string; unitPrice: number }[];
}

export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number; }
export interface Paginated<T> { items: T[]; meta: PaginationMeta; }
export interface AppSettings {
  currency?: string; orgName?: string; listPageSize?: string; maxProductsPerLead?: string; monthlyTarget?: string;
  orgPhone?: string; orgEmail?: string; orgAddress?: string; orgGstin?: string;
}
export interface Notification { id: string; type: string; message: string; read: boolean; createdAt: string; }
