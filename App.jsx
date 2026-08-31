import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  Home, ListChecks, Plus, PieChart as PieIcon, MoreHorizontal, Wallet,
  CreditCard, Target, CalendarDays, Settings, TrendingUp, TrendingDown,
  AlertTriangle, X, Trash2, Pencil, Download, Upload, Moon, Sun, Search,
  ChevronLeft, ChevronRight, Check, Landmark, ReceiptText, PiggyBank, ArrowLeft,
} from "lucide-react";

/* ============================== CONSTANTES ============================== */

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const EXPENSE_CATEGORIES = ["Moradia","Aluguel","Condomínio","Água","Energia","Internet","Telefone","Alimentação","Mercado","Restaurante","Transporte","Combustível","Aplicativos","Saúde","Farmácia","Educação","Lazer","Assinaturas","Compras","Cartão de crédito","Empréstimos","Financiamentos","Impostos","Outros"];
const INCOME_CATEGORIES = ["Salário","Freelance","Comissão","Aluguel recebido","Rendimentos","Vendas","Outros ganhos"];
const PAYMENT_METHODS = ["Dinheiro","Débito","Pix","Cartão de crédito","Transferência","Boleto"];
const DEBT_STATUS = ["Em aberto","Em pagamento","Quitada","Atrasada"];
const CARD_COLORS = ["#1B3A2F","#3E6FA6","#B8935A","#8B4E9E","#3F7D6B","#A65D3E"];
const CHART_COLORS = ["#1B3A2F","#B8935A","#3E6FA6","#D6483D","#8B4E9E","#3F7D6B","#E0A030","#6B7280","#A65D3E","#4C8B6E"];

const STORAGE_KEY = "meu-financeiro:data:v1";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatBRL(v) {
  const n = Number(v) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

/* ============================== DADOS DE EXEMPLO ============================== */

function buildSampleData() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const iso = (yy, mm, dd) => `${yy}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;

  const incomes = [
    { id: uid(), name: "Salário", category: "Salário", value: 5000, date: iso(y, m, 5), recurring: true, frequency: "mensal", note: "" },
    { id: uid(), name: "Freelance design", category: "Freelance", value: 450, date: iso(y, m, 12), recurring: false, frequency: "", note: "" },
  ];

  const expenses = [
    { id: uid(), name: "Aluguel", totalValue: 1200, category: "Aluguel", date: iso(y, m, 5), dueDate: iso(y, m, 10), paymentMethod: "Transferência", paid: true, type: "fixa", recurring: true, frequency: "mensal", installments: 1, note: "" },
    { id: uid(), name: "Energia elétrica", totalValue: 250, category: "Energia", date: iso(y, m, 8), dueDate: iso(y, m, 15), paymentMethod: "Boleto", paid: true, type: "fixa", recurring: true, frequency: "mensal", installments: 1, note: "" },
    { id: uid(), name: "Internet", totalValue: 120, category: "Internet", date: iso(y, m, 8), dueDate: iso(y, m, 18), paymentMethod: "Débito", paid: false, type: "fixa", recurring: true, frequency: "mensal", installments: 1, note: "" },
    { id: uid(), name: "Mercado do mês", totalValue: 800, category: "Mercado", date: iso(y, m, 14), dueDate: iso(y, m, 14), paymentMethod: "Pix", paid: true, type: "variavel", recurring: false, frequency: "", installments: 1, note: "" },
    { id: uid(), name: "Academia", totalValue: 130, category: "Lazer", date: iso(y, m, 3), dueDate: iso(y, m, 20), paymentMethod: "Débito", paid: false, type: "fixa", recurring: true, frequency: "mensal", installments: 1, note: "" },
    { id: uid(), name: "Notebook novo", totalValue: 2400, category: "Compras", date: iso(y, m, 2), dueDate: iso(y, m, 2), paymentMethod: "Cartão de crédito", paid: false, type: "variavel", recurring: false, frequency: "", installments: 6, note: "" },
  ];

  const cards = [
    { id: uid(), name: "Cartão Principal", bank: "Banco Ledger", limit: 4000, closingDay: 20, dueDay: 27, color: CARD_COLORS[0] },
  ];
  const cardTransactions = [
    { id: uid(), cardId: cards[0].id, description: "Roupas", category: "Compras", value: 320, date: iso(y, m, 6), installments: 1 },
    { id: uid(), cardId: cards[0].id, description: "Passagem de viagem", category: "Lazer", value: 1200, date: iso(y, m, 9), installments: 12 },
  ];

  const debts = [
    { id: uid(), name: "Empréstimo pessoal", creditor: "Banco Ledger", originalValue: 10000, currentValue: 6000, installmentValue: 500, totalInstallments: 20, paidInstallments: 8, interestRate: 2.1, dueDate: iso(y, m, 25), nextDate: iso(y, m + 1, 5), status: "Em pagamento", note: "" },
  ];

  const budgets = [
    { category: "Alimentação", limit: 800 },
    { category: "Combustível", limit: 500 },
    { category: "Lazer", limit: 300 },
  ];

  const goals = [
    { id: uid(), name: "Reserva de emergência", targetValue: 15000, currentValue: 4200, targetDate: iso(y + 1, 0, 1) },
    { id: uid(), name: "Viagem de fim de ano", targetValue: 3000, currentValue: 900, targetDate: iso(y, 11, 1) },
  ];

  return { incomes, expenses, cards, cardTransactions, debts, budgets, goals, categories: [...EXPENSE_CATEGORIES] };
}

function emptyData() {
  return { incomes: [], expenses: [], cards: [], cardTransactions: [], debts: [], budgets: [], goals: [], categories: [...EXPENSE_CATEGORIES] };
}

const defaultSettings = { userName: "", currency: "BRL", cycleStartDay: 1, theme: "auto" };

/* ============================== CÁLCULOS ============================== */

function isSameMonth(iso, month, year) {
  if (!iso) return false;
  const [yy, mm] = iso.split("-").map(Number);
  return yy === year && mm - 1 === month;
}

function monthsElapsedFrom(iso, month, year) {
  const [yy, mm] = iso.split("-").map(Number);
  return (year - yy) * 12 + (month - (mm - 1));
}

function getEffectiveIncomes(incomes, month, year) {
  const out = [];
  for (const inc of incomes) {
    if (isSameMonth(inc.date, month, year)) { out.push({ ...inc, effectiveValue: Number(inc.value) }); continue; }
    if (inc.recurring) {
      const diff = monthsElapsedFrom(inc.date, month, year);
      if (diff <= 0) continue;
      if (inc.frequency === "mensal" || inc.frequency === "quinzenal" || inc.frequency === "semanal") {
        out.push({ ...inc, effectiveValue: Number(inc.value) });
      } else if (inc.frequency === "anual") {
        const [, mm] = inc.date.split("-").map(Number);
        if (mm - 1 === month) out.push({ ...inc, effectiveValue: Number(inc.value) });
      }
    }
  }
  return out;
}

function getEffectiveExpenses(expenses, month, year) {
  const out = [];
  for (const ex of expenses) {
    const installments = Number(ex.installments) || 1;
    const monthlyValue = Number(ex.totalValue) / installments;
    if (installments > 1) {
      const diff = monthsElapsedFrom(ex.date, month, year);
      if (diff >= 0 && diff < installments) {
        out.push({ ...ex, effectiveValue: monthlyValue, installmentIndex: diff + 1, installmentsTotal: installments });
      }
      continue;
    }
    if (isSameMonth(ex.date, month, year)) { out.push({ ...ex, effectiveValue: monthlyValue }); continue; }
    if (ex.recurring) {
      const diff = monthsElapsedFrom(ex.date, month, year);
      if (diff <= 0) continue;
      if (ex.frequency === "mensal" || !ex.frequency) out.push({ ...ex, effectiveValue: monthlyValue });
      else if (ex.frequency === "anual") {
        const [, mm] = ex.date.split("-").map(Number);
        if (mm - 1 === month) out.push({ ...ex, effectiveValue: monthlyValue });
      }
    }
  }
  return out;
}

function getCardInstallmentsForMonth(cardTransactions, month, year) {
  const out = [];
  for (const t of cardTransactions) {
    const installments = Number(t.installments) || 1;
    const diff = monthsElapsedFrom(t.date, month, year);
    if (diff >= 0 && diff < installments) {
      out.push({ ...t, effectiveValue: Number(t.value) / installments, installmentIndex: diff + 1, installmentsTotal: installments });
    }
  }
  return out;
}

function cardUsedLimit(cardId, cardTransactions) {
  const now = new Date();
  const month = now.getMonth(), year = now.getFullYear();
  let used = 0;
  for (const t of cardTransactions.filter(t => t.cardId === cardId)) {
    const installments = Number(t.installments) || 1;
    const monthly = Number(t.value) / installments;
    const elapsed = clamp(monthsElapsedFrom(t.date, month, year), 0, installments);
    const remaining = monthly * (installments - elapsed);
    used += Math.max(0, remaining);
  }
  return used;
}

function activeDebtMonthlyTotal(debts) {
  return debts.filter(d => d.status === "Em pagamento" || d.status === "Em aberto" || d.status === "Atrasada")
    .filter(d => d.paidInstallments < d.totalInstallments)
    .reduce((s, d) => s + Number(d.installmentValue || 0), 0);
}

function useMonthSummary(data, month, year) {
  return useMemo(() => {
    const incomes = getEffectiveIncomes(data.incomes, month, year);
    const expenses = getEffectiveExpenses(data.expenses, month, year);
    const cardInstallments = getCardInstallmentsForMonth(data.cardTransactions, month, year);

    const totalIncome = incomes.reduce((s, i) => s + i.effectiveValue, 0);
    const salaryIncome = incomes.filter(i => i.category === "Salário").reduce((s, i) => s + i.effectiveValue, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.effectiveValue, 0) + cardInstallments.reduce((s, c) => s + c.effectiveValue, 0);
    const paidExpense = expenses.filter(e => e.paid).reduce((s, e) => s + e.effectiveValue, 0);
    const pendingExpense = expenses.filter(e => !e.paid).reduce((s, e) => s + e.effectiveValue, 0);
    const overdueExpense = expenses.filter(e => !e.paid && e.dueDate && e.dueDate < todayISO()).reduce((s, e) => s + e.effectiveValue, 0);
    const cardFatura = cardInstallments.reduce((s, c) => s + c.effectiveValue, 0);
    const debtInstallmentsMonth = activeDebtMonthlyTotal(data.debts);
    const totalDebt = data.debts.reduce((s, d) => s + Number(d.currentValue || 0), 0);
    const saldo = totalIncome - totalExpense;
    const percentComprometido = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    return {
      incomes, expenses, cardInstallments,
      totalIncome, salaryIncome, totalExpense, paidExpense, pendingExpense, overdueExpense,
      cardFatura, debtInstallmentsMonth, totalDebt, saldo, percentComprometido,
    };
  }, [data, month, year]);
}

/* ============================== COMPONENTES DE UI ============================== */

function Icon({ as: Comp, size = 18, ...rest }) { return <Comp size={size} {...rest} />; }

function StatCard({ label, value, tone = "neutral", icon, sub }) {
  const toneVar = { income: "var(--income)", expense: "var(--expense)", warning: "var(--warning)", neutral: "var(--text)" }[tone];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-3.5 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between">
        <span style={{ color: "var(--text-muted)" }} className="text-xs">{label}</span>
        {icon && <Icon as={icon} size={15} color={toneVar} />}
      </div>
      <span style={{ color: toneVar, fontVariantNumeric: "tabular-nums" }} className="text-lg font-semibold truncate">{value}</span>
      {sub && <span style={{ color: "var(--text-muted)" }} className="text-[11px]">{sub}</span>}
    </div>
  );
}

function ProgressBar({ percent, tone = "primary", height = 8 }) {
  const p = clamp(percent, 0, 100);
  const color = { primary: "var(--primary)", income: "var(--income)", expense: "var(--expense)", warning: "var(--warning)" }[tone] || "var(--primary)";
  return (
    <div style={{ background: "var(--surface-alt)", height }} className="w-full rounded-full overflow-hidden">
      <div style={{ width: `${p}%`, background: color, height }} className="rounded-full transition-all duration-300" />
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const map = {
    income: { bg: "color-mix(in srgb, var(--income) 15%, transparent)", fg: "var(--income)" },
    expense: { bg: "color-mix(in srgb, var(--expense) 15%, transparent)", fg: "var(--expense)" },
    warning: { bg: "color-mix(in srgb, var(--warning) 18%, transparent)", fg: "var(--warning)" },
    neutral: { bg: "var(--surface-alt)", fg: "var(--text-muted)" },
  }[tone];
  return <span style={{ background: map.bg, color: map.fg }} className="text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{children}</span>;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", maxHeight: "90vh" }}
        className={`w-full ${wide ? "sm:max-w-xl" : "sm:max-w-md"} rounded-t-2xl sm:rounded-2xl overflow-y-auto`}
      >
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }} className="sticky top-0 flex items-center justify-between px-4 py-3">
          <h3 style={{ color: "var(--text)" }} className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }} className="p-1"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 mb-3">
      <span style={{ color: "var(--text-muted)" }} className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { background: "var(--surface-alt)", color: "var(--text)", border: "1px solid var(--border)" };
function TextInput(props) {
  return <input {...props} style={inputStyle} className={`rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 ${props.className || ""}`} />;
}
function Select({ children, ...props }) {
  return <select {...props} style={inputStyle} className="rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2">{children}</select>;
}
function TextArea(props) {
  return <textarea {...props} style={inputStyle} className="rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2" />;
}

function PrimaryButton({ children, onClick, type = "button", full, danger }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{ background: danger ? "var(--expense)" : "var(--primary)", color: "var(--primary-contrast)" }}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${full ? "w-full" : ""} active:opacity-80`}
    >
      {children}
    </button>
  );
}
function GhostButton({ children, onClick, full }) {
  return (
    <button onClick={onClick} style={{ background: "var(--surface-alt)", color: "var(--text)" }} className={`rounded-lg px-4 py-2.5 text-sm font-medium ${full ? "w-full" : ""}`}>
      {children}
    </button>
  );
}

function EmptyState({ text, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <span style={{ color: "var(--text-muted)" }} className="text-sm">{text}</span>
      {action}
    </div>
  );
}

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 style={{ color: "var(--text)" }} className="text-lg font-semibold">{title}</h2>
      {onAdd && (
        <button onClick={onAdd} style={{ background: "var(--primary)", color: "var(--primary-contrast)" }} className="rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function MonthSwitcher({ month, year, onChange }) {
  const go = (delta) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    onChange(m, y);
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => go(-1)} style={{ color: "var(--text-muted)" }}><ChevronLeft size={18} /></button>
      <span style={{ color: "var(--text)" }} className="text-sm font-semibold w-32 text-center">{MONTHS_PT[month]} {year}</span>
      <button onClick={() => go(1)} style={{ color: "var(--text-muted)" }}><ChevronRight size={18} /></button>
    </div>
  );
}

/* ============================== APP ============================== */

export default function App() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [data, setData] = useState(emptyData());
  const [settings, setSettings] = useState(defaultSettings);
  const [view, setView] = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [modal, setModal] = useState(null); // { type, payload }
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const saveTimer = useRef(null);

  // carregar dados salvos no navegador (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...emptyData(), ...(parsed.data || {}) });
        setSettings({ ...defaultSettings, ...(parsed.settings || {}) });
      } else {
        setNeedsOnboarding(true);
      }
    } catch (e) {
      setNeedsOnboarding(true);
    }
    setReady(true);
  }, []);

  // detectar tema do sistema
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    setSystemDark(mq.matches);
    const listener = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, []);
  const isDark = settings.theme === "dark" || (settings.theme === "auto" && systemDark);

  const persist = useCallback((nextData, nextSettings) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: nextData, settings: nextSettings }));
      } catch (e) { /* armazenamento indisponível ou cheio */ }
    }, 250);
  }, []);

  useEffect(() => { if (ready && !needsOnboarding) persist(data, settings); }, [data, settings, ready, needsOnboarding, persist]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  function startOnboarding(sample) {
    setData(sample ? buildSampleData() : emptyData());
    setNeedsOnboarding(false);
  }

  const summary = useMonthSummary(data, month, year);

  /* ---------- CRUD genérico ---------- */
  function addItem(key, item) {
    setData((d) => ({ ...d, [key]: [...d[key], { id: uid(), ...item }] }));
  }
  function updateItem(key, id, patch) {
    setData((d) => ({ ...d, [key]: d[key].map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  }
  function removeItem(key, id) {
    setData((d) => ({ ...d, [key]: d[key].filter((it) => it.id !== id) }));
  }

  /* ---------- Backup ---------- */
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ data, settings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `meu-financeiro-backup-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("Backup exportado");
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!window.confirm("Importar este backup vai substituir todos os dados atuais. Deseja continuar?")) return;
        setData({ ...emptyData(), ...(parsed.data || {}) });
        setSettings({ ...defaultSettings, ...(parsed.settings || {}) });
        showToast("Backup importado com sucesso");
      } catch (e) { showToast("Arquivo inválido"); }
    };
    reader.readAsText(file);
  }
  function exportCSV() {
    const rows = [["Tipo", "Nome", "Categoria", "Valor", "Data", "Status"]];
    summary.expenses.forEach((e) => rows.push(["Despesa", e.name, e.category, e.effectiveValue.toFixed(2), e.date, e.paid ? "Pago" : "Pendente"]));
    summary.incomes.forEach((i) => rows.push(["Receita", i.name, i.category, i.effectiveValue.toFixed(2), i.date, "-"]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${MONTHS_PT[month]}-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exportado");
  }

  if (!ready) return null;

  const theme = {
    "--bg": isDark ? "#121815" : "#F6F4EF",
    "--surface": isDark ? "#1B2320" : "#FFFFFF",
    "--surface-alt": isDark ? "#222B27" : "#EFEDE6",
    "--text": isDark ? "#EDEDE6" : "#1A1F1C",
    "--text-muted": isDark ? "#9AA39C" : "#6B6F68",
    "--border": isDark ? "#2C3833" : "#E2DFD5",
    "--primary": isDark ? "#4C8B6E" : "#1B3A2F",
    "--primary-contrast": isDark ? "#0D1210" : "#FFFFFF",
    "--accent": isDark ? "#D4AE7A" : "#B8935A",
    "--income": isDark ? "#4CBE84" : "#2F9E64",
    "--expense": isDark ? "#E8695F" : "#D6483D",
    "--warning": isDark ? "#F0B94D" : "#E0A030",
    "--info": isDark ? "#6FA0D6" : "#3E6FA6",
  };

  if (needsOnboarding) {
    return (
      <div style={{ ...theme, background: "var(--bg)", minHeight: "100vh" }} className="flex items-center justify-center p-6">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-2xl p-6 max-w-sm w-full text-center">
          <div style={{ background: "var(--primary)" }} className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet color="var(--primary-contrast)" size={26} />
          </div>
          <h1 style={{ color: "var(--text)" }} className="text-xl font-bold mb-1">Meu Financeiro</h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm mb-6">Controle suas receitas, despesas, dívidas e cartões em um só lugar.</p>
          <div className="flex flex-col gap-2">
            <PrimaryButton full onClick={() => startOnboarding(true)}>Começar com dados de exemplo</PrimaryButton>
            <GhostButton full onClick={() => startOnboarding(false)}>Começar do zero</GhostButton>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "dashboard", label: "Início", icon: Home },
    { key: "lancamentos", label: "Lançamentos", icon: ListChecks },
    { key: "relatorios", label: "Relatórios", icon: PieIcon },
  ];
  const moreItems = [
    { key: "dividas", label: "Dívidas", icon: Landmark },
    { key: "cartoes", label: "Cartões", icon: CreditCard },
    { key: "orcamentos", label: "Orçamentos", icon: ReceiptText },
    { key: "metas", label: "Metas", icon: Target },
    { key: "calendario", label: "Calendário", icon: CalendarDays },
    { key: "reserva", label: "Reserva de emergência", icon: PiggyBank },
    { key: "config", label: "Configurações", icon: Settings },
  ];
  const allDesktopItems = [...navItems, ...moreItems];

  return (
    <div style={{ ...theme, background: "var(--bg)", minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }} className="flex">
      {/* Sidebar desktop */}
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }} className="hidden md:flex flex-col w-56 shrink-0 min-h-screen p-4">
        <div className="flex items-center gap-2 mb-6 px-1">
          <div style={{ background: "var(--primary)" }} className="w-8 h-8 rounded-lg flex items-center justify-center"><Wallet size={16} color="var(--primary-contrast)" /></div>
          <span style={{ color: "var(--text)" }} className="font-bold text-sm">Meu Financeiro</span>
        </div>
        <nav className="flex flex-col gap-1">
          {allDesktopItems.map((it) => (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              style={{ background: view === it.key ? "var(--surface-alt)" : "transparent", color: view === it.key ? "var(--primary)" : "var(--text-muted)" }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left"
            >
              <it.icon size={16} /> {it.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between px-1 pt-4">
          <span style={{ color: "var(--text-muted)" }} className="text-xs">Tema</span>
          <ThemeToggle settings={settings} setSettings={setSettings} />
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }} className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <div style={{ background: "var(--primary)" }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Wallet size={14} color="var(--primary-contrast)" /></div>
            <span style={{ color: "var(--text)" }} className="font-bold text-sm">Meu Financeiro</span>
          </div>
          <MonthSwitcher month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: "var(--surface-alt)" }}>
              <Search size={14} color="var(--text-muted)" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." style={{ color: "var(--text)", background: "transparent" }} className="text-xs outline-none w-28" />
            </div>
            <span className="md:hidden"><ThemeToggle settings={settings} setSettings={setSettings} /></span>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:pb-6 max-w-5xl w-full mx-auto">
          {search.trim() ? (
            <SearchResults data={data} query={search} onClear={() => setSearch("")} />
          ) : (
            <>
              {view === "dashboard" && <Dashboard data={data} summary={summary} month={month} year={year} setModal={setModal} setView={setView} />}
              {view === "lancamentos" && <Lancamentos data={data} summary={summary} setModal={setModal} updateItem={updateItem} removeItem={removeItem} />}
              {view === "dividas" && <Dividas data={data} setModal={setModal} updateItem={updateItem} removeItem={removeItem} />}
              {view === "cartoes" && <Cartoes data={data} setModal={setModal} removeItem={removeItem} month={month} year={year} />}
              {view === "orcamentos" && <Orcamentos data={data} summary={summary} setData={setData} />}
              {view === "metas" && <Metas data={data} setModal={setModal} updateItem={updateItem} removeItem={removeItem} />}
              {view === "calendario" && <CalendarioView data={data} month={month} year={year} setMonth={setMonth} setYear={setYear} />}
              {view === "reserva" && <ReservaEmergencia data={data} summary={summary} />}
              {view === "relatorios" && <Relatorios data={data} year={year} exportCSV={exportCSV} />}
              {view === "config" && <ConfiguracoesView settings={settings} setSettings={setSettings} data={data} setData={setData} exportBackup={exportBackup} importBackup={importBackup} />}
            </>
          )}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }} className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around px-1 pt-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((it) => (
          <button key={it.key} onClick={() => setView(it.key)} className="flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1" style={{ color: view === it.key ? "var(--primary)" : "var(--text-muted)" }}>
            <it.icon size={19} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </button>
        ))}
        <button onClick={() => setAddOpen(true)} className="flex flex-col items-center justify-center flex-1 -mt-5">
          <span style={{ background: "var(--primary)" }} className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg">
            <Plus color="var(--primary-contrast)" size={22} />
          </span>
        </button>
        <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1" style={{ color: moreOpen ? "var(--primary)" : "var(--text-muted)" }}>
          <MoreHorizontal size={19} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      {moreOpen && (
        <Modal title="Mais opções" onClose={() => setMoreOpen(false)}>
          <div className="grid grid-cols-3 gap-3">
            {moreItems.map((it) => (
              <button key={it.key} onClick={() => { setView(it.key); setMoreOpen(false); }} style={{ background: "var(--surface-alt)" }} className="flex flex-col items-center gap-1.5 rounded-xl py-4 text-center">
                <it.icon size={20} color="var(--primary)" />
                <span style={{ color: "var(--text)" }} className="text-[11px] font-medium leading-tight px-1">{it.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {addOpen && (
        <Modal title="Adicionar" onClose={() => setAddOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <QuickAddBtn label="Receita" icon={TrendingUp} onClick={() => { setAddOpen(false); setModal({ type: "income" }); }} />
            <QuickAddBtn label="Despesa" icon={TrendingDown} onClick={() => { setAddOpen(false); setModal({ type: "expense" }); }} />
            <QuickAddBtn label="Dívida" icon={Landmark} onClick={() => { setAddOpen(false); setModal({ type: "debt" }); }} />
            <QuickAddBtn label="Compra no cartão" icon={CreditCard} onClick={() => { setAddOpen(false); setModal({ type: "cardTransaction" }); }} />
          </div>
        </Modal>
      )}

      {modal?.type === "income" && <IncomeModal data={data} payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} updateItem={updateItem} />}
      {modal?.type === "expense" && <ExpenseModal data={data} payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} updateItem={updateItem} />}
      {modal?.type === "debt" && <DebtModal payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} updateItem={updateItem} />}
      {modal?.type === "card" && <CardModal payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} updateItem={updateItem} />}
      {modal?.type === "cardTransaction" && <CardTransactionModal data={data} payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} />}
      {modal?.type === "goal" && <GoalModal payload={modal.payload} onClose={() => setModal(null)} addItem={addItem} updateItem={updateItem} />}

      {toast && (
        <div style={{ background: "var(--text)", color: "var(--bg)" }} className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium z-50 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ThemeToggle({ settings, setSettings }) {
  const cur = settings.theme;
  const next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
  const Icon2 = cur === "dark" ? Moon : Sun;
  return (
    <button onClick={() => setSettings((s) => ({ ...s, theme: next }))} style={{ background: "var(--surface-alt)", color: "var(--text)" }} className="p-2 rounded-lg" title={`Tema: ${cur}`}>
      <Icon2 size={15} />
    </button>
  );
}

function QuickAddBtn({ label, icon: Icon2, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "var(--surface-alt)" }} className="flex flex-col items-center gap-2 rounded-xl py-6">
      <Icon2 size={22} color="var(--primary)" />
      <span style={{ color: "var(--text)" }} className="text-sm font-medium">{label}</span>
    </button>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ data, summary, month, year, setModal, setView }) {
  const podeGastar = Math.max(0, summary.saldo);
  const economizado = Math.max(0, summary.saldo);

  const catTotals = {};
  summary.expenses.forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.effectiveValue; });
  summary.cardInstallments.forEach((c) => { catTotals[c.category] = (catTotals[c.category] || 0) + c.effectiveValue; });
  const pieData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  const trend = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i, y = year;
    while (m < 0) { m += 12; y -= 1; }
    const inc = getEffectiveIncomes(data.incomes, m, y).reduce((s, x) => s + x.effectiveValue, 0);
    const exp = getEffectiveExpenses(data.expenses, m, y).reduce((s, x) => s + x.effectiveValue, 0) +
      getCardInstallmentsForMonth(data.cardTransactions, m, y).reduce((s, x) => s + x.effectiveValue, 0);
    trend.push({ mes: MONTHS_SHORT[m], Receitas: Math.round(inc), Despesas: Math.round(exp) });
  }

  const upcoming = summary.expenses.filter((e) => !e.paid && e.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
  const recent = [...summary.expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 style={{ color: "var(--text)" }} className="text-xl font-bold">Resumo de {MONTHS_PT[month]} de {year}</h1>
        <p style={{ color: "var(--text-muted)" }} className="text-sm">Visão geral das suas finanças neste mês.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Salário do mês" value={formatBRL(summary.salaryIncome)} tone="income" icon={Wallet} />
        <StatCard label="Renda total" value={formatBRL(summary.totalIncome)} tone="income" icon={TrendingUp} />
        <StatCard label="Total de despesas" value={formatBRL(summary.totalExpense)} tone="expense" icon={TrendingDown} />
        <StatCard label="Contas pagas" value={formatBRL(summary.paidExpense)} tone="income" icon={Check} />
        <StatCard label="Contas pendentes" value={formatBRL(summary.pendingExpense)} tone="warning" icon={AlertTriangle} />
        <StatCard label="Total de dívidas" value={formatBRL(summary.totalDebt)} tone="expense" icon={Landmark} />
        <StatCard label="Parcelas do mês" value={formatBRL(summary.debtInstallmentsMonth)} tone="expense" icon={ReceiptText} />
        <StatCard label="Fatura dos cartões" value={formatBRL(summary.cardFatura)} tone="expense" icon={CreditCard} />
        <StatCard label="Saldo restante" value={formatBRL(summary.saldo)} tone={summary.saldo >= 0 ? "income" : "expense"} icon={Wallet} />
        <StatCard label="Renda comprometida" value={`${summary.percentComprometido.toFixed(1)}%`} tone={summary.percentComprometido > 90 ? "expense" : summary.percentComprometido > 70 ? "warning" : "income"} icon={PieIcon} />
        <StatCard label="Posso gastar" value={formatBRL(podeGastar)} tone="income" icon={TrendingUp} />
        <StatCard label="Economia do mês" value={formatBRL(economizado)} tone="income" icon={PiggyBank} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold">Contas próximas do vencimento</h3>
          </div>
          {upcoming.length === 0 ? <EmptyState text="Nenhuma conta pendente por aqui." /> : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div style={{ color: "var(--text)" }} className="truncate">{e.name}</div>
                    <div style={{ color: "var(--text-muted)" }} className="text-xs">Vence em {formatDateBR(e.dueDate)}</div>
                  </div>
                  <span style={{ color: "var(--expense)", fontVariantNumeric: "tabular-nums" }} className="font-medium shrink-0 ml-2">{formatBRL(e.effectiveValue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Últimas despesas</h3>
          {recent.length === 0 ? <EmptyState text="Nenhuma despesa registrada ainda." /> : (
            <ul className="flex flex-col gap-2">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div style={{ color: "var(--text)" }} className="truncate">{e.name}</div>
                    <div style={{ color: "var(--text-muted)" }} className="text-xs">{e.category} · {formatDateBR(e.date)}</div>
                  </div>
                  <span style={{ color: "var(--expense)", fontVariantNumeric: "tabular-nums" }} className="font-medium shrink-0 ml-2">{formatBRL(e.effectiveValue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Gastos por categoria</h3>
          {pieData.length === 0 ? <EmptyState text="Sem dados suficientes ainda." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Evolução das despesas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Receitas" stroke="var(--income)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Despesas" stroke="var(--expense)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ============================== LANÇAMENTOS (Receitas / Despesas) ============================== */

function Lancamentos({ data, summary, setModal, updateItem, removeItem }) {
  const [tab, setTab] = useState("despesas");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [filterCategory, setFilterCategory] = useState("todas");

  const expenses = summary.expenses.filter((e) => {
    if (filterStatus === "pagas" && !e.paid) return false;
    if (filterStatus === "pendentes" && e.paid) return false;
    if (filterStatus === "vencidas" && !(!e.paid && e.dueDate && e.dueDate < todayISO())) return false;
    if (filterCategory !== "todas" && e.category !== filterCategory) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const incomes = summary.incomes.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setTab("despesas")} style={{ background: tab === "despesas" ? "var(--primary)" : "var(--surface-alt)", color: tab === "despesas" ? "var(--primary-contrast)" : "var(--text)" }} className="rounded-full px-4 py-1.5 text-sm font-medium">Despesas</button>
        <button onClick={() => setTab("receitas")} style={{ background: tab === "receitas" ? "var(--primary)" : "var(--surface-alt)", color: tab === "receitas" ? "var(--primary-contrast)" : "var(--text)" }} className="rounded-full px-4 py-1.5 text-sm font-medium">Receitas</button>
      </div>

      {tab === "despesas" && (
        <>
          <SectionHeader title="Despesas do mês" onAdd={() => setModal({ type: "expense" })} addLabel="Nova despesa" />
          <div className="flex flex-wrap gap-2 mb-3">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="!w-auto">
              <option value="todas">Todos os status</option>
              <option value="pagas">Pagas</option>
              <option value="pendentes">Pendentes</option>
              <option value="vencidas">Vencidas</option>
            </Select>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="!w-auto">
              <option value="todas">Todas categorias</option>
              {data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          {expenses.length === 0 ? <EmptyState text="Nenhuma despesa neste filtro." /> : (
            <ul className="flex flex-col gap-2">
              {expenses.map((e) => {
                const overdue = !e.paid && e.dueDate && e.dueDate < todayISO();
                return (
                  <li key={e.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--text)" }} className="font-medium truncate">{e.name}</span>
                        {e.installmentsTotal > 1 && <Badge tone="neutral">{e.installmentIndex}/{e.installmentsTotal}</Badge>}
                        {e.paid ? <Badge tone="income">Pago</Badge> : overdue ? <Badge tone="expense">Atrasada</Badge> : <Badge tone="warning">Pendente</Badge>}
                      </div>
                      <div style={{ color: "var(--text-muted)" }} className="text-xs">{e.category} · vence {formatDateBR(e.dueDate)}</div>
                    </div>
                    <span style={{ color: "var(--expense)", fontVariantNumeric: "tabular-nums" }} className="font-semibold text-sm shrink-0">{formatBRL(e.effectiveValue)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {!e.paid && <button onClick={() => updateItem("expenses", e.id, { paid: true })} style={{ color: "var(--income)" }} title="Marcar como paga"><Check size={16} /></button>}
                      <button onClick={() => setModal({ type: "expense", payload: e })} style={{ color: "var(--text-muted)" }}><Pencil size={15} /></button>
                      <button onClick={() => removeItem("expenses", e.id)} style={{ color: "var(--expense)" }}><Trash2 size={15} /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {tab === "receitas" && (
        <>
          <SectionHeader title="Receitas do mês" onAdd={() => setModal({ type: "income" })} addLabel="Nova receita" />
          {incomes.length === 0 ? <EmptyState text="Nenhuma receita cadastrada." /> : (
            <ul className="flex flex-col gap-2">
              {incomes.map((i) => (
                <li key={i.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text)" }} className="font-medium truncate">{i.name}</span>
                      {i.recurring && <Badge tone="neutral">Recorrente</Badge>}
                    </div>
                    <div style={{ color: "var(--text-muted)" }} className="text-xs">{i.category} · {formatDateBR(i.date)}</div>
                  </div>
                  <span style={{ color: "var(--income)", fontVariantNumeric: "tabular-nums" }} className="font-semibold text-sm shrink-0">{formatBRL(i.effectiveValue)}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setModal({ type: "income", payload: i })} style={{ color: "var(--text-muted)" }}><Pencil size={15} /></button>
                    <button onClick={() => removeItem("incomes", i.id)} style={{ color: "var(--expense)" }}><Trash2 size={15} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ============================== DÍVIDAS ============================== */

function Dividas({ data, setModal, updateItem, removeItem }) {
  return (
    <div>
      <SectionHeader title="Dívidas" onAdd={() => setModal({ type: "debt" })} addLabel="Nova dívida" />
      {data.debts.length === 0 ? <EmptyState text="Nenhuma dívida cadastrada. Que bom!" /> : (
        <ul className="flex flex-col gap-3">
          {data.debts.map((d) => {
            const paidValue = d.originalValue - d.currentValue;
            const percent = d.originalValue > 0 ? (paidValue / d.originalValue) * 100 : 0;
            const quitada = d.paidInstallments >= d.totalInstallments;
            return (
              <li key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span style={{ color: "var(--text)" }} className="font-semibold">{d.name}</span>
                    <div style={{ color: "var(--text-muted)" }} className="text-xs">{d.creditor}</div>
                  </div>
                  <Badge tone={d.status === "Quitada" ? "income" : d.status === "Atrasada" ? "expense" : "warning"}>{d.status}</Badge>
                </div>
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Pago: {formatBRL(paidValue)}</span>
                  <span>Restante: {formatBRL(d.currentValue)}</span>
                </div>
                <ProgressBar percent={percent} tone="income" />
                <div className="flex items-center justify-between mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{d.paidInstallments}/{d.totalInstallments} parcelas · {formatBRL(d.installmentValue)}/mês</span>
                  <span>{percent.toFixed(0)}% quitado</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {!quitada && (
                    <PrimaryButton onClick={() => {
                      const newPaid = d.paidInstallments + 1;
                      const newCurrent = Math.max(0, d.currentValue - d.installmentValue);
                      updateItem("debts", d.id, {
                        paidInstallments: newPaid,
                        currentValue: newCurrent,
                        status: newPaid >= d.totalInstallments ? "Quitada" : "Em pagamento",
                      });
                    }}>Registrar pagamento</PrimaryButton>
                  )}
                  <GhostButton onClick={() => setModal({ type: "debt", payload: d })}>Editar</GhostButton>
                  <button onClick={() => removeItem("debts", d.id)} style={{ color: "var(--expense)" }}><Trash2 size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================== CARTÕES ============================== */

function Cartoes({ data, setModal, removeItem, month, year }) {
  const [openCard, setOpenCard] = useState(null);
  return (
    <div>
      <SectionHeader title="Cartões de crédito" onAdd={() => setModal({ type: "card" })} addLabel="Novo cartão" />
      {data.cards.length === 0 ? <EmptyState text="Nenhum cartão cadastrado." /> : (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {data.cards.map((c) => {
            const used = cardUsedLimit(c.id, data.cardTransactions);
            const available = Math.max(0, c.limit - used);
            const fatura = getCardInstallmentsForMonth(data.cardTransactions.filter((t) => t.cardId === c.id), month, year).reduce((s, t) => s + t.effectiveValue, 0);
            return (
              <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ background: c.color }} className="w-3 h-3 rounded-full" />
                    <span style={{ color: "var(--text)" }} className="font-semibold">{c.name}</span>
                  </div>
                  <button onClick={() => removeItem("cards", c.id)} style={{ color: "var(--expense)" }}><Trash2 size={15} /></button>
                </div>
                <div style={{ color: "var(--text-muted)" }} className="text-xs mb-2">{c.bank} · fecha dia {c.closingDay}, vence dia {c.dueDay}</div>
                <ProgressBar percent={(used / (c.limit || 1)) * 100} tone="expense" />
                <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  <span>Usado {formatBRL(used)}</span>
                  <span>Disponível {formatBRL(available)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span style={{ color: "var(--text)" }} className="text-sm">Fatura deste mês: <b style={{ color: "var(--expense)" }}>{formatBRL(fatura)}</b></span>
                  <GhostButton onClick={() => setOpenCard(openCard === c.id ? null : c.id)}>{openCard === c.id ? "Ocultar" : "Ver compras"}</GhostButton>
                </div>
                {openCard === c.id && (
                  <ul className="mt-3 flex flex-col gap-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                    {data.cardTransactions.filter((t) => t.cardId === c.id).length === 0 && <EmptyState text="Nenhuma compra registrada." />}
                    {data.cardTransactions.filter((t) => t.cardId === c.id).map((t) => (
                      <li key={t.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div style={{ color: "var(--text)" }} className="truncate">{t.description}</div>
                          <div style={{ color: "var(--text-muted)" }} className="text-xs">{t.category} · {formatDateBR(t.date)} · {t.installments}x</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span style={{ color: "var(--expense)" }} className="font-medium">{formatBRL(t.value)}</span>
                          <button onClick={() => removeItem("cardTransactions", t.id)} style={{ color: "var(--expense)" }}><Trash2 size={14} /></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
      {data.cards.length > 0 && <PrimaryButton onClick={() => setModal({ type: "cardTransaction" })}>Nova compra no cartão</PrimaryButton>}
    </div>
  );
}

/* ============================== ORÇAMENTOS ============================== */

function Orcamentos({ data, summary, setData }) {
  const [cat, setCat] = useState(data.categories[0] || "Outros");
  const [limit, setLimit] = useState("");

  const spentByCategory = {};
  summary.expenses.forEach((e) => { spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.effectiveValue; });

  function addBudget() {
    if (!limit || Number(limit) <= 0) return;
    setData((d) => ({ ...d, budgets: [...d.budgets.filter((b) => b.category !== cat), { category: cat, limit: Number(limit) }] }));
    setLimit("");
  }
  function removeBudget(category) {
    setData((d) => ({ ...d, budgets: d.budgets.filter((b) => b.category !== category) }));
  }

  return (
    <div>
      <SectionHeader title="Orçamento por categoria" />
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <Field label="Categoria">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>{data.categories.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
        </div>
        <div className="flex-1 min-w-[120px]">
          <Field label="Limite mensal">
            <TextInput type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0,00" />
          </Field>
        </div>
        <PrimaryButton onClick={addBudget}>Definir</PrimaryButton>
      </div>

      {data.budgets.length === 0 ? <EmptyState text="Nenhum orçamento definido ainda." /> : (
        <ul className="flex flex-col gap-3">
          {data.budgets.map((b) => {
            const spent = spentByCategory[b.category] || 0;
            const percent = (spent / b.limit) * 100;
            const tone = percent >= 100 ? "expense" : percent >= 90 ? "expense" : percent >= 70 ? "warning" : "income";
            return (
              <li key={b.category} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "var(--text)" }} className="font-medium">{b.category}</span>
                  <button onClick={() => removeBudget(b.category)} style={{ color: "var(--expense)" }}><Trash2 size={14} /></button>
                </div>
                <ProgressBar percent={percent} tone={tone} />
                <div className="flex items-center justify-between mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{formatBRL(spent)} de {formatBRL(b.limit)}</span>
                  <span style={{ color: percent >= 90 ? "var(--expense)" : percent >= 70 ? "var(--warning)" : "var(--text-muted)" }}>{percent.toFixed(1)}% utilizado</span>
                </div>
                {percent >= 100 && <p style={{ color: "var(--expense)" }} className="text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Orçamento estourado</p>}
                {percent >= 90 && percent < 100 && <p style={{ color: "var(--warning)" }} className="text-xs mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Quase no limite</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================== METAS ============================== */

function Metas({ data, setModal, updateItem, removeItem }) {
  return (
    <div>
      <SectionHeader title="Metas financeiras" onAdd={() => setModal({ type: "goal" })} addLabel="Nova meta" />
      {data.goals.length === 0 ? <EmptyState text="Nenhuma meta cadastrada." /> : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {data.goals.map((g) => {
            const percent = (g.currentValue / g.targetValue) * 100;
            const restante = Math.max(0, g.targetValue - g.currentValue);
            return (
              <li key={g.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "var(--text)" }} className="font-semibold">{g.name}</span>
                  <button onClick={() => removeItem("goals", g.id)} style={{ color: "var(--expense)" }}><Trash2 size={14} /></button>
                </div>
                <div style={{ color: "var(--text-muted)" }} className="text-xs mb-2">Objetivo: {formatDateBR(g.targetDate)}</div>
                <ProgressBar percent={percent} />
                <div className="flex items-center justify-between mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{formatBRL(g.currentValue)} de {formatBRL(g.targetValue)}</span>
                  <span>{percent.toFixed(0)}%</span>
                </div>
                <p style={{ color: "var(--text-muted)" }} className="text-xs mt-1">Faltam {formatBRL(restante)}</p>
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Adicionar valor"
                    style={inputStyle}
                    className="rounded-lg px-2 py-1.5 text-xs w-full outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        updateItem("goals", g.id, { currentValue: g.currentValue + Number(e.currentTarget.value) });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================== CALENDÁRIO ============================== */

function CalendarioView({ data, month, year, setMonth, setYear }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const events = {};
  function pushEvent(day, label, tone) {
    if (!events[day]) events[day] = [];
    events[day].push({ label, tone });
  }
  getEffectiveExpenses(data.expenses, month, year).forEach((e) => {
    if (!e.dueDate) return;
    const d = Number(e.dueDate.split("-")[2]);
    const overdue = !e.paid && e.dueDate < todayISO();
    pushEvent(d, e.name, e.paid ? "income" : overdue ? "expense" : "warning");
  });
  getEffectiveIncomes(data.incomes, month, year).forEach((i) => {
    const d = Number(i.date.split("-")[2]);
    pushEvent(d, i.name, "income");
  });
  data.cards.forEach((c) => {
    const fatura = getCardInstallmentsForMonth(data.cardTransactions.filter((t) => t.cardId === c.id), month, year).reduce((s, t) => s + t.effectiveValue, 0);
    if (fatura > 0) pushEvent(clamp(c.dueDay, 1, daysInMonth), `Fatura ${c.name}`, "warning");
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ color: "var(--text)" }} className="text-lg font-semibold">Calendário financeiro</h2>
        <MonthSwitcher month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} style={{ color: "var(--text-muted)" }} className="text-xs font-medium">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div key={i} style={{ background: d ? "var(--surface)" : "transparent", border: d ? "1px solid var(--border)" : "none", minHeight: 58 }} className="rounded-lg p-1 text-left">
            {d && (
              <>
                <span style={{ color: "var(--text)" }} className="text-xs font-medium">{d}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {(events[d] || []).slice(0, 3).map((ev, k) => (
                    <span key={k} title={ev.label} style={{ background: `var(--${ev.tone})` }} className="w-1.5 h-1.5 rounded-full" />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1"><span style={{ background: "var(--income)" }} className="w-2 h-2 rounded-full" /> Pago / recebimento</span>
        <span className="flex items-center gap-1"><span style={{ background: "var(--warning)" }} className="w-2 h-2 rounded-full" /> Pendente / vencendo</span>
        <span className="flex items-center gap-1"><span style={{ background: "var(--expense)" }} className="w-2 h-2 rounded-full" /> Atrasado</span>
      </div>
    </div>
  );
}

/* ============================== RESERVA DE EMERGÊNCIA ============================== */

function ReservaEmergencia({ data, summary }) {
  const [months, setMonths] = useState(6);
  const [current, setCurrent] = useState(() => {
    const g = data.goals.find((g) => g.name.toLowerCase().includes("reserva"));
    return g ? g.currentValue : 0;
  });
  const essentialCategories = ["Moradia", "Aluguel", "Condomínio", "Água", "Energia", "Internet", "Telefone", "Alimentação", "Mercado", "Saúde", "Farmácia", "Transporte", "Combustível"];
  const essentialMonthly = summary.expenses.filter((e) => essentialCategories.includes(e.category)).reduce((s, e) => s + e.effectiveValue, 0);
  const recommended = essentialMonthly * months;
  const missing = Math.max(0, recommended - current);

  return (
    <div>
      <SectionHeader title="Reserva de emergência" />
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <Field label="Meses de cobertura desejados">
          <div className="flex gap-2">
            {[3, 6, 12].map((m) => (
              <button key={m} onClick={() => setMonths(m)} style={{ background: months === m ? "var(--primary)" : "var(--surface-alt)", color: months === m ? "var(--primary-contrast)" : "var(--text)" }} className="rounded-lg px-4 py-2 text-sm font-medium flex-1">{m} meses</button>
            ))}
          </div>
        </Field>
        <Field label="Valor já guardado">
          <TextInput type="number" value={current} onChange={(e) => setCurrent(Number(e.target.value))} />
        </Field>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <StatCard label="Gastos essenciais/mês" value={formatBRL(essentialMonthly)} />
          <StatCard label="Reserva recomendada" value={formatBRL(recommended)} tone="income" />
          <StatCard label="Ainda falta" value={formatBRL(missing)} tone="warning" />
        </div>
        <div className="mt-4">
          <ProgressBar percent={(current / (recommended || 1)) * 100} />
        </div>
      </div>
    </div>
  );
}

/* ============================== RELATÓRIOS ============================== */

function Relatorios({ data, year, exportCSV }) {
  const monthly = MONTHS_SHORT.map((label, m) => {
    const inc = getEffectiveIncomes(data.incomes, m, year).reduce((s, x) => s + x.effectiveValue, 0);
    const exp = getEffectiveExpenses(data.expenses, m, year).reduce((s, x) => s + x.effectiveValue, 0) +
      getCardInstallmentsForMonth(data.cardTransactions, m, year).reduce((s, x) => s + x.effectiveValue, 0);
    return { mes: label, Receitas: Math.round(inc), Despesas: Math.round(exp), Saldo: Math.round(inc - exp) };
  });

  const totalReceita = monthly.reduce((s, m) => s + m.Receitas, 0);
  const totalDespesa = monthly.reduce((s, m) => s + m.Despesas, 0);
  const totalDividasPagas = data.debts.reduce((s, d) => s + (d.originalValue - d.currentValue), 0);
  const totalCartao = data.cardTransactions.reduce((s, t) => s + Number(t.value), 0);
  const economiaTotal = monthly.reduce((s, m) => s + Math.max(0, m.Saldo), 0);
  const melhorMes = monthly.reduce((a, b) => (b.Saldo > a.Saldo ? b : a), monthly[0]);
  const piorMes = monthly.reduce((a, b) => (b.Despesas > a.Despesas ? b : a), monthly[0]);

  const catTotals = {};
  for (let m = 0; m < 12; m++) {
    getEffectiveExpenses(data.expenses, m, year).forEach((e) => { catTotals[e.category] = (catTotals[e.category] || 0) + e.effectiveValue; });
  }
  const pieData = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  const debtEvolution = data.debts.length > 0 ? monthly.map((m, idx) => ({ mes: m.mes, Dívidas: Math.round(data.debts.reduce((s, d) => s + Number(d.currentValue), 0) - idx * (data.debts.reduce((s, d) => s + Number(d.installmentValue), 0))) })) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader title={`Relatório anual ${year}`} />
        <button onClick={exportCSV} style={{ background: "var(--surface-alt)", color: "var(--text)" }} className="rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1 -mt-3"><Download size={14} /> Exportar mês (CSV)</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Receita total do ano" value={formatBRL(totalReceita)} tone="income" />
        <StatCard label="Despesas totais" value={formatBRL(totalDespesa)} tone="expense" />
        <StatCard label="Pago em dívidas" value={formatBRL(totalDividasPagas)} tone="income" />
        <StatCard label="Gasto em cartão" value={formatBRL(totalCartao)} tone="expense" />
        <StatCard label="Economia total" value={formatBRL(economiaTotal)} tone="income" />
        <StatCard label="Média mensal de gastos" value={formatBRL(totalDespesa / 12)} />
        <StatCard label="Melhor mês" value={melhorMes.mes} tone="income" sub={formatBRL(melhorMes.Saldo)} />
        <StatCard label="Mês com maiores gastos" value={piorMes.mes} tone="expense" sub={formatBRL(piorMes.Despesas)} />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Receitas x despesas por mês</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v) => formatBRL(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Receitas" fill="var(--income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="var(--expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Distribuição dos gastos</h3>
          {pieData.length === 0 ? <EmptyState text="Sem dados suficientes." /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Evolução do saldo mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v) => formatBRL(v)} />
              <Line type="monotone" dataKey="Saldo" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {debtEvolution.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
          <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Evolução das dívidas (estimativa)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={debtEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip formatter={(v) => formatBRL(v)} />
              <Line type="monotone" dataKey="Dívidas" stroke="var(--expense)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ============================== BUSCA ============================== */

function SearchResults({ data, query, onClear }) {
  const q = query.toLowerCase();
  const incomes = data.incomes.filter((i) => i.name.toLowerCase().includes(q));
  const expenses = data.expenses.filter((e) => e.name.toLowerCase().includes(q));
  const debts = data.debts.filter((d) => d.name.toLowerCase().includes(q));
  const cards = data.cards.filter((c) => c.name.toLowerCase().includes(q));
  const purchases = data.cardTransactions.filter((t) => t.description.toLowerCase().includes(q));
  const nothing = ![incomes, expenses, debts, cards, purchases].some((a) => a.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ color: "var(--text)" }} className="text-lg font-semibold">Resultados para "{query}"</h2>
        <button onClick={onClear} style={{ color: "var(--text-muted)" }}><X size={18} /></button>
      </div>
      {nothing && <EmptyState text="Nada encontrado." />}
      {[["Receitas", incomes, "income"], ["Despesas", expenses, "expense"], ["Dívidas", debts, "expense"], ["Cartões", cards, "neutral"], ["Compras no cartão", purchases, "expense"]].map(([label, arr, tone]) => arr.length > 0 && (
        <div key={label} className="mb-4">
          <h3 style={{ color: "var(--text-muted)" }} className="text-xs font-semibold uppercase tracking-wide mb-1">{label}</h3>
          <ul className="flex flex-col gap-1.5">
            {arr.map((item) => (
              <li key={item.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-2.5 flex items-center justify-between text-sm">
                <span style={{ color: "var(--text)" }}>{item.name || item.description}</span>
                <span style={{ color: `var(--${tone === "neutral" ? "text-muted" : tone})` }} className="font-medium">{formatBRL(item.value ?? item.totalValue ?? item.currentValue ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ============================== CONFIGURAÇÕES ============================== */

function ConfiguracoesView({ settings, setSettings, data, setData, exportBackup, importBackup }) {
  const fileRef = useRef(null);
  const [newCategory, setNewCategory] = useState("");

  function addCategory() {
    if (!newCategory.trim() || data.categories.includes(newCategory.trim())) return;
    setData((d) => ({ ...d, categories: [...d.categories, newCategory.trim()] }));
    setNewCategory("");
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <SectionHeader title="Configurações" />

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <Field label="Nome do usuário">
          <TextInput value={settings.userName} onChange={(e) => setSettings((s) => ({ ...s, userName: e.target.value }))} placeholder="Seu nome" />
        </Field>
        <Field label="Moeda">
          <TextInput value="Real brasileiro (BRL)" disabled />
        </Field>
        <Field label="Dia de início do ciclo financeiro">
          <TextInput type="number" min={1} max={28} value={settings.cycleStartDay} onChange={(e) => setSettings((s) => ({ ...s, cycleStartDay: Number(e.target.value) }))} />
        </Field>
        <Field label="Tema">
          <Select value={settings.theme} onChange={(e) => setSettings((s) => ({ ...s, theme: e.target.value }))}>
            <option value="auto">Automático (aparelho)</option>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </Select>
        </Field>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Categorias</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.categories.map((c) => <Badge key={c}>{c}</Badge>)}
        </div>
        <div className="flex gap-2">
          <TextInput value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nova categoria" />
          <PrimaryButton onClick={addCategory}>Adicionar</PrimaryButton>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-3">Backup</h3>
        <div className="flex gap-2 flex-wrap">
          <GhostButton onClick={exportBackup}><span className="flex items-center gap-1.5"><Download size={14} /> Exportar backup</span></GhostButton>
          <GhostButton onClick={() => fileRef.current?.click()}><span className="flex items-center gap-1.5"><Upload size={14} /> Importar backup</span></GhostButton>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
        </div>
        <p style={{ color: "var(--text-muted)" }} className="text-xs mt-2">O backup é um arquivo JSON com todos os seus dados. Guarde-o em local seguro.</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-xl p-4">
        <h3 style={{ color: "var(--text)" }} className="text-sm font-semibold mb-2">Zona de risco</h3>
        <PrimaryButton danger onClick={() => { if (window.confirm("Isso vai apagar todos os dados. Deseja continuar?")) setData(emptyData()); }}>Limpar todos os dados</PrimaryButton>
      </div>
    </div>
  );
}

/* ============================== MODAIS DE CADASTRO ============================== */

function IncomeModal({ payload, onClose, addItem, updateItem }) {
  const editing = !!payload;
  const [f, setF] = useState(payload || { name: "", category: INCOME_CATEGORIES[0], value: "", date: todayISO(), recurring: false, frequency: "mensal", note: "" });
  const [error, setError] = useState("");

  function submit() {
    if (!f.name.trim() || !f.value || Number(f.value) <= 0) { setError("Preencha nome e valor corretamente."); return; }
    const payloadOut = { ...f, value: Number(f.value) };
    if (editing) updateItem("incomes", payload.id, payloadOut); else addItem("incomes", payloadOut);
    onClose();
  }

  return (
    <Modal title={editing ? "Editar receita" : "Nova receita"} onClose={onClose}>
      <Field label="Nome"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Salário" /></Field>
      <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{INCOME_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      <Field label="Valor"><TextInput type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} placeholder="0,00" /></Field>
      <Field label="Data de recebimento"><TextInput type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Tipo">
        <div className="flex gap-2">
          <button onClick={() => setF({ ...f, recurring: false })} style={{ background: !f.recurring ? "var(--primary)" : "var(--surface-alt)", color: !f.recurring ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Única</button>
          <button onClick={() => setF({ ...f, recurring: true })} style={{ background: f.recurring ? "var(--primary)" : "var(--surface-alt)", color: f.recurring ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Recorrente</button>
        </div>
      </Field>
      {f.recurring && (
        <Field label="Frequência">
          <Select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>
            <option value="mensal">Mensal</option><option value="quinzenal">Quinzenal</option><option value="semanal">Semanal</option><option value="anual">Anual</option>
          </Select>
        </Field>
      )}
      <Field label="Observação"><TextArea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}

function ExpenseModal({ data, payload, onClose, addItem, updateItem }) {
  const editing = !!payload;
  const [f, setF] = useState(payload || { name: "", totalValue: "", category: data.categories[0], date: todayISO(), dueDate: todayISO(), paymentMethod: PAYMENT_METHODS[0], paid: false, type: "variavel", recurring: false, frequency: "mensal", installments: 1, note: "" });
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    if (!f.name.trim() || !f.totalValue || Number(f.totalValue) <= 0) { setError("Preencha nome e valor corretamente."); return; }
    const payloadOut = { ...f, totalValue: Number(f.totalValue), installments: Number(f.installments) || 1 };
    if (editing) updateItem("expenses", payload.id, payloadOut); else addItem("expenses", payloadOut);
    onClose();
  }

  return (
    <Modal title={editing ? "Editar despesa" : "Nova despesa"} onClose={onClose}>
      <Field label="Descrição"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Aluguel" /></Field>
      <Field label="Valor"><TextInput type="number" value={f.totalValue} onChange={(e) => setF({ ...f, totalValue: e.target.value })} placeholder="0,00" /></Field>
      <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{data.categories.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      <Field label="Data"><TextInput type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Forma de pagamento"><Select value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}>{PAYMENT_METHODS.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      <Field label="Status">
        <div className="flex gap-2">
          <button onClick={() => setF({ ...f, paid: false })} style={{ background: !f.paid ? "var(--warning)" : "var(--surface-alt)", color: !f.paid ? "#1A1A1A" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Pendente</button>
          <button onClick={() => setF({ ...f, paid: true })} style={{ background: f.paid ? "var(--income)" : "var(--surface-alt)", color: f.paid ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Paga</button>
        </div>
      </Field>

      {!more ? (
        <button onClick={() => setMore(true)} style={{ color: "var(--primary)" }} className="text-xs font-semibold mb-3">Mais opções</button>
      ) : (
        <>
          <Field label="Data de vencimento"><TextInput type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
          <Field label="Tipo de despesa">
            <div className="flex gap-2">
              <button onClick={() => setF({ ...f, type: "fixa" })} style={{ background: f.type === "fixa" ? "var(--primary)" : "var(--surface-alt)", color: f.type === "fixa" ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Fixa</button>
              <button onClick={() => setF({ ...f, type: "variavel" })} style={{ background: f.type === "variavel" ? "var(--primary)" : "var(--surface-alt)", color: f.type === "variavel" ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Variável</button>
            </div>
          </Field>
          <Field label="Recorrente?">
            <div className="flex gap-2">
              <button onClick={() => setF({ ...f, recurring: false })} style={{ background: !f.recurring ? "var(--primary)" : "var(--surface-alt)", color: !f.recurring ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Não</button>
              <button onClick={() => setF({ ...f, recurring: true })} style={{ background: f.recurring ? "var(--primary)" : "var(--surface-alt)", color: f.recurring ? "var(--primary-contrast)" : "var(--text)" }} className="flex-1 rounded-lg py-2 text-sm font-medium">Sim</button>
            </div>
          </Field>
          <Field label="Número de parcelas (1 = à vista)"><TextInput type="number" min={1} value={f.installments} onChange={(e) => setF({ ...f, installments: e.target.value })} /></Field>
          <Field label="Observações"><TextArea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        </>
      )}
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}

function DebtModal({ payload, onClose, addItem, updateItem }) {
  const editing = !!payload;
  const [f, setF] = useState(payload || { name: "", creditor: "", originalValue: "", currentValue: "", installmentValue: "", totalInstallments: "", paidInstallments: 0, interestRate: "", dueDate: todayISO(), nextDate: todayISO(), status: "Em aberto", note: "" });
  const [error, setError] = useState("");

  function submit() {
    if (!f.name.trim() || !f.originalValue || !f.installmentValue || !f.totalInstallments) { setError("Preencha os campos obrigatórios."); return; }
    const payloadOut = {
      ...f,
      originalValue: Number(f.originalValue),
      currentValue: Number(f.currentValue || f.originalValue),
      installmentValue: Number(f.installmentValue),
      totalInstallments: Number(f.totalInstallments),
      paidInstallments: Number(f.paidInstallments) || 0,
      interestRate: Number(f.interestRate) || 0,
    };
    if (editing) updateItem("debts", payload.id, payloadOut); else addItem("debts", payloadOut);
    onClose();
  }

  return (
    <Modal title={editing ? "Editar dívida" : "Nova dívida"} onClose={onClose}>
      <Field label="Nome"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Empréstimo pessoal" /></Field>
      <Field label="Credor"><TextInput value={f.creditor} onChange={(e) => setF({ ...f, creditor: e.target.value })} placeholder="Ex: Banco" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor original"><TextInput type="number" value={f.originalValue} onChange={(e) => setF({ ...f, originalValue: e.target.value })} /></Field>
        <Field label="Valor atual"><TextInput type="number" value={f.currentValue} onChange={(e) => setF({ ...f, currentValue: e.target.value })} placeholder="Igual ao original se novo" /></Field>
        <Field label="Valor da parcela"><TextInput type="number" value={f.installmentValue} onChange={(e) => setF({ ...f, installmentValue: e.target.value })} /></Field>
        <Field label="Total de parcelas"><TextInput type="number" value={f.totalInstallments} onChange={(e) => setF({ ...f, totalInstallments: e.target.value })} /></Field>
        <Field label="Parcelas pagas"><TextInput type="number" value={f.paidInstallments} onChange={(e) => setF({ ...f, paidInstallments: e.target.value })} /></Field>
        <Field label="Taxa de juros (%)"><TextInput type="number" value={f.interestRate} onChange={(e) => setF({ ...f, interestRate: e.target.value })} /></Field>
      </div>
      <Field label="Próxima parcela"><TextInput type="date" value={f.nextDate} onChange={(e) => setF({ ...f, nextDate: e.target.value })} /></Field>
      <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{DEBT_STATUS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
      <Field label="Observações"><TextArea rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}

function CardModal({ payload, onClose, addItem, updateItem }) {
  const editing = !!payload;
  const [f, setF] = useState(payload || { name: "", bank: "", limit: "", closingDay: 20, dueDay: 27, color: CARD_COLORS[0] });
  const [error, setError] = useState("");

  function submit() {
    if (!f.name.trim() || !f.limit) { setError("Preencha nome e limite."); return; }
    const payloadOut = { ...f, limit: Number(f.limit), closingDay: Number(f.closingDay), dueDay: Number(f.dueDay) };
    if (editing) updateItem("cards", payload.id, payloadOut); else addItem("cards", payloadOut);
    onClose();
  }

  return (
    <Modal title={editing ? "Editar cartão" : "Novo cartão"} onClose={onClose}>
      <Field label="Nome"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Cartão Principal" /></Field>
      <Field label="Banco"><TextInput value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} /></Field>
      <Field label="Limite total"><TextInput type="number" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dia de fechamento"><TextInput type="number" min={1} max={31} value={f.closingDay} onChange={(e) => setF({ ...f, closingDay: e.target.value })} /></Field>
        <Field label="Dia de vencimento"><TextInput type="number" min={1} max={31} value={f.dueDay} onChange={(e) => setF({ ...f, dueDay: e.target.value })} /></Field>
      </div>
      <Field label="Cor">
        <div className="flex gap-2">
          {CARD_COLORS.map((c) => (
            <button key={c} onClick={() => setF({ ...f, color: c })} style={{ background: c, outline: f.color === c ? "2px solid var(--text)" : "none", outlineOffset: 2 }} className="w-7 h-7 rounded-full" />
          ))}
        </div>
      </Field>
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}

function CardTransactionModal({ data, payload, onClose, addItem }) {
  const [f, setF] = useState(payload || { cardId: data.cards[0]?.id || "", description: "", category: data.categories[0], value: "", date: todayISO(), installments: 1 });
  const [error, setError] = useState("");

  if (data.cards.length === 0) {
    return (
      <Modal title="Nova compra no cartão" onClose={onClose}>
        <EmptyState text="Cadastre um cartão antes de lançar uma compra." />
      </Modal>
    );
  }

  function submit() {
    if (!f.description.trim() || !f.value || Number(f.value) <= 0 || !f.cardId) { setError("Preencha os campos obrigatórios."); return; }
    addItem("cardTransactions", { ...f, value: Number(f.value), installments: Number(f.installments) || 1 });
    onClose();
  }

  const perInstallment = f.value && f.installments ? Number(f.value) / Number(f.installments) : 0;

  return (
    <Modal title="Nova compra no cartão" onClose={onClose}>
      <Field label="Cartão"><Select value={f.cardId} onChange={(e) => setF({ ...f, cardId: e.target.value })}>{data.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
      <Field label="Descrição"><TextInput value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex: Notebook" /></Field>
      <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{data.categories.map((c) => <option key={c}>{c}</option>)}</Select></Field>
      <Field label="Valor total"><TextInput type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} placeholder="0,00" /></Field>
      <Field label="Data da compra"><TextInput type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      <Field label="Número de parcelas"><TextInput type="number" min={1} value={f.installments} onChange={(e) => setF({ ...f, installments: e.target.value })} /></Field>
      {Number(f.installments) > 1 && f.value && (
        <p style={{ color: "var(--text-muted)" }} className="text-xs mb-3">{f.installments}x de {formatBRL(perInstallment)}</p>
      )}
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}

function GoalModal({ payload, onClose, addItem, updateItem }) {
  const editing = !!payload;
  const [f, setF] = useState(payload || { name: "", targetValue: "", currentValue: "", targetDate: todayISO() });
  const [error, setError] = useState("");

  function submit() {
    if (!f.name.trim() || !f.targetValue) { setError("Preencha nome e valor desejado."); return; }
    const payloadOut = { ...f, targetValue: Number(f.targetValue), currentValue: Number(f.currentValue) || 0 };
    if (editing) updateItem("goals", payload.id, payloadOut); else addItem("goals", payloadOut);
    onClose();
  }

  return (
    <Modal title={editing ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <Field label="Nome"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex: Viagem" /></Field>
      <Field label="Valor desejado"><TextInput type="number" value={f.targetValue} onChange={(e) => setF({ ...f, targetValue: e.target.value })} /></Field>
      <Field label="Valor já acumulado"><TextInput type="number" value={f.currentValue} onChange={(e) => setF({ ...f, currentValue: e.target.value })} /></Field>
      <Field label="Data objetivo"><TextInput type="date" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} /></Field>
      {error && <p style={{ color: "var(--expense)" }} className="text-xs mb-2">{error}</p>}
      <PrimaryButton full onClick={submit}>Salvar</PrimaryButton>
    </Modal>
  );
}
