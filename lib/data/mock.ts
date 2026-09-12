import type {
  Project,
  Task,
  Team,
  User,
  WeekPlan,
  WorkLog,
} from "@/lib/data/types";

/**
 * Icodelabs — service-based software company, India.
 * 24 employees: 1 PM, 2 QA, 2 Frontend/UI, 1 Designer,
 * 18 Fullstack developers (plus the admin/owner).
 */

const FS_COLORS = [
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#0d9488",
  "#2563eb",
  "#4f46e5",
  "#9333ea",
];

const FULLSTACK: [first: string, last: string][] = [
  ["Arjun", "Sharma"],
  ["Nikhil", "Joshi"],
  ["Rohan", "Patil"],
  ["Aditi", "Reddy"],
  ["Sagar", "Kulkarni"],
  ["Pooja", "Menon"],
  ["Rahul", "Gupta"],
  ["Divya", "Singh"],
  ["Manish", "Agarwal"],
  ["Ishita", "Bose"],
  ["Amit", "Verma"],
  ["Neha", "Kapoor"],
  ["Sanjay", "Pillai"],
  ["Ritika", "Malhotra"],
  ["Alok", "Choudhary"],
  ["Shruti", "Desai"],
  ["Varun", "Bhatia"],
  ["Kavya", "Krishnan"],
];

export const USERS: User[] = [
  {
    id: "u-admin",
    name: "Rohit Kulkarni",
    email: "admin@icodelabs.com",
    role: "admin",
    teamId: null,
    avatarColor: "#7c3aed",
    initials: "RK",
    isTester: false,
    leaveStatus: "active",
    profile: "cloud",
  },
  {
    id: "u-pm",
    name: "Priya Deshmukh",
    email: "pm@icodelabs.com",
    role: "manager",
    teamId: "team-frontend",
    avatarColor: "#0f766e",
    initials: "PD",
    isTester: false,
    leaveStatus: "active",
    profile: "frontend",
  },
  {
    id: "u-qa1",
    name: "Anjali Rao",
    email: "anjali.rao@icodelabs.com",
    role: "employee",
    teamId: "team-qa",
    avatarColor: "#db2777",
    initials: "AR",
    isTester: true,
    leaveStatus: "active",
    profile: "qa",
  },
  {
    id: "u-qa2",
    name: "Vikram Nair",
    email: "vikram.nair@icodelabs.com",
    role: "employee",
    teamId: "team-qa",
    avatarColor: "#ea580c",
    initials: "VN",
    isTester: true,
    leaveStatus: "on_leave",
    profile: "qa",
  },
  {
    id: "u-fe1",
    name: "Meera Iyer",
    email: "meera.iyer@icodelabs.com",
    role: "employee",
    teamId: "team-frontend",
    avatarColor: "#2563eb",
    initials: "MI",
    isTester: false,
    leaveStatus: "active",
    profile: "frontend",
  },
  {
    id: "u-fe2",
    name: "Karthik Sundaram",
    email: "karthik.sundaram@icodelabs.com",
    role: "employee",
    teamId: "team-frontend",
    avatarColor: "#16a34a",
    initials: "KS",
    isTester: false,
    leaveStatus: "active",
    profile: "frontend",
  },
  {
    id: "u-des",
    name: "Tanvi Shah",
    email: "tanvi.shah@icodelabs.com",
    role: "employee",
    teamId: "team-design",
    avatarColor: "#b45309",
    initials: "TS",
    isTester: false,
    leaveStatus: "on_leave",
    profile: "designer",
  },
  ...FULLSTACK.map(([first, last], i) => {
    // distribute profiles: 0-7 backend, 8-12 fullstack, 13-15 frontend, 16-17 cloud, with some on leave
    let profile: User["profile"] = "backend";
    let teamId: User["teamId"] = "team-backend";
    let leaveStatus: User["leaveStatus"] = "active";
    if (i >= 8 && i <= 12) {
      profile = "fullstack";
      teamId = "team-backend";
    } else if (i >= 13 && i <= 15) {
      profile = "frontend";
      teamId = "team-frontend";
    } else if (i >= 16) {
      profile = "cloud";
      teamId = "team-cloud";
    }
    if (i === 2 || i === 9 || i === 16) leaveStatus = "on_leave";
    return {
      id: `u-fs${i + 1}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@icodelabs.com`,
      role: "employee" as const,
      teamId,
      avatarColor: FS_COLORS[i % FS_COLORS.length],
      initials: `${first[0]}${last[0]}`,
      isTester: false,
      leaveStatus,
      profile,
    };
  }),
];

export const TEAMS: Team[] = [
  {
    id: "team-frontend",
    name: "Frontend & UI",
    managerId: "u-pm",
    memberIds: ["u-fe1", "u-fe2", "u-fs14", "u-fs15", "u-fs16"],
  },
  {
    id: "team-backend",
    name: "Fullstack & Backend",
    managerId: "u-pm",
    memberIds: Array.from({ length: 13 }, (_, i) => `u-fs${i + 1}`),
  },
  {
    id: "team-cloud",
    name: "Cloud & DevOps",
    managerId: "u-pm",
    memberIds: ["u-fs17", "u-fs18"],
  },
  {
    id: "team-design",
    name: "Design",
    managerId: "u-pm",
    memberIds: ["u-des"],
  },
  {
    id: "team-qa",
    name: "QA & Testing",
    managerId: "u-pm",
    memberIds: ["u-qa1", "u-qa2"],
  },
];

export const PROJECTS: Project[] = [
  {
    id: "p-saas",
    name: "Subscription Billing Platform",
    color: "#2563eb",
    managerId: "u-pm",
    memberIds: ["u-fe1", "u-fe2", "u-des", "u-fs1", "u-fs2", "u-fs3", "u-qa1", "u-qa2"],
    description:
      "Ongoing engagement: recurring-billing SaaS for a fast-growing Indian startup. Plans, invoices, payment retries and an admin dashboard — QA-gated delivery per sprint.",
    client: { name: "CloudCart SaaS", origin: "India — Noida" },
    documents: [
      { id: "d1", name: "SOW — Billing Platform v1.pdf" },
      { id: "d2", name: "Figma — Billing UX" },
      { id: "d3", name: "Razorpay Sandbox Keys" },
    ],
    flow: "Discovery → Design → Development → QA → UAT → Deploy",
    clientProvided: ["Product demo access", "Payment gateway sandbox", "Existing billing data (anonymised)"],
    delivery: { startDate: isoDaysAgo(30), endDate: isoDaysAgo(-45), approvedHours: 260, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(30), endDate: isoDaysAgo(24), plannedHours: 40, goals: ["Setup, design system & billing model"] },
      { week: 2, startDate: isoDaysAgo(23), endDate: isoDaysAgo(17), plannedHours: 40, goals: ["Plans, pricing & subscription lifecycle API"] },
      { week: 3, startDate: isoDaysAgo(16), endDate: isoDaysAgo(10), plannedHours: 40, goals: ["Webhooks, invoices & payment retries"] },
    ],
    teamSpec: {
      frontendIds: ["u-fe1", "u-fe2"],
      backendIds: ["u-fs1", "u-fs2", "u-fs3"],
      coordinatorId: "u-pm",
    },
    timeline: [
      { id: "tl1", module: "Billing Model", feature: "Plans, pricing tiers & feature flags", estimatedHours: 24, estimatedDays: 3, status: "done" },
      { id: "tl2", module: "Subscriptions", feature: "Lifecycle & upgrade/downgrade API", estimatedHours: 32, estimatedDays: 4, status: "in_progress", assigneeId: "u-fs2" },
      { id: "tl3", module: "UI", feature: "Plan selector & checkout flow", estimatedHours: 24, estimatedDays: 3, status: "in_progress", assigneeId: "u-fe1" },
      { id: "tl4", module: "Invoicing", feature: "Invoice generation + email delivery", estimatedHours: 18, estimatedDays: 2, status: "planned", assigneeId: "u-fs3" },
    ],
  },
  {
    id: "p-booking",
    name: "Hotel Booking Platform",
    color: "#0d9488",
    managerId: "u-pm",
    memberIds: ["u-fe1", "u-fs4", "u-fs5"],
    description:
      "Delivered: end-to-end booking engine for an Indian hospitality chain — inventory, rates, payments and confirmation emails.",
    client: { name: "StayEasy Hotels", origin: "India — Bengaluru" },
    documents: [{ id: "d4", name: "PRD — Booking Engine v2.pdf" }],
    flow: "Discovery → Wireframes → Development → QA → UAT → Launch",
    clientProvided: ["Channel manager API access", "Rate plan spreadsheet"],
    delivery: { startDate: isoDaysAgo(60), endDate: isoDaysAgo(10), approvedHours: 180, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(60), endDate: isoDaysAgo(54), plannedHours: 40, goals: ["Inventory & rate engine"] },
      { week: 2, startDate: isoDaysAgo(53), endDate: isoDaysAgo(47), plannedHours: 40, goals: ["Search, booking & payment flow"] },
      { week: 3, startDate: isoDaysAgo(46), endDate: isoDaysAgo(40), plannedHours: 40, goals: ["QA, UAT & go-live"] },
    ],
    teamSpec: { frontendIds: ["u-fe1"], backendIds: ["u-fs4", "u-fs5"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl5", module: "Inventory", feature: "Rate & availability engine", estimatedHours: 30, estimatedDays: 4, status: "done" },
      { id: "tl6", module: "Booking", feature: "Book, hold & cancel flows", estimatedHours: 28, estimatedDays: 3.5, status: "done" },
      { id: "tl7", module: "Payments", feature: "UPI/cards checkout + confirmations", estimatedHours: 22, estimatedDays: 3, status: "done" },
    ],
  },
  {
    id: "p-fintech",
    name: "Loan Origination Suite",
    color: "#16a34a",
    managerId: "u-pm",
    memberIds: ["u-fs6", "u-fs7", "u-fs8", "u-qa1"],
    description:
      "Delivered: digital loan origination for an NBFC — KYC, credit scoring integration, document upload and admin workflow.",
    client: { name: "FinPe Payouts", origin: "India — Mumbai" },
    documents: [{ id: "d5", name: "FinPe — Loan Workflow Spec.pdf" }],
    flow: "Discovery → API design → Build → Integration testing → UAT → Launch",
    clientProvided: ["Cibil/Credit API sandbox", "KYC partner docs"],
    delivery: { startDate: isoDaysAgo(75), endDate: isoDaysAgo(15), approvedHours: 240, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(75), endDate: isoDaysAgo(69), plannedHours: 40, goals: ["Workflow model & KYC flow"] },
      { week: 2, startDate: isoDaysAgo(68), endDate: isoDaysAgo(62), plannedHours: 40, goals: ["Credit engine & scoring"] },
    ],
    teamSpec: { frontendIds: [], backendIds: ["u-fs6", "u-fs7", "u-fs8"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl8", module: "KYC", feature: "Document upload + partner verification", estimatedHours: 26, estimatedDays: 4, status: "done" },
      { id: "tl9", module: "Scoring", feature: "Credit score oracle + decisioning", estimatedHours: 34, estimatedDays: 5, status: "done" },
    ],
  },
  {
    id: "p-ecom",
    name: "D2C E-commerce Storefront",
    color: "#ea580c",
    managerId: "u-pm",
    memberIds: ["u-fe2", "u-fs9", "u-fs10"],
    description:
      "Delivered: headless storefront for a direct-to-consumer beauty brand — catalogue, cart, COD and WhatsApp order updates.",
    client: { name: "BazaarDirect", origin: "India — Gurugram" },
    documents: [{ id: "d6", name: "Storefront BRD.pdf" }],
    flow: "Design sprint → Build → QA → Soft launch → Scale",
    clientProvided: ["Catalogue exports", "WhatsApp Business API access"],
    delivery: { startDate: isoDaysAgo(50), endDate: isoDaysAgo(8), approvedHours: 200, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(50), endDate: isoDaysAgo(44), plannedHours: 40, goals: ["Catalogue & PDP"] },
      { week: 2, startDate: isoDaysAgo(43), endDate: isoDaysAgo(37), plannedHours: 40, goals: ["Cart, COD & order flow"] },
    ],
    teamSpec: { frontendIds: ["u-fe2"], backendIds: ["u-fs9", "u-fs10"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl10", module: "Catalogue", feature: "Headless storefront + PDP", estimatedHours: 28, estimatedDays: 3.5, status: "done" },
      { id: "tl11", module: "Orders", feature: "Cart, COD & WhatsApp notifications", estimatedHours: 30, estimatedDays: 4, status: "done" },
    ],
  },
  {
    id: "p-health",
    name: "Clinic Management System",
    color: "#db2777",
    managerId: "u-pm",
    memberIds: ["u-fe1", "u-fs11", "u-des"],
    description:
      "Delivered: appointment booking, e-prescriptions and patient records for a multi-city clinic network.",
    client: { name: "MediCore Health", origin: "India — Pune" },
    documents: [{ id: "d7", name: "CMS — Feature List.docx" }],
    flow: "Discovery → UX design → Build → Clinical QA → Rollout",
    clientProvided: ["Sample anonymised records", "Prescription templates"],
    delivery: { startDate: isoDaysAgo(40), endDate: isoDaysAgo(6), approvedHours: 160, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(40), endDate: isoDaysAgo(34), plannedHours: 40, goals: ["Appointments & patient records"] },
      { week: 2, startDate: isoDaysAgo(33), endDate: isoDaysAgo(27), plannedHours: 40, goals: ["e-Prescriptions & billing"] },
    ],
    teamSpec: { frontendIds: ["u-fe1"], backendIds: ["u-fs11"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl12", module: "Appointments", feature: "Booking + reminder SMS", estimatedHours: 22, estimatedDays: 3, status: "done" },
      { id: "tl13", module: "Prescriptions", feature: "e-Prescription builder & print", estimatedHours: 18, estimatedDays: 2.5, status: "done" },
    ],
  },
  {
    id: "p-edtech",
    name: "Learning Management App",
    color: "#4f46e5",
    managerId: "u-pm",
    memberIds: ["u-fe2", "u-fs12", "u-fs13", "u-qa2"],
    description:
      "Delivered: video LMS with progress tracking, quizzes and certificates for an Indian ed-tech platform.",
    client: { name: "SkillSet Academy", origin: "India — Hyderabad" },
    documents: [{ id: "d8", name: "LMS PRD.pdf" }],
    flow: "Prototyping → Build → QA → UAT → Launch",
    clientProvided: ["Course content (videos, PDFs)", "Quiz question bank"],
    delivery: { startDate: isoDaysAgo(35), endDate: isoDaysAgo(4), approvedHours: 140, weeklyHours: 35 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(35), endDate: isoDaysAgo(29), plannedHours: 35, goals: ["Course player & progress"] },
      { week: 2, startDate: isoDaysAgo(28), endDate: isoDaysAgo(22), plannedHours: 35, goals: ["Quizzes & certificates"] },
    ],
    teamSpec: { frontendIds: ["u-fe2"], backendIds: ["u-fs12", "u-fs13"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl14", module: "Player", feature: "Video course player + tracking", estimatedHours: 24, estimatedDays: 3, status: "done" },
      { id: "tl15", module: "Quizzes", feature: "Quiz engine + auto certificates", estimatedHours: 20, estimatedDays: 2.5, status: "done" },
    ],
  },
  {
    id: "p-logi",
    name: "Fleet Tracking Portal",
    color: "#d97706",
    managerId: "u-pm",
    memberIds: ["u-fs5", "u-fs14"],
    description:
      "Delivered: live fleet tracking with geofencing, route history and driver alerts for a logistics company.",
    client: { name: "TransMove Logistics", origin: "India — Ahmedabad" },
    documents: [{ id: "d9", name: "Fleet Spec — GPS Feed.docx" }],
    flow: "API integration → Dashboard build → QA → Rollout",
    clientProvided: ["GPS device API access", "Vehicle master data"],
    delivery: { startDate: isoDaysAgo(30), endDate: isoDaysAgo(5), approvedHours: 170, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(30), endDate: isoDaysAgo(24), plannedHours: 40, goals: ["Live GPS ingestion"] },
      { week: 2, startDate: isoDaysAgo(23), endDate: isoDaysAgo(17), plannedHours: 40, goals: ["Geofencing & alerts"] },
    ],
    teamSpec: { frontendIds: ["u-fe1"], backendIds: ["u-fs5", "u-fs14"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl16", module: "Fleet", feature: "Live GPS feed + map UI", estimatedHours: 28, estimatedDays: 4, status: "done" },
      { id: "tl17", module: "Alerts", feature: "Geofence & overspeed alerts", estimatedHours: 20, estimatedDays: 3, status: "done" },
    ],
  },
  {
    id: "p-mart",
    name: "Retail Inventory Suite",
    color: "#b45309",
    managerId: "u-pm",
    memberIds: ["u-fs6", "u-fs15", "u-fs16"],
    description:
      "Delivered: multi-store inventory, purchase-order and stock-transfer suite for a regional retail chain.",
    client: { name: "CityMart Retail", origin: "India — Kolkata" },
    documents: [{ id: "d10", name: "CityMart — Inventory Spec.pdf" }],
    flow: "Requirements → Build → QA → Pilot stores → Rollout",
    clientProvided: ["Store master list", "Current stock spreadsheet"],
    delivery: { startDate: isoDaysAgo(45), endDate: isoDaysAgo(7), approvedHours: 220, weeklyHours: 40 },
    weeklyPlans: [
      { week: 1, startDate: isoDaysAgo(45), endDate: isoDaysAgo(39), plannedHours: 40, goals: ["Inventory & PO engine"] },
      { week: 2, startDate: isoDaysAgo(38), endDate: isoDaysAgo(32), plannedHours: 40, goals: ["Stock transfers & dashboard"] },
    ],
    teamSpec: { frontendIds: [], backendIds: ["u-fs6", "u-fs15", "u-fs16"], coordinatorId: "u-pm" },
    timeline: [
      { id: "tl18", module: "Inventory", feature: "Stock levels + barcode scan", estimatedHours: 30, estimatedDays: 4, status: "done" },
      { id: "tl19", module: "Transfers", feature: "Inter-store stock transfer + approvals", estimatedHours: 26, estimatedDays: 3, status: "done" },
    ],
  },
];

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const today = isoDaysAgo(0);

export const INITIAL_TASKS: Task[] = [
  { id: "t1", ticketId: "IC-01", title: "Plan selector & checkout UI", source: "Assigned", status: "in_testing", projectId: "p-saas", assigneeId: "u-fe1", createdById: "u-pm", dueDate: today, createdAt: isoDaysAgo(3), kind: "feature", module: "UI", estimatedHours: 16 },
  { id: "t2", ticketId: "IC-02", title: "Onboarding auth & signup flow", source: "Manual", status: "ready_for_testing", projectId: "p-saas", assigneeId: "u-fe2", createdById: "u-fe2", dueDate: today, createdAt: isoDaysAgo(1), kind: "feature", module: "Auth", estimatedHours: 12 },
  { id: "t3", ticketId: "IC-03", title: "Webhook event handler for billing events", source: "Assigned", status: "in_progress", projectId: "p-saas", assigneeId: "u-fs1", createdById: "u-pm", dueDate: isoDaysAgo(1), createdAt: isoDaysAgo(2), kind: "feature", module: "Webhooks", estimatedHours: 14 },
  { id: "t4", ticketId: "IC-04", title: "Subscription lifecycle API — create, upgrade, cancel", source: "Assigned", status: "done", projectId: "p-saas", assigneeId: "u-fs2", createdById: "u-pm", dueDate: isoDaysAgo(1), createdAt: isoDaysAgo(5), kind: "feature", module: "Subscriptions", estimatedHours: 20 },
  { id: "t5", ticketId: "IC-05", title: "Optimise invoice generation queries", source: "Manual", status: "in_progress", projectId: "p-saas", assigneeId: "u-fs3", createdById: "u-fs3", dueDate: today, createdAt: isoDaysAgo(2), kind: "improvement", module: "Invoicing", estimatedHours: 10 },
  { id: "t6", ticketId: "IC-06", title: "E2E tests for checkout & payment flow", source: "Assigned", status: "todo", projectId: "p-saas", assigneeId: "u-qa1", createdById: "u-pm", dueDate: isoDaysAgo(2), createdAt: isoDaysAgo(4), kind: "task", module: "QA", estimatedHours: 8 },
  { id: "t7", ticketId: "IC-07", title: "Razorpay payment sandbox test scripts", source: "Assigned", status: "failed", projectId: "p-saas", assigneeId: "u-qa2", createdById: "u-pm", dueDate: isoDaysAgo(3), createdAt: isoDaysAgo(6), kind: "task", module: "QA", estimatedHours: 10 },
  { id: "t8", ticketId: "IC-08", title: "Rebrand delivery dashboard for CityMart", source: "Manual", status: "done", projectId: "p-mart", assigneeId: "u-fs15", createdById: "u-fs15", dueDate: isoDaysAgo(2), createdAt: isoDaysAgo(4), kind: "feature", module: "Dashboard", estimatedHours: 16 },
  { id: "t9", ticketId: "IC-09", title: "Migrate legacy coupon engine to new billing model", source: "Assigned", status: "todo", projectId: "p-saas", assigneeId: null, createdById: "u-pm", dueDate: isoDaysAgo(2), createdAt: isoDaysAgo(3), kind: "improvement", module: "Billing", estimatedHours: 18 },
  { id: "t10", ticketId: "IC-10", title: "Pricing page visual design — new plan tiers", source: "Manual", status: "ready_for_testing", projectId: "p-saas", assigneeId: "u-des", createdById: "u-des", dueDate: today, createdAt: isoDaysAgo(1), kind: "feature", module: "UI", estimatedHours: 8 },
  { id: "t11", ticketId: "IC-11", title: "Route-optimisation report for TransMove fleet", source: "Assigned", status: "done", projectId: "p-logi", assigneeId: "u-fs14", createdById: "u-pm", dueDate: isoDaysAgo(1), createdAt: isoDaysAgo(3), kind: "feature", module: "Fleet", estimatedHours: 14 },
];

export const INITIAL_WORK_LOGS: WorkLog[] = [
  { id: "w1", taskId: "t1", userId: "u-fe1", hours: 2, date: isoDaysAgo(1), note: "Plan selector layout" },
  { id: "w2", taskId: "t1", userId: "u-fe1", hours: 3, date: today, note: "Responsive pass" },
  { id: "w3", taskId: "t4", userId: "u-fs2", hours: 4, date: isoDaysAgo(2), note: "Subscription create & cancel endpoints" },
  { id: "w4", taskId: "t4", userId: "u-fs2", hours: 3, date: isoDaysAgo(1), note: "Lifecycle transitions" },
  { id: "w5", taskId: "t5", userId: "u-fs3", hours: 3.5, date: isoDaysAgo(1), note: "Query profiling" },
  { id: "w6", taskId: "t5", userId: "u-fs3", hours: 2, date: today, note: "Index optimisation" },
  { id: "w7", taskId: "t3", userId: "u-fs1", hours: 4, date: isoDaysAgo(1), note: "Webhook retry logic" },
  { id: "w8", taskId: "t8", userId: "u-fs15", hours: 5, date: isoDaysAgo(3), note: "Dashboard components" },
  { id: "w9", taskId: "t7", userId: "u-qa2", hours: 1.5, date: isoDaysAgo(1), note: "Payment sandbox scripts" },
  { id: "w10", taskId: "t1", userId: "u-qa1", hours: 2, date: today, note: "Regression testing" },
];

function isoMondayAgo(weeksAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - weeksAgo * 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const INITIAL_WEEK_PLANS: WeekPlan[] = [
  {
    id: "wp-pm",
    weekStart: isoMondayAgo(0),
    ownerId: "u-pm",
    goals: [
      { id: "g1", text: "Ship subscription billing MVP to CloudCart" },
      { id: "g2", text: "Close 2 delivered project handoffs (CityMart, TransMove)" },
      { id: "g3", text: "Fix Razorpay sandbox failures with QA" },
    ],
    createdAt: isoDaysAgo(6),
  },
];

/** Simple login you can only reach via the auth form or by admin-assigned accounts. */
export function findUserByEmail(email: string): User | undefined {
  return USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function daysBack(n: number): string {
  return isoDaysAgo(n);
}