import { state, reopenDate, deleteEntry } from './store.js';
import { isAdmin, getCurrentUser } from './auth.js';

// DOM Elements
const dailyTable = document.getElementById("dailyTable");
const yearFilter = document.getElementById("yearFilter");
const yearlyTable = document.getElementById("yearlyTable");
const yearTotal = document.getElementById("yearTotal");
const closedTotal = document.getElementById("closedTotal");
const openTotal = document.getElementById("openTotal");
const roleLabel = document.getElementById("roleLabel");
const auditLog = document.getElementById("auditLog");
const logDialog = document.getElementById("logDialog");
const closeDayButton = document.getElementById("closeDay");

const locations = ["클럽하우스", "스타트하우스", "동그늘집", "서그늘집"];

function formatCurrency(value) {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value);
}

function getYear(dateString) {
    return new Date(dateString).getFullYear();
}

function renderDaily() {
    dailyTable.innerHTML = "";
    if (state.entries.length === 0) {
        dailyTable.innerHTML = `<tr><td colspan="6">등록된 매출이 없습니다.</td></tr>`;
        return;
    }

    state.entries.forEach(entry => {
        const closed = state.closedDates[entry.date];
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

        const deleteButton = document.createElement('custom-button');
        deleteButton.setAttribute('label', '삭제');
        deleteButton.setAttribute('variant', 'danger');
        
        if (closed && !isAdmin()) {
            deleteButton.setAttribute('disabled', '');
        }
        deleteButton.addEventListener("click", () => deleteEntry(entry.id));
        actionsCell.appendChild(deleteButton);

        if (closed && isAdmin()) {
            const reopenButton = document.createElement('custom-button');
            reopenButton.setAttribute('label', '마감 해제');
            reopenButton.setAttribute('variant', 'secondary');
            reopenButton.addEventListener("click", () => reopenDate(entry.date));
            actionsCell.appendChild(reopenButton);
        }

        dailyTable.appendChild(row);
    });
}

function renderYearOptions() {
    const years = new Set(state.entries.map(entry => getYear(entry.date)));
    if (years.size === 0) {
        years.add(new Date().getFullYear());
    }
    const currentYear = yearFilter.value || new Date().getFullYear();
    yearFilter.innerHTML = "";
    [...years].sort((a, b) => b - a).forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = `${year}년`;
        if (year == currentYear) {
            option.selected = true;
        }
        yearFilter.appendChild(option);
    });
}

function renderYearSummary() {
    const selectedYear = Number(yearFilter.value);
    if (!selectedYear) return;

    const filtered = state.entries.filter(entry => getYear(entry.date) === selectedYear);

    const totals = locations.map(loc => {
        const locEntries = filtered.filter(entry => entry.location === loc);
        const total = locEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const closed = locEntries.filter(entry => state.closedDates[entry.date]).reduce((sum, entry) => sum + entry.amount, 0);
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
}

function renderPermissions() {
    const user = getCurrentUser();
    if (user) {
        const roleText = user.role === 'admin' ? '관리자' : '스태프';
        roleLabel.textContent = `${user.username} (${roleText})`;
    }

    if (!isAdmin()) {
        closeDayButton.setAttribute('disabled', '');
    } else {
        closeDayButton.removeAttribute('disabled');
    }
}

export function openLog() {
    auditLog.innerHTML = "";
    if (!state.audit || state.audit.length === 0) {
        auditLog.innerHTML = '<li>기록이 없습니다.</li>';
        logDialog.showModal();
        return;
    }
    state.audit.slice(0, 15).forEach(item => {
        const li = document.createElement("li");
        const timestamp = item.timestamp.toDate ? item.timestamp.toDate().toLocaleString('ko-KR') : new Date(item.timestamp).toLocaleString('ko-KR');
        li.textContent = `${timestamp} - [${item.user}] ${item.action}: ${item.detail}`;
        auditLog.appendChild(li);
    });
    logDialog.showModal();
}

export function renderAll() {
    if (!state.user) return;
    renderDaily();
    renderYearOptions();
    renderYearSummary();
    renderPermissions();
}
