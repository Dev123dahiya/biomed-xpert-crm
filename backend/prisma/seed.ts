// BIOMED XPERT Lead Tracker Dashboard
// Phase 3 seed script. Run with: npx prisma db seed
//
// Populates every table so the dashboard, board, and reports show real data
// on first run. Money values are whole rupees stored as Decimal(14, 2).

import { PrismaClient, LeadStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

async function reset(): Promise<void> {
  // Delete in dependency order so foreign keys are satisfied.
  await prisma.wonDealProduct.deleteMany();
  await prisma.wonDeal.deleteMany();
  await prisma.lostDeal.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.leadProduct.deleteMany();
  await prisma.leadTimeline.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.leadSource.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
}

async function main(): Promise<void> {
  await reset();

  // Roles -------------------------------------------------------------------
  const adminRole = await prisma.role.create({ data: { name: "ADMIN" } });
  const salesRole = await prisma.role.create({ data: { name: "SALES" } });

  // Users -------------------------------------------------------------------
  const adminHash = await bcrypt.hash("Admin@123", 12);
  const salesHash = await bcrypt.hash("Sales@123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@biomedxpert.com",
      name: "System Admin",
      passwordHash: adminHash,
      roleId: adminRole.id,
    },
  });

  const sales = await prisma.user.create({
    data: {
      email: "sales@biomedxpert.com",
      name: "Rohit Verma",
      passwordHash: salesHash,
      roleId: salesRole.id,
    },
  });

  // Lead sources ------------------------------------------------------------
  const sourceNames = [
    "Referral",
    "Social Media",
    "Indiamart",
    "Trade India",
    "Cold Call / Walk In",
    "Others",
  ];
  const sources = await Promise.all(
    sourceNames.map((name) => prisma.leadSource.create({ data: { name } }))
  );
  const sourceByName = (name: string) => sources.find((s) => s.name === name)!;

  // Products ----------------------------------------------------------------
  const productSeed = [
    { name: "Patient Monitor", make: "Philips", model: "IntelliVue MX450", category: "Monitoring", unitPrice: 350000 },
    { name: "Ventilator", make: "Draeger", model: "Savina 300", category: "Respiratory", unitPrice: 1200000 },
    { name: "Defibrillator", make: "Zoll", model: "R Series", category: "Emergency", unitPrice: 650000 },
    { name: "Ultrasound System", make: "GE Healthcare", model: "Voluson E10", category: "Imaging", unitPrice: 4500000 },
    { name: "ECG Machine", make: "BPL", model: "Cardiart 9108", category: "Diagnostics", unitPrice: 85000 },
    { name: "Syringe Pump", make: "B. Braun", model: "Perfusor Space", category: "Infusion", unitPrice: 95000 },
    { name: "Anesthesia Workstation", make: "Mindray", model: "WATO EX-65", category: "Anesthesia", unitPrice: 1800000 },
  ];
  const products = await Promise.all(
    productSeed.map((p) => prisma.product.create({ data: p }))
  );
  const productByName = (name: string) => products.find((p) => p.name === name)!;

  // Customers ---------------------------------------------------------------
  const customerSeed = [
    { customerName: "Dr. Ramesh Iyer", contactPerson: "Ramesh Iyer", company: "Apollo Clinic", gstin: "07AABCA1234A1Z5", phone: "9811001100", email: "ramesh@apolloclinic.in", addressLine1: "Plot 12, Sector 18", city: "Delhi", state: "Delhi", pinCode: "110001", balance: 25000 },
    { customerName: "Dr. Neha Sharma", contactPerson: "Neha Sharma", company: "Fortis Hospital", gstin: "06AABCF5678B1Z3", phone: "9811002200", email: "neha@fortis.in", addressLine1: "Golf Course Road", city: "Gurgaon", state: "Haryana", pinCode: "122002", balance: 0 },
    { customerName: "Dr. Arjun Mehta", contactPerson: "Arjun Mehta", company: "Max Healthcare", gstin: "09AABCM9012C1Z1", phone: "9811003300", email: "arjun@maxhealth.in", addressLine1: "Sector 19", city: "Noida", state: "Uttar Pradesh", pinCode: "201301", balance: 48000 },
    { customerName: "Dr. Kavita Rao", contactPerson: "Kavita Rao", company: "City Diagnostics", gstin: "27AABCC3456D1Z9", phone: "9811004400", email: "kavita@citydiag.in", addressLine1: "Andheri West", city: "Mumbai", state: "Maharashtra", pinCode: "400058", balance: 12000 },
    { customerName: "Dr. Sanjay Gupta", contactPerson: "Sanjay Gupta", company: "Sunrise Medical Center", gstin: "27AABCS7890E1Z7", phone: "9811005500", email: "sanjay@sunrisemc.in", addressLine1: "FC Road", city: "Pune", state: "Maharashtra", pinCode: "411004", balance: 0 },
    { customerName: "Dr. Priya Nair", contactPerson: "Priya Nair", company: "Wellness Multispeciality", gstin: "29AABCW2345F1Z2", phone: "9811006600", email: "priya@wellness.in", addressLine1: "Indiranagar", city: "Bangalore", state: "Karnataka", pinCode: "560038", balance: 5000 },
  ];
  const customers = await Promise.all(
    customerSeed.map((c) => prisma.customer.create({ data: { ...c, country: "India" } }))
  );

  // Helper to build a lead with products, timeline, and terminal deal --------
  type LineInput = { productName: string; quantity: number };
  const buildProducts = (lines: LineInput[]) =>
    lines.map((l) => {
      const p = productByName(l.productName);
      const price = Number(p.unitPrice);
      return {
        productId: p.id,
        quantity: l.quantity,
        price,
        lineTotal: price * l.quantity,
      };
    });

  // Leads -------------------------------------------------------------------
  // NEW
  await prisma.lead.create({
    data: {
      customerId: customers[0].id,
      sourceId: sourceByName("Referral").id,
      ownerId: sales.id,
      status: LeadStatus.NEW,
      approxValue: 350000,
      priority: Priority.MEDIUM,
      notes: "Enquiry for a bedside patient monitor.",
      products: { create: buildProducts([{ productName: "Patient Monitor", quantity: 1 }]) },
      timeline: { create: [{ toStatus: LeadStatus.NEW, actorId: sales.id, note: "Lead created." }] },
    },
  });

  // CONTACTED with a follow-up
  await prisma.lead.create({
    data: {
      customerId: customers[1].id,
      sourceId: sourceByName("Indiamart").id,
      ownerId: sales.id,
      status: LeadStatus.CONTACTED,
      approxValue: 1200000,
      priority: Priority.HIGH,
      notes: "Called; ICU expansion planned next quarter.",
      products: { create: buildProducts([{ productName: "Ventilator", quantity: 1 }]) },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id, note: "Lead created." },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.CONTACTED, actorId: sales.id, note: "First call done." },
        ],
      },
      followUps: { create: [{ dueAt: daysFromNow(2), note: "Send catalog and pricing." }] },
    },
  });

  // QUALIFIED with a follow-up
  await prisma.lead.create({
    data: {
      customerId: customers[2].id,
      sourceId: sourceByName("Trade India").id,
      ownerId: sales.id,
      status: LeadStatus.QUALIFIED,
      approxValue: 4500000,
      priority: Priority.HIGH,
      notes: "Budget confirmed for radiology upgrade.",
      products: { create: buildProducts([{ productName: "Ultrasound System", quantity: 1 }]) },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.CONTACTED, actorId: sales.id },
          { fromStatus: LeadStatus.CONTACTED, toStatus: LeadStatus.QUALIFIED, actorId: sales.id, note: "Requirement and budget verified." },
        ],
      },
      followUps: { create: [{ dueAt: daysFromNow(4), note: "Arrange product demo." }] },
    },
  });

  // QUOTE_SHARED with a quote
  await prisma.lead.create({
    data: {
      customerId: customers[3].id,
      sourceId: sourceByName("Social Media").id,
      ownerId: sales.id,
      status: LeadStatus.QUOTE_SHARED,
      approxValue: 735000,
      priority: Priority.MEDIUM,
      notes: "Quote shared for ECG and syringe pump bundle.",
      products: {
        create: buildProducts([
          { productName: "ECG Machine", quantity: 3 },
          { productName: "Syringe Pump", quantity: 5 },
        ]),
      },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.CONTACTED, actorId: sales.id },
          { fromStatus: LeadStatus.CONTACTED, toStatus: LeadStatus.QUALIFIED, actorId: sales.id },
          { fromStatus: LeadStatus.QUALIFIED, toStatus: LeadStatus.QUOTE_SHARED, actorId: sales.id, note: "Formal quote emailed." },
        ],
      },
      quotes: {
        create: [{ quoteNumber: "BMX-Q-0001", quoteDate: daysFromNow(-1), remarks: "Valid for 30 days." }],
      },
    },
  });

  // WON with a won deal (two won leads to exercise multi-deal totals)
  const wonLeadA = await prisma.lead.create({
    data: {
      customerId: customers[4].id,
      sourceId: sourceByName("Referral").id,
      ownerId: sales.id,
      status: LeadStatus.WON,
      approxValue: 1800000,
      priority: Priority.HIGH,
      notes: "Anesthesia workstation for new OT.",
      products: { create: buildProducts([{ productName: "Anesthesia Workstation", quantity: 1 }]) },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.CONTACTED, actorId: sales.id },
          { fromStatus: LeadStatus.CONTACTED, toStatus: LeadStatus.QUALIFIED, actorId: sales.id },
          { fromStatus: LeadStatus.QUALIFIED, toStatus: LeadStatus.QUOTE_SHARED, actorId: sales.id },
          { fromStatus: LeadStatus.QUOTE_SHARED, toStatus: LeadStatus.WON, actorId: sales.id, note: "PO received." },
        ],
      },
      wonDeal: {
        create: {
          finalValue: 1750000,
          invoiceNumber: "INV-2026-0007",
          closingDate: daysFromNow(-3),
          products: { create: [{ name: "Anesthesia Workstation", make: "Mindray", model: "WATO EX-65", quantity: 1, amount: 1750000 }] },
        },
      },
    },
  });

  const wonLeadB = await prisma.lead.create({
    data: {
      customerId: customers[4].id,
      sourceId: sourceByName("Cold Call / Walk In").id,
      ownerId: sales.id,
      status: LeadStatus.WON,
      approxValue: 650000,
      priority: Priority.MEDIUM,
      notes: "Defibrillator repeat order.",
      products: { create: buildProducts([{ productName: "Defibrillator", quantity: 1 }]) },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.QUALIFIED, actorId: sales.id },
          { fromStatus: LeadStatus.QUALIFIED, toStatus: LeadStatus.WON, actorId: sales.id, note: "Confirmed on call." },
        ],
      },
      wonDeal: {
        create: {
          finalValue: 620000,
          invoiceNumber: "INV-2026-0008",
          closingDate: daysFromNow(-1),
          products: { create: [{ name: "Defibrillator", make: "Zoll", model: "R Series", quantity: 1, amount: 620000 }] },
        },
      },
    },
  });

  // LOST with a lost deal
  await prisma.lead.create({
    data: {
      customerId: customers[5].id,
      sourceId: sourceByName("Others").id,
      sourceOther: "Medical expo booth",
      ownerId: sales.id,
      status: LeadStatus.LOST,
      approxValue: 1200000,
      priority: Priority.LOW,
      notes: "Lost on price.",
      products: { create: buildProducts([{ productName: "Ventilator", quantity: 1 }]) },
      timeline: {
        create: [
          { toStatus: LeadStatus.NEW, actorId: sales.id },
          { fromStatus: LeadStatus.NEW, toStatus: LeadStatus.CONTACTED, actorId: sales.id },
          { fromStatus: LeadStatus.CONTACTED, toStatus: LeadStatus.QUOTE_SHARED, actorId: sales.id },
          { fromStatus: LeadStatus.QUOTE_SHARED, toStatus: LeadStatus.LOST, actorId: sales.id, note: "Chose competitor." },
        ],
      },
      lostDeal: {
        create: { reason: "Price higher than competitor", competitor: "Skanray", remarks: "Revisit next budget cycle." },
      },
    },
  });

  // Recompute cached customer totalValue from won deals ----------------------
  const grouped = await prisma.wonDeal.findMany({
    include: { lead: { select: { customerId: true } } },
  });
  const totals = new Map<string, number>();
  for (const w of grouped) {
    const cid = w.lead.customerId;
    totals.set(cid, (totals.get(cid) ?? 0) + Number(w.finalValue));
  }
  for (const [customerId, total] of totals) {
    await prisma.customer.update({ where: { id: customerId }, data: { totalValue: total } });
  }

  // Notifications -----------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { userId: sales.id, type: "FOLLOW_UP", message: "Follow-up due for Fortis Hospital in 2 days." },
      { userId: sales.id, type: "FOLLOW_UP", message: "Demo to arrange for Max Healthcare." },
    ],
  });

  // Settings ----------------------------------------------------------------
  await prisma.setting.createMany({
    data: [
      { key: "currency", value: "INR" },
      { key: "orgName", value: "BIOMED XPERT" },
      { key: "listPageSize", value: "25" },
      { key: "maxProductsPerLead", value: "15" },
    ],
  });

  console.log("Seed complete:", {
    roles: 2,
    users: 2,
    sources: sources.length,
    products: products.length,
    customers: customers.length,
    wonLeads: 2,
    wonLeadIds: [wonLeadA.id, wonLeadB.id],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
