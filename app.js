const STORAGE_KEY = "northfarm-sales";
const ADMIN_KEY = "northfarm-admin";
const AUDIT_KEY = "northfarm-audit";
const DEFAULT_ADMIN_PASSWORD = "admin2024";

const form = document.getElementById("salesForm");
const saleDate = document.getElementById("saleDate");
const saleLocation = document.getElementById("saleLocation");
const saleAmount = document.getElementById("saleAmount");
const saleMemo = document.getElementById("saleMemo");
const dailyTable = document.getElementById("dailyTable");
const yearFilter = document.getElementById("yearFilter");
const yearlyTable = document.getElementById("yearlyTable");
const yearTotal = document.getElementById("yearTotal");
const closedTotal = document.getElementById("closedTotal");
const openTotal = document.getElementById("openTotal");
const closeDayButton = document.getElementById("closeDay");
const adminToggle = document.getElementById("adminToggle");
const roleLabel = document.getElementById("roleLabel");
const adminDialog = document.getElementById("adminDialog");
const adminPassword = document.getElementById("adminPassword");
const logDialog = document.getElementById("logDialog");
const auditLog = document.getElementById("auditLog");

const locations = ["클럽하우스", "스타트하우스", "동그늘집", "서그늘집"];

const state = {
  entries: [],
  closedDates: {},
  isAdmin: false,
  audit: [],
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);

const getYear = (dateString) => new Date(dateString).getFullYear();

const loadStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const adminRaw = localStorage.getItem(ADMIN_KEY);
  const auditRaw = localStorage.getItem(AUDIT_KEY);

  if (raw) {
    const parsed = JSON.parse(raw);
    state.entries = parsed.entries ?? [];
    state.closedDates = parsed.closedDates ?? {};
  }

  state.isAdmin = adminRaw === "true";
  state.audit = auditRaw ? JSON.parse(auditRaw) : [];
};

const persist = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ entries: state.entries, closedDates: state.closedDates })
  );
  localStorage.setItem(ADMIN_KEY, state.isAdmin ? "true" : "false");
  localStorage.setItem(AUDIT_KEY, JSON.stringify(state.audit.slice(0, 200)));
};

const addAudit = (action, detail) => {
  state.audit.unshift({
    action,
    detail,
    timestamp: new Date().toLocaleString("ko-KR"),
  });
  persist();
};

const isDateClosed = (date) => Boolean(state.closedDates[date]);

const renderDaily = () => {
  dailyTable.innerHTML = "";

  if (state.entries.length === 0) {
    dailyTable.innerHTML = `<tr><td colspan="6">등록된 매출이 없습니다.</td></tr>`;
    return;
  }

  const sorted = [...state.entries].sort((a, b) =>
    a.date === b.date ? a.location.localeCompare(b.location) : b.date.localeCompare(a.date)
  );

  sorted.forEach((entry) => {
    const closed = isDateClosed(entry.date);
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.location}</td>
      <td class="right">${formatCurrency(entry.amount)}</td>
      <td>${entry.memo || "-"}</td>
      <td>${closed ? "마감" : "열림"}</td>
      <td class="actions-cell"></td>
    `;

    const actionsCell = row.querySelector(".actions-cell");
    const logButton = document.createElement("button");
    logButton.textContent = "로그";
    logButton.className = "secondary";
    logButton.addEventListener("click", () => openLog());
    actionsCell.appendChild(logButton);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";
    deleteButton.className = "danger";
    deleteButton.disabled = closed && !state.isAdmin;
    deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    actionsCell.appendChild(deleteButton);

    if (closed && state.isAdmin) {
      const reopenButton = document.createElement("button");
      reopenButton.textContent = "마감 해제";
      reopenButton.className = "secondary";
      reopenButton.addEventListener("click", () => reopenDate(entry.date));
      actionsCell.appendChild(reopenButton);
    }

    dailyTable.appendChild(row);
  });
};

const renderYearOptions = () => {
  const years = new Set(state.entries.map((entry) => getYear(entry.date)));
  if (years.size === 0) {
    years.add(new Date().getFullYear());
  }
  yearFilter.innerHTML = "";
  [...years].sort((a, b) => b - a).forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year}년`;
    yearFilter.appendChild(option);
  });
};

const renderYearSummary = () => {
  const selectedYear = Number(yearFilter.value);
  const filtered = state.entries.filter((entry) => getYear(entry.date) === selectedYear);

  const totals = locations.map((loc) => {
    const locEntries = filtered.filter((entry) => entry.location === loc);
    const total = locEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const closed = locEntries
      .filter((entry) => isDateClosed(entry.date))
      .reduce((sum, entry) => sum + entry.amount, 0);
    const open = total - closed;
    return { loc, total, closed, open };
  });

  yearlyTable.innerHTML = "";
  totals.forEach(({ loc, total, closed, open }) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${loc}</td>
      <td class="right">${formatCurrency(total)}</td>
      <td class="right">${formatCurrency(closed)}</td>
      <td class="right">${formatCurrency(open)}</td>
    `;
    yearlyTable.appendChild(row);
  });

  const totalAll = totals.reduce((sum, item) => sum + item.total, 0);
  const totalClosed = totals.reduce((sum, item) => sum + item.closed, 0);
  const totalOpen = totals.reduce((sum, item) => sum + item.open, 0);

  yearTotal.textContent = formatCurrency(totalAll);
  closedTotal.textContent = formatCurrency(totalClosed);
  openTotal.textContent = formatCurrency(totalOpen);
};

const renderRole = () => {
  roleLabel.textContent = state.isAdmin ? "관리자" : "일반 사용자";
  adminToggle.textContent = state.isAdmin ? "관리자 모드 해제" : "관리자 모드 활성화";
};

const validateEntry = () => {
  if (!saleDate.value || !saleLocation.value || !saleAmount.value) {
    alert("날짜, 구분, 금액을 모두 입력해주세요.");
    return false;
  }

  if (Number(saleAmount.value) < 0) {
    alert("매출 금액은 0 이상이어야 합니다.");
    return false;
  }

  if (isDateClosed(saleDate.value)) {
    alert("마감된 날짜입니다. 관리자만 해제할 수 있습니다.");
    return false;
  }

  return true;
};

const handleSubmit = (event) => {
  event.preventDefault();
  if (!validateEntry()) return;

  const entry = {
    id: crypto.randomUUID(),
    date: saleDate.value,
    location: saleLocation.value,
    amount: Number(saleAmount.value),
    memo: saleMemo.value.trim(),
  };

  state.entries.push(entry);
  addAudit("등록", `${entry.date} ${entry.location} ${formatCurrency(entry.amount)}`);
  persist();
  form.reset();
  saleDate.value = entry.date;
  renderAll();
};

const closeDay = () => {
  const date = saleDate.value;
  if (!date) {
    alert("마감할 날짜를 선택하세요.");
    return;
  }
  if (isDateClosed(date)) {
    alert("이미 마감된 날짜입니다.");
    return;
  }
  if (!state.entries.some((entry) => entry.date === date)) {
    alert("해당 날짜에 등록된 매출이 없습니다.");
    return;
  }

  state.closedDates[date] = {
    closedAt: new Date().toISOString(),
    closedBy: state.isAdmin ? "admin" : "user",
  };
  addAudit("마감", `${date} 일매출 마감`);
  persist();
  renderAll();
};

const reopenDate = (date) => {
  if (!state.isAdmin) {
    alert("관리자만 마감 해제가 가능합니다.");
    return;
  }
  delete state.closedDates[date];
  addAudit("마감 해제", `${date} 일매출 마감 해제`);
  persist();
  renderAll();
};

const deleteEntry = (id) => {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;

  if (isDateClosed(entry.date) && !state.isAdmin) {
    alert("마감된 매출은 관리자만 삭제할 수 있습니다.");
    return;
  }

  if (!confirm("해당 매출을 삭제하시겠습니까?")) return;

  state.entries = state.entries.filter((item) => item.id !== id);
  addAudit("삭제", `${entry.date} ${entry.location} ${formatCurrency(entry.amount)}`);
  persist();
  renderAll();
};

const handleAdminToggle = () => {
  if (state.isAdmin) {
    state.isAdmin = false;
    persist();
    renderRole();
    return;
  }
  adminPassword.value = "";
  adminDialog.showModal();
};

adminDialog.addEventListener("close", () => {
  if (adminDialog.returnValue !== "confirm") return;
  if (adminPassword.value !== DEFAULT_ADMIN_PASSWORD) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }
  state.isAdmin = true;
  addAudit("관리자 로그인", "관리자 모드 활성화");
  persist();
  renderRole();
});

const openLog = () => {
  auditLog.innerHTML = "";
  state.audit.slice(0, 8).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.timestamp} - ${item.action}: ${item.detail}`;
    auditLog.appendChild(li);
  });
  logDialog.showModal();
};

const renderAll = () => {
  renderDaily();
  renderYearOptions();
  renderYearSummary();
  renderRole();
};

form.addEventListener("submit", handleSubmit);
closeDayButton.addEventListener("click", closeDay);
adminToggle.addEventListener("click", handleAdminToggle);
yearFilter.addEventListener("change", renderYearSummary);

const init = () => {
  saleDate.valueAsDate = new Date();
  loadStorage();
  renderAll();
};

init();
