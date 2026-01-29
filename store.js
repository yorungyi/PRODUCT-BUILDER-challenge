import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { renderAll } from './ui.js';

const ADMIN_KEY = "northfarm-admin";
const DEFAULT_ADMIN_PASSWORD = "admin2024";

// DOM Elements
const saleDate = document.getElementById("saleDate");
const saleLocation = document.getElementById("saleLocation");
const saleAmount = document.getElementById("saleAmount");
const saleMemo = document.getElementById("saleMemo");
const adminPassword = document.getElementById("adminPassword");
const adminDialog = document.getElementById("adminDialog");

let db;
export function setDB(database) {
    db = database;
}

export const state = {
    entries: [],
    closedDates: {},
    isAdmin: localStorage.getItem(ADMIN_KEY) === "true",
    audit: [], // 감사 로그는 클라이언트 측에서만 간단히 관리
};

// Firestore 데이터 실시간 수신
export async function listenForData() {
    if (!db) return;

    const entriesQuery = query(collection(db, "sales"), orderBy("date", "desc"));
    onSnapshot(entriesQuery, (snapshot) => {
        state.entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAll();
    });

    const closedDatesQuery = query(collection(db, "closedDates"));
    onSnapshot(closedDatesQuery, (snapshot) => {
        state.closedDates = {};
        snapshot.docs.forEach(doc => {
            state.closedDates[doc.id] = doc.data();
        });
        renderAll();
    });

    const auditQuery = query(collection(db, "audit"), orderBy("timestamp", "desc"), limit(200));
    onSnapshot(auditQuery, (snapshot) => {
        state.audit = snapshot.docs.map(doc => doc.data());
        // 감사 로그 UI는 필요 시 별도 렌더링
    });
}


function addAudit(action, detail) {
    if (!db) return;
    addDoc(collection(db, "audit"), {
        action,
        detail,
        timestamp: new Date(),
        user: state.isAdmin ? "admin" : "user",
    });
}

export function isDateClosed(date) {
    return Boolean(state.closedDates[date]);
}

function validateEntry() {
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
}

export async function handleFormSubmit(event) {
    event.preventDefault();
    if (!validateEntry() || !db) return;

    const entry = {
        date: saleDate.value,
        location: saleLocation.value,
        amount: Number(saleAmount.value),
        memo: saleMemo.value.trim(),
    };

    try {
        await addDoc(collection(db, "sales"), entry);
        addAudit("등록", `${entry.date} ${entry.location} ${new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(entry.amount)}`);
        document.getElementById("salesForm").reset();
        saleDate.value = entry.date; // 날짜 유지
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("매출 등록 중 오류가 발생했습니다.");
    }
}

export async function handleCloseDay() {
    const date = saleDate.value;
    if (!date || !db) {
        alert("마감할 날짜를 선택하세요.");
        return;
    }
    if (isDateClosed(date)) {
        alert("이미 마감된 날짜입니다.");
        return;
    }
    if (!state.entries.some(entry => entry.date === date)) {
        alert("해당 날짜에 등록된 매출이 없습니다.");
        return;
    }

    try {
        const batch = writeBatch(db);
        const closedDateRef = doc(db, "closedDates", date);
        batch.set(closedDateRef, { closedAt: new Date().toISOString(), closedBy: state.isAdmin ? "admin" : "user" });

        // 해당 날짜의 모든 매출 항목에 'closed' 플래그 추가 (선택적)
        // state.entries.filter(e => e.date === date).forEach(entry => {
        //     const entryRef = doc(db, "sales", entry.id);
        //     batch.update(entryRef, { closed: true });
        // });

        await batch.commit();
        addAudit("마감", `${date} 일매출 마감`);
    } catch (e) {
        console.error("Error closing day: ", e);
        alert("마감 처리 중 오류가 발생했습니다.");
    }
}

export async function reopenDate(date) {
    if (!state.isAdmin || !db) {
        alert("관리자만 마감 해제가 가능합니다.");
        return;
    }
    try {
        await deleteDoc(doc(db, "closedDates", date));
        addAudit("마감 해제", `${date} 일매출 마감 해제`);
    } catch (e) {
        console.error("Error reopening date: ", e);
        alert("마감 해제 중 오류가 발생했습니다.");
    }
}

export async function deleteEntry(id) {
    const entry = state.entries.find(item => item.id === id);
    if (!entry || !db) return;

    if (isDateClosed(entry.date) && !state.isAdmin) {
        alert("마감된 매출은 관리자만 삭제할 수 있습니다.");
        return;
    }

    if (!confirm("해당 매출을 삭제하시겠습니까?")) return;

    try {
        await deleteDoc(doc(db, "sales", id));
        addAudit("삭제", `${entry.date} ${entry.location} ${new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(entry.amount)}`);
    } catch (e) {
        console.error("Error deleting document: ", e);
        alert("삭제 중 오류가 발생했습니다.");
    }
}

export function handleAdminToggle() {
    if (state.isAdmin) {
        state.isAdmin = false;
        localStorage.setItem(ADMIN_KEY, "false");
        renderAll();
        return;
    }
    adminPassword.value = "";
    adminDialog.showModal();
}

adminDialog.addEventListener("close", () => {
    if (adminDialog.returnValue !== "confirm") return;
    if (adminPassword.value !== DEFAULT_ADMIN_PASSWORD) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }
    state.isAdmin = true;
    localStorage.setItem(ADMIN_KEY, "true");
    addAudit("관리자 로그인", "관리자 모드 활성화");
    renderAll();
});


export function setInitialDate() {
    saleDate.valueAsDate = new Date();
}

export function handleYearFilterChange() {
    renderAll();
}
