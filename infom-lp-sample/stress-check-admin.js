const message = document.querySelector("#adminMessage");
const totalResponses = document.querySelector("#totalResponses");
const exportTargetResponses = document.querySelector("#exportTargetResponses");
const mhlwReady = document.querySelector("#mhlwReady");
const minGroupSize = document.querySelector("#minGroupSize");
const groupRows = document.querySelector("#groupRows");
const suppressedRows = document.querySelector("#suppressedRows");
const invalidRows = document.querySelector("#invalidRows");
const duplicateRows = document.querySelector("#duplicateRows");
const auditRows = document.querySelector("#auditRows");
const securityRows = document.querySelector("#securityRows");
const adminKeyInput = document.querySelector("#adminKeyInput");
const participantSource = document.querySelector("#participantSource");
const participantRows = document.querySelector("#participantRows");
const participantMessage = document.querySelector("#participantMessage");
const participantChecks = document.querySelector("#participantChecks");
const generateParticipantUrls = document.querySelector("#generateParticipantUrls");
const downloadParticipantUrls = document.querySelector("#downloadParticipantUrls");
const downloadStatusCsv = document.querySelector("#downloadStatusCsv");
const downloadPendingCsv = document.querySelector("#downloadPendingCsv");
const downloadCompanySummaryCsv = document.querySelector("#downloadCompanySummaryCsv");
const printParticipantQrSheet = document.querySelector("#printParticipantQrSheet");
const printPendingQrSheet = document.querySelector("#printPendingQrSheet");
const participantQrSheet = document.querySelector("#participantQrSheet");
const googleCsvFile = document.querySelector("#googleCsvFile");
const basicInfoSource = document.querySelector("#basicInfoSource");
const previewGoogleCsv = document.querySelector("#previewGoogleCsv");
const importGoogleCsv = document.querySelector("#importGoogleCsv");
const downloadGoogleCsvTemplate = document.querySelector("#downloadGoogleCsvTemplate");
const downloadGoogleImportCheck = document.querySelector("#downloadGoogleImportCheck");
const downloadIndividualAnalysisCsv = document.querySelector("#downloadIndividualAnalysisCsv");
const downloadPersonalResultHtml = document.querySelector("#downloadPersonalResultHtml");
const downloadCompanyGroupHtml = document.querySelector("#downloadCompanyGroupHtml");
const downloadImplementationRecordHtml = document.querySelector("#downloadImplementationRecordHtml");
const downloadOperationLogCsv = document.querySelector("#downloadOperationLogCsv");
const loadSampleCsv = document.querySelector("#loadSampleCsv");
const googleImportMessage = document.querySelector("#googleImportMessage");
const basicInfoEditor = document.querySelector("#basicInfoEditor");
const legalOperationChecklist = document.querySelector("#legalOperationChecklist");
const implementationOperator = document.querySelector("#implementationOperator");
const interviewContact = document.querySelector("#interviewContact");
const interviewDeadline = document.querySelector("#interviewDeadline");
const completionChecklist = document.querySelector("#completionChecklist");
const googleImportPreview = document.querySelector("#googleImportPreview");
const individualAnalysisPreview = document.querySelector("#individualAnalysisPreview");
const reloadStoredResponses = document.querySelector("#reloadStoredResponses");
const downloadResponseAdminCsv = document.querySelector("#downloadResponseAdminCsv");
const responseAdminMessage = document.querySelector("#responseAdminMessage");
const responseAdminRows = document.querySelector("#responseAdminRows");
const isPublicStaticPage = location.hostname.endsWith("github.io");
let generatedParticipants = [];
let googleImportRows = [];
let googleImportDiagnostics = null;
let storedResponses = [];
let qrAvailable = false;
let submittedMap = new Map();
let submittedCodeMap = new Map();
let operationLog = [];
let currentRunId = "";

const localSettingsKey = "stressCheckAdminOperationSettings";

const questionOrder = [
  ...Array.from({ length: 17 }, (_, index) => `A${index + 1}`),
  ...Array.from({ length: 29 }, (_, index) => `B${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `C${index + 1}`),
  ...Array.from({ length: 2 }, (_, index) => `D${index + 1}`),
];

const googleCsvTemplateHeaders = [
  "タイムスタンプ",
  "受検者ID",
  "受検コード",
  "会社名・事業所名",
  "部署",
  "職場コード",
  "職場名",
  "変数値",
  ...questionOrder,
  "個人情報の扱いの確認",
  "回答内容の確認",
];

const mhlwScaleDefinitions = [
  { id: "A_QUANTITY", domain: "A", label: "心理的な仕事の負担（量）", direction: "badHigh", raw: (a) => 15 - (a.A1 + a.A2 + a.A3), ranges: { male: [[3, 5], [6, 7], [8, 9], [10, 11], [12, 12]], female: [[3, 4], [5, 6], [7, 9], [10, 11], [12, 12]] } },
  { id: "A_QUALITY", domain: "A", label: "心理的な仕事の負担（質）", direction: "badHigh", raw: (a) => 15 - (a.A4 + a.A5 + a.A6), ranges: { male: [[3, 5], [6, 7], [8, 9], [10, 11], [12, 12]], female: [[3, 4], [5, 6], [7, 8], [9, 10], [11, 12]] } },
  { id: "A_PHYSICAL", domain: "A", label: "自覚的な身体的負担度", direction: "badHigh", raw: (a) => 5 - a.A7, ranges: { male: [[1, 1], [2, 2], [3, 3], [4, 4]], female: [[1, 1], [2, 2], [3, 3], [4, 4]] } },
  { id: "A_RELATIONS", domain: "A", label: "職場の対人関係でのストレス", direction: "badHigh", raw: (a) => 10 - (a.A12 + a.A13) + a.A14, ranges: { male: [[3, 3], [4, 5], [6, 7], [8, 9], [10, 12]], female: [[3, 3], [4, 5], [6, 7], [8, 9], [10, 12]] } },
  { id: "A_ENVIRONMENT", domain: "A", label: "職場環境によるストレス", direction: "badHigh", raw: (a) => 5 - a.A15, ranges: { male: [[1, 1], [2, 2], [3, 3], [4, 4]], female: [[1, 1], [2, 2], [3, 3], [4, 4]] } },
  { id: "A_CONTROL", domain: "A", label: "仕事のコントロール度", direction: "goodHigh", raw: (a) => 15 - (a.A8 + a.A9 + a.A10), ranges: { male: [[3, 4], [5, 6], [7, 8], [9, 10], [11, 12]], female: [[3, 3], [4, 5], [6, 8], [9, 10], [11, 12]] } },
  { id: "A_SKILL", domain: "A", label: "技能の活用度", direction: "goodHigh", raw: (a) => a.A11, ranges: { male: [[1, 1], [2, 2], [3, 3], [4, 4]], female: [[1, 1], [2, 2], [3, 3], [4, 4]] } },
  { id: "A_FIT", domain: "A", label: "仕事の適性度", direction: "goodHigh", raw: (a) => 5 - a.A16, ranges: { male: [[1, 1], [2, 2], [3, 3], [4, 4]], female: [[1, 1], [2, 2], [3, 3], [4, 4]] } },
  { id: "A_REWARD", domain: "A", label: "働きがい", direction: "goodHigh", raw: (a) => 5 - a.A17, ranges: { male: [[1, 1], [2, 2], [3, 3], [4, 4]], female: [[1, 1], [2, 2], [3, 3], [4, 4]] } },
  { id: "B_VIGOR", domain: "B", label: "活気", direction: "goodHigh", raw: (a) => a.B1 + a.B2 + a.B3, ranges: { male: [[3, 3], [4, 5], [6, 7], [8, 9], [10, 12]], female: [[3, 3], [4, 5], [6, 7], [8, 9], [10, 12]] } },
  { id: "B_IRRITATION", domain: "B", label: "イライラ感", direction: "badHigh", raw: (a) => a.B4 + a.B5 + a.B6, ranges: { male: [[3, 3], [4, 5], [6, 7], [8, 9], [10, 12]], female: [[3, 3], [4, 5], [6, 8], [9, 10], [11, 12]] } },
  { id: "B_FATIGUE", domain: "B", label: "疲労感", direction: "badHigh", raw: (a) => a.B7 + a.B8 + a.B9, ranges: { male: [[3, 3], [4, 4], [5, 7], [8, 10], [11, 12]], female: [[3, 3], [4, 5], [6, 8], [9, 11], [12, 12]] } },
  { id: "B_ANXIETY", domain: "B", label: "不安感", direction: "badHigh", raw: (a) => a.B10 + a.B11 + a.B12, ranges: { male: [[3, 3], [4, 4], [5, 7], [8, 9], [10, 12]], female: [[3, 3], [4, 4], [5, 7], [8, 10], [11, 12]] } },
  { id: "B_DEPRESSION", domain: "B", label: "抑うつ感", direction: "badHigh", raw: (a) => a.B13 + a.B14 + a.B15 + a.B16 + a.B17 + a.B18, ranges: { male: [[6, 6], [7, 8], [9, 12], [13, 16], [17, 24]], female: [[6, 6], [7, 8], [9, 12], [13, 17], [18, 24]] } },
  { id: "B_PHYSICAL", domain: "B", label: "身体愁訴", direction: "badHigh", raw: (a) => a.B19 + a.B20 + a.B21 + a.B22 + a.B23 + a.B24 + a.B25 + a.B26 + a.B27 + a.B28 + a.B29, ranges: { male: [[11, 11], [12, 15], [16, 21], [22, 26], [27, 44]], female: [[11, 13], [14, 17], [18, 23], [24, 29], [30, 44]] } },
  { id: "C_SUPERVISOR", domain: "C", label: "上司からのサポート", direction: "goodHigh", raw: (a) => 15 - (a.C1 + a.C4 + a.C7), ranges: { male: [[3, 4], [5, 6], [7, 8], [9, 10], [11, 12]], female: [[3, 3], [4, 5], [6, 7], [8, 10], [11, 12]] } },
  { id: "C_COWORKER", domain: "C", label: "同僚からのサポート", direction: "goodHigh", raw: (a) => 15 - (a.C2 + a.C5 + a.C8), ranges: { male: [[3, 5], [6, 7], [8, 9], [10, 11], [12, 12]], female: [[3, 5], [6, 7], [8, 9], [10, 11], [12, 12]] } },
  { id: "C_FAMILY", domain: "C", label: "家族・友人からのサポート", direction: "goodHigh", raw: (a) => 15 - (a.C3 + a.C6 + a.C9), ranges: { male: [[3, 6], [7, 8], [9, 9], [10, 11], [12, 12]], female: [[3, 6], [7, 8], [9, 9], [10, 11], [12, 12]] } },
  { id: "D_SATISFACTION", domain: "D", label: "仕事や生活の満足度", direction: "goodHigh", raw: (a) => 10 - (a.D1 + a.D2), ranges: { male: [[2, 3], [4, 4], [5, 6], [7, 7], [8, 8]], female: [[2, 3], [4, 4], [5, 6], [7, 7], [8, 8]] } },
];

const mhlwRiskDomains = {
  reaction: ["B_VIGOR", "B_IRRITATION", "B_FATIGUE", "B_ANXIETY", "B_DEPRESSION", "B_PHYSICAL"],
  factorsAndSupport: [
    "A_QUANTITY", "A_QUALITY", "A_PHYSICAL", "A_RELATIONS", "A_ENVIRONMENT", "A_CONTROL",
    "A_SKILL", "A_FIT", "A_REWARD", "C_SUPERVISOR", "C_COWORKER", "C_FAMILY",
  ],
};

const workStressJudgementCoefficients = {
  male: {
    quantityMean: 8.7,
    quantityCoef: 0.076,
    controlMean: 7.9,
    controlCoef: -0.089,
    supervisorMean: 7.6,
    supervisorCoef: -0.097,
    coworkerMean: 8.1,
    coworkerCoef: -0.097,
  },
  female: {
    quantityMean: 7.9,
    quantityCoef: 0.048,
    controlMean: 7.2,
    controlCoef: -0.056,
    supervisorMean: 6.6,
    supervisorCoef: -0.097,
    coworkerMean: 8.2,
    coworkerCoef: -0.097,
  },
};

adminKeyInput.value = sessionStorage.getItem("stressCheckAdminKey") || "";

function setMessage(text, type = "info") {
  message.className = `form-message ${type}`;
  message.textContent = text;
}

function getAdminKey() {
  return adminKeyInput.value.trim();
}

function adminHeaders() {
  const key = getAdminKey();
  return key ? { "X-Admin-Key": key } : {};
}

function applyAdminKeyToLinks() {
  const key = getAdminKey();
  document.querySelectorAll(".admin-api-link").forEach((link) => {
    const url = new URL(link.getAttribute("href"), location.href);
    if (key) {
      url.searchParams.set("adminKey", key);
    } else {
      url.searchParams.delete("adminKey");
    }
    link.href = `${url.pathname}${url.search}`;
  });
}

function renderEmpty(target, text) {
  target.innerHTML = `<div class="suppressed-item">${text}</div>`;
}

function renderSummary(summary) {
  qrAvailable = Boolean(summary.qrAvailable);
  submittedMap = new Map((summary.submittedParticipants || [])
    .filter((item) => item.respondentId)
    .map((item) => [item.respondentId, item.submittedAt]));
  submittedCodeMap = new Map((summary.submittedParticipants || [])
    .filter((item) => item.participantCode)
    .map((item) => [item.participantCode, item.submittedAt]));
  totalResponses.textContent = summary.totalResponses;
  exportTargetResponses.textContent = summary.exportTargetResponses ?? summary.totalResponses;
  mhlwReady.textContent = summary.mhlwImportReady;
  minGroupSize.textContent = summary.groupSummary.minGroupSize;

  const groups = summary.groupSummary.visibleGroups;
  if (!groups.length) {
    groupRows.innerHTML = `<tr><td colspan="6">表示できる集団分析はありません。</td></tr>`;
  } else {
    groupRows.innerHTML = groups
      .map((group) => `
        <tr>
          <td>${group.group}</td>
          <td>${group.count}</td>
          <td>${group.averages.A ?? "-"}</td>
          <td>${group.averages.B ?? "-"}</td>
          <td>${group.averages.C ?? "-"}</td>
          <td>${group.averages.D ?? "-"}</td>
        </tr>
      `)
      .join("");
  }

  const suppressed = summary.groupSummary.suppressedGroups;
  if (!suppressed.length) {
    renderEmpty(suppressedRows, "非表示の集団はありません。");
  } else {
    suppressedRows.innerHTML = suppressed
      .map((group) => `<div class="suppressed-item"><strong>${group.group}</strong><span>${group.count}人 / ${group.reason}</span></div>`)
      .join("");
  }

  const invalid = summary.invalidRecords;
  if (!invalid.length) {
    renderEmpty(invalidRows, "CSV取込に必要な項目の不足はありません。");
  } else {
    invalidRows.innerHTML = invalid
      .map((record) => `<div class="suppressed-item"><strong>${record.respondentId || record.submissionId}</strong><span>不足: ${record.missing.join(", ")}</span></div>`)
      .join("");
  }

  const duplicates = summary.duplicateSubmissions || [];
  if (!duplicates.length) {
    renderEmpty(duplicateRows, "重複送信はありません。");
  } else {
    duplicateRows.innerHTML = duplicates
      .map((item) => `
        <div class="suppressed-item">
          <strong>${escapeHtml(item.participantCode || item.respondentId || item.key)}</strong>
          <span>${item.count}回送信 / 最新: ${escapeHtml(item.latestSubmittedAt)} / 古い回答はCSV・集団分析から除外</span>
        </div>
      `)
      .join("");
  }

  if (generatedParticipants.length) renderParticipants(generatedParticipants);
  renderSecurityChecks(summary);
}

function renderSecurityChecks(summary) {
  const security = summary.security || {};
  const duplicateCount = (summary.duplicateSubmissions || []).length;
  const invalidCount = (summary.invalidRecords || []).length;
  const suppressedCount = summary.groupSummary?.suppressedGroups?.length || 0;
  const checks = [
    {
      type: security.localOnly ? "ok" : "warning",
      title: "公開範囲",
      text: security.localOnly ? "ローカル専用で起動しています。" : "ローカル専用ではありません。外部公開前の設定確認が必要です。",
    },
    {
      type: security.adminKeyEnabled ? "ok" : "warning",
      title: "管理キー",
      text: security.adminKeyEnabled ? "管理APIに管理キーが設定されています。" : "管理キーが未設定です。ローカル試用は可、本番公開時はADMIN_KEYを設定してください。",
    },
    {
      type: security.qrAvailable ? "ok" : "warning",
      title: "QR生成",
      text: security.qrAvailable ? "ローカルQR生成を利用できます。" : "QR生成ライブラリが見つかりません。URL配布のみ利用できます。",
    },
    {
      type: invalidCount ? "warning" : "ok",
      title: "CSV取込前不足",
      text: invalidCount ? `${invalidCount}件に不足があります。厚労省CSV出力前に確認してください。` : "CSV取込に必要な項目の不足はありません。",
    },
    {
      type: duplicateCount ? "warning" : "ok",
      title: "重複送信",
      text: duplicateCount ? `${duplicateCount}件の重複送信があります。出力には最新回答だけを使います。` : "重複送信はありません。",
    },
    {
      type: suppressedCount ? "warning" : "ok",
      title: "10人未満集団",
      text: suppressedCount ? `${suppressedCount}集団は10人未満のため非表示です。` : "10人未満で非表示になる集団はありません。",
    },
  ];

  securityRows.innerHTML = checks
    .map((check) => `
      <div class="diagnostic-item ${check.type}">
        <strong>${escapeHtml(check.title)}</strong>
        <span>${escapeHtml(check.text)}</span>
      </div>
    `)
    .join("");
}

function renderAuditLog(entries) {
  if (!entries.length) {
    renderEmpty(auditRows, "CSV出力ログはまだありません。");
    return;
  }

  auditRows.innerHTML = entries
    .map((entry) => `
      <div class="suppressed-item">
        <strong>${escapeHtml(entry.action)} / ${escapeHtml(entry.timestamp)}</strong>
        <span>${escapeHtml(formatAuditEntry(entry))}</span>
      </div>
    `)
    .join("");
}

function setResponseAdminMessage(text, type = "info") {
  responseAdminMessage.hidden = false;
  responseAdminMessage.className = `form-message ${type}`;
  responseAdminMessage.textContent = text;
}

function statusLabel(status) {
  return status === "disabled" ? "無効" : "有効";
}

function sourceLabel(source) {
  const labels = {
    "stress-check-form": "ローカルフォーム",
    "google-form-csv": "GoogleフォームCSV",
  };
  return labels[source] || source || "-";
}

function renderStoredResponses(rows) {
  storedResponses = rows || [];
  downloadResponseAdminCsv.disabled = !storedResponses.length;
  if (!storedResponses.length) {
    responseAdminRows.innerHTML = `<tr><td colspan="8">保存済み回答はまだありません。</td></tr>`;
    return;
  }

  responseAdminRows.innerHTML = storedResponses.slice(0, 200).map((row) => {
    const statusClass = row.status === "disabled" ? "disabled" : "done";
    const actionLabel = row.status === "disabled" ? "有効化" : "無効化";
    const nextStatus = row.status === "disabled" ? "active" : "disabled";
    const workplace = row.analysisVariable || row.workplaceName || row.workplaceCode || row.department || "-";
    const csvStatus = row.mhlwReady ? "取込可" : `不足: ${(row.missing || []).slice(0, 3).join("、")}`;
    const outputStatus = row.exportTarget ? "出力対象" : row.status === "disabled" ? "除外" : "旧回答";
    return `
      <tr>
        <td><span class="status-pill ${statusClass}">${escapeHtml(statusLabel(row.status))}</span></td>
        <td>${escapeHtml(row.submittedAt || "-")}</td>
        <td><strong>${escapeHtml(row.respondentId || row.participantCode || "-")}</strong><small>${escapeHtml(row.submissionId || "")}</small></td>
        <td>${escapeHtml(sourceLabel(row.source))}</td>
        <td>${escapeHtml(workplace)}</td>
        <td>${escapeHtml(csvStatus)}</td>
        <td>${escapeHtml(outputStatus)}</td>
        <td><button type="button" class="btn btn-outline btn-sm response-status-action" data-submission-id="${escapeHtml(row.submissionId)}" data-next-status="${nextStatus}">${actionLabel}</button></td>
      </tr>
    `;
  }).join("");
}

function buildResponseAdminCsv(rows) {
  const output = [
    ["状態", "送信日時", "受検者ID", "受検コード", "回答ID", "取込元", "職場コード", "職場名", "部署", "変数値", "厚労省CSV", "不足", "出力対象", "状態変更日時", "状態変更理由"],
    ...rows.map((row) => [
      statusLabel(row.status),
      row.submittedAt,
      row.respondentId,
      row.participantCode,
      row.submissionId,
      sourceLabel(row.source),
      row.workplaceCode,
      row.workplaceName,
      row.department,
      row.analysisVariable,
      row.mhlwReady ? "取込可" : "不足あり",
      (row.missing || []).join(" / "),
      row.exportTarget ? "はい" : "いいえ",
      row.statusUpdatedAt,
      row.statusReason,
    ]),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

async function loadStoredResponses() {
  if (isPublicStaticPage) return;
  try {
    const response = await fetch("/api/stress-check-admin/responses", { headers: adminHeaders() });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "読み込めませんでした。");
    renderStoredResponses(result.responses || []);
    setResponseAdminMessage(`保存済み ${result.totalResponses}件 / 有効 ${result.activeResponses}件 / 無効 ${result.disabledResponses}件`, "success");
  } catch (error) {
    responseAdminRows.innerHTML = `<tr><td colspan="8">保存済み回答を読み込めませんでした。</td></tr>`;
    setResponseAdminMessage(`保存済み回答を読み込めませんでした。理由: ${error.message}`, "error");
  }
}

async function updateResponseStatus(submissionId, nextStatus) {
  const reason = window.prompt(nextStatus === "disabled" ? "無効化する理由を入力してください。" : "有効化する理由を入力してください。", nextStatus === "disabled" ? "誤取込・テスト回答のため" : "誤って無効化したため");
  if (reason === null) return;

  try {
    const response = await fetch("/api/stress-check-admin/response-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
      },
      body: JSON.stringify({ submissionId, status: nextStatus, reason }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "状態を変更できませんでした。");
    setResponseAdminMessage(nextStatus === "disabled" ? "回答を無効化しました。CSV出力と集団分析から外れます。" : "回答を有効化しました。CSV出力と集団分析の対象に戻ります。", "success");
    await Promise.all([loadSummary(), loadStoredResponses(), loadAuditLog()]);
  } catch (error) {
    setResponseAdminMessage(`状態変更に失敗しました。理由: ${error.message}`, "error");
  }
}

function handleDownloadResponseAdminCsv() {
  if (!storedResponses.length) return;
  const blob = new Blob([`\uFEFF${buildResponseAdminCsv(storedResponses)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stress-check-response-admin.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatAuditEntry(entry) {
  if (entry.source === "admin-response-status") {
    return `回答ID: ${entry.submissionId || "-"} / 理由: ${entry.reason || "-"}`;
  }
  if (entry.source === "admin-google-csv") {
    return `取込: ${entry.importedCount ?? 0}件 / 厚労省CSV不足見込み: ${entry.incompleteForMhlwCount ?? 0}件 / 出力対象: ${entry.exportTargetResponses ?? 0}件 / 表示集団: ${entry.visibleGroupCount ?? 0} / 非表示集団: ${entry.suppressedGroupCount ?? 0}`;
  }
  if (entry.source === "admin-client") {
    return `対象: ${entry.rosterTargetResponses ?? 0}件 / 受検済み: ${entry.submittedCount ?? 0}件 / 未受検: ${entry.pendingCount ?? 0}件 / 表示集団: ${entry.visibleGroupCount ?? 0} / 非表示集団: ${entry.suppressedGroupCount ?? 0}`;
  }
  return `出力対象: ${entry.exportTargetResponses ?? 0}件 / 保存総数: ${entry.totalResponses ?? 0}件 / 重複: ${entry.duplicateSubmissionGroups ?? 0}件 / 表示集団: ${entry.visibleGroupCount ?? 0} / 非表示集団: ${entry.suppressedGroupCount ?? 0}`;
}

function setParticipantMessage(text, type = "info") {
  participantMessage.hidden = false;
  participantMessage.className = `form-message ${type}`;
  participantMessage.textContent = text;
}

function countBy(rows, keyGetter) {
  return rows.reduce((map, row) => {
    const key = String(keyGetter(row) || "").trim();
    if (!key) return map;
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
}

function duplicatedKeys(map) {
  return Array.from(map.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `${key} (${count}件)`);
}

function groupKeyForParticipant(row) {
  return row.variable || row.workplaceCode || row.department || row.workplaceName || "未設定";
}

function analyzeParticipants(rows) {
  const checks = [];
  const duplicateIds = duplicatedKeys(countBy(rows, (row) => row.id));
  const duplicateCodes = duplicatedKeys(countBy(rows, (row) => row.accessCode));
  const smallGroups = Array.from(countBy(rows, groupKeyForParticipant).entries())
    .filter(([, count]) => count > 0 && count < 10)
    .map(([key, count]) => `${key} (${count}人)`);
  const missingNames = rows.filter((row) => !row.name).length;
  const missingWorkplaces = rows.filter((row) => !row.workplaceCode && !row.workplaceName && !row.department).length;

  if (duplicateIds.length) {
    checks.push({ type: "error", text: `社員IDが重複しています: ${duplicateIds.join("、")}` });
  }
  if (duplicateCodes.length) {
    checks.push({ type: "error", text: `受検コードが重複しています: ${duplicateCodes.join("、")}` });
  }
  if (smallGroups.length) {
    checks.push({ type: "warning", text: `10人未満のため集団分析で非表示になる見込み: ${smallGroups.join("、")}` });
  }
  if (missingNames) {
    checks.push({ type: "warning", text: `氏名が空の行があります: ${missingNames}件` });
  }
  if (missingWorkplaces) {
    checks.push({ type: "warning", text: `職場コード・職場名・部署が空の行があります: ${missingWorkplaces}件` });
  }
  if (!checks.length && rows.length) {
    checks.push({ type: "ok", text: "名簿の重複と集団人数の簡易チェックに問題はありません。" });
  }
  return checks;
}

function renderParticipantChecks(checks) {
  participantChecks.hidden = !checks.length;
  participantChecks.innerHTML = checks
    .map((check) => `<div class="participant-check ${check.type}">${escapeHtml(check.text)}</div>`)
    .join("");
}

function splitLine(line, delimiter) {
  if (delimiter === "\t") return line.split("\t").map((cell) => cell.trim());
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replaceAll("　", "")
    .replaceAll(" ", "")
    .replaceAll("_", "")
    .replaceAll("-", "");
}

function resolveField(header) {
  const key = normalizeHeader(header);
  const map = {
    id: "id",
    code: "accessCode",
    token: "accessCode",
    accesscode: "accessCode",
    participantcode: "accessCode",
    受検コード: "accessCode",
    配布コード: "accessCode",
    employeeid: "id",
    respondentid: "id",
    scid: "id",
    社員id: "id",
    社員番号: "id",
    受検者id: "id",
    従業員id: "id",
    氏名: "name",
    name: "name",
    personname: "name",
    名前: "name",
    フリガナ: "kana",
    ふりがな: "kana",
    kana: "kana",
    kananame: "kana",
    生年月日: "birthDate",
    birthdate: "birthDate",
    birthday: "birthDate",
    性別: "gender",
    gender: "gender",
    職場コード: "workplaceCode",
    workplacecode: "workplaceCode",
    部署コード: "workplaceCode",
    職場名: "workplaceName",
    workplace: "workplaceName",
    workplacename: "workplaceName",
    部署: "department",
    department: "department",
    部署名: "department",
    会社名: "organization",
    事業所名: "organization",
    organization: "organization",
    変数値: "variable",
    variable: "variable",
    分析変数: "variable",
    前回社員id: "previousEmployeeId",
    previousemployeeid: "previousEmployeeId",
  };
  return map[key] || "";
}

function parseParticipantSource(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const fields = splitLine(lines[0], delimiter).map(resolveField);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const row = {};
    fields.forEach((field, index) => {
      if (field) row[field] = cells[index] || "";
    });
    return row;
  }).filter((row) => row.id);
}

function parseBasicInfoSource(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const fields = splitLine(lines[0], delimiter).map(resolveField);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const row = {};
    fields.forEach((field, index) => {
      if (field) row[field] = cells[index] || "";
    });
    return row;
  }).filter((row) => Object.values(row).some((value) => cleanText(value)));
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function setGoogleImportMessage(text, type = "info") {
  googleImportMessage.hidden = false;
  googleImportMessage.className = `form-message ${type}`;
  googleImportMessage.textContent = text;
}

function createRunId(prefix = "SC") {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`;
}

function operationLogDetail(detail = {}) {
  const blockedKeys = new Set([
    "respondentId",
    "participantCode",
    "personName",
    "kanaName",
    "name",
    "id",
    "code",
  ]);
  return Object.entries(detail)
    .filter(([key]) => !blockedKeys.has(key))
    .map(([key, value]) => `${key}=${value}`)
    .join(" / ");
}

function addOperationLog(action, detail = {}) {
  operationLog.push({
    timestamp: new Date().toISOString(),
    runId: currentRunId,
    action,
    totalRows: googleImportRows.length || "",
    scoreableRows: googleImportRows.filter?.((row) => buildMhlwIndividualAnalysis(row).canScore).length || "",
    detail: operationLogDetail(detail),
  });
  if (downloadOperationLogCsv) downloadOperationLogCsv.disabled = !operationLog.length;
  renderCompletionChecklist(googleImportRows);
}

function buildOperationLogCsv() {
  const output = [
    ["日時", "実施ID", "操作", "読取件数", "判定可能件数", "詳細"],
    ...operationLog.map((entry) => [entry.timestamp, entry.runId, entry.action, entry.totalRows, entry.scoreableRows, entry.detail]),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function getLegalOperationChecks() {
  if (!legalOperationChecklist) return [];
  return Array.from(legalOperationChecklist.querySelectorAll("[data-legal-check]")).map((input) => ({
    label: input.dataset.legalCheck,
    checked: input.checked,
  }));
}

function getImplementationSettings() {
  return {
    operator: cleanText(implementationOperator?.value),
    interviewContact: cleanText(interviewContact?.value),
    interviewDeadline: cleanText(interviewDeadline?.value),
  };
}

function hasOperation(actionPrefix) {
  return operationLog.some((entry) => entry.action.startsWith(actionPrefix));
}

function statusItem(label, done, detail = "") {
  return `
    <div class="completion-item ${done ? "ok" : "todo"}">
      <strong>${done ? "完了" : "未完了"}</strong>
      <span>${escapeHtml(label)}${detail ? `<em>${escapeHtml(detail)}</em>` : ""}</span>
    </div>
  `;
}

function recommendedFileNames(rows = googleImportRows) {
  const scoreableCount = rows.filter((row) => buildMhlwIndividualAnalysis(row).canScore).length;
  return {
    personal: fileNameWithRunId(scoreableCount > 1 ? "personal-results-print" : "personal-result", "pdf"),
    company: fileNameWithRunId("company-group-analysis", "pdf"),
    implementation: fileNameWithRunId("implementation-record", "pdf"),
    importCheck: fileNameWithRunId("google-form-import-check", "csv"),
    individualCsv: fileNameWithRunId("stress-check-individual-analysis-mhlw57", "csv"),
    operationLog: fileNameWithRunId("stress-check-operation-log", "csv"),
  };
}

function renderCompletionChecklist(rows = googleImportRows) {
  if (!completionChecklist) return;
  if (!rows.length) {
    completionChecklist.hidden = true;
    completionChecklist.innerHTML = "";
    return;
  }
  completionChecklist.hidden = false;
  const analyses = rows.map(buildMhlwIndividualAnalysis);
  const scoreableCount = analyses.filter((item) => item.canScore).length;
  const groupAnalysis = buildCompanyGroupAnalysis(rows);
  const settings = getImplementationSettings();
  const missingGuidance = ["operator", "interviewContact", "interviewDeadline"].filter((key) => !settings[key]);
  const uncheckedCount = getLegalOperationChecks().filter((item) => !item.checked).length;
  const names = recommendedFileNames(rows);
  const items = [
    statusItem("CSV確認", rows.length > 0, `${rows.length}件 / 実施ID ${currentRunId || "-"}`),
    statusItem("本人通知・面接指導案内の入力", !missingGuidance.length, missingGuidance.length ? `${missingGuidance.length}項目未入力` : "入力済み"),
    statusItem("実施前チェック", uncheckedCount === 0, uncheckedCount ? `${uncheckedCount}項目未確認` : "全項目確認済み"),
    statusItem("本人向け結果を開く", hasOperation("本人向け結果"), scoreableCount ? `対象 ${scoreableCount}件` : "判定可能な回答なし"),
    statusItem("企業向け集団分析を開く", hasOperation("企業向け集団分析"), groupAnalysis.overall || groupAnalysis.visibleGroups.length ? `表示集団 ${groupAnalysis.visibleGroups.length}件` : "10人以上の集団なし"),
    statusItem("実施記録を開く", hasOperation("実施記録"), "PDF保存して保管"),
    statusItem("実施ログCSV", hasOperation("実施ログCSV"), operationLog.length ? `${operationLog.length}件のログ` : "ログなし"),
  ];
  completionChecklist.innerHTML = `
    <strong>完了状況</strong>
    <div class="completion-grid">${items.join("")}</div>
    <div class="recommended-files">
      <strong>推奨保存名</strong>
      <span>${escapeHtml(names.personal)}</span>
      <span>${escapeHtml(names.company)}</span>
      <span>${escapeHtml(names.implementation)}</span>
      <span>${escapeHtml(names.individualCsv)}</span>
      <span>${escapeHtml(names.operationLog)}</span>
    </div>
  `;
}

function saveOperationSettings() {
  const payload = {
    implementation: getImplementationSettings(),
    legalChecks: getLegalOperationChecks(),
  };
  localStorage.setItem(localSettingsKey, JSON.stringify(payload));
}

function restoreOperationSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(localSettingsKey) || "{}");
    const implementation = saved.implementation || {};
    if (implementationOperator) implementationOperator.value = implementation.operator || "";
    if (interviewContact) interviewContact.value = implementation.interviewContact || "";
    if (interviewDeadline) interviewDeadline.value = implementation.interviewDeadline || "";
    const checkedByLabel = new Map((saved.legalChecks || []).map((item) => [item.label, Boolean(item.checked)]));
    legalOperationChecklist?.querySelectorAll("[data-legal-check]").forEach((input) => {
      input.checked = checkedByLabel.get(input.dataset.legalCheck) || false;
    });
  } catch {
    localStorage.removeItem(localSettingsKey);
  }
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && next === "\n") index += 1;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows
    .map((items) => items.map((item) => cleanText(item)))
    .filter((items) => items.some(Boolean));
}

function normalizeLoose(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[＿_\-－ー]/g, "");
}

function questionKeyFromHeader(header) {
  const normalized = String(header || "").normalize("NFKC").trim().toUpperCase();
  const direct = normalized.match(/(?:^|[^A-Z])([ABCD])\s*0?(\d{1,2})(?=[^0-9]|$)/);
  if (direct) {
    const key = `${direct[1]}${Number(direct[2])}`;
    if (questionOrder.includes(key)) return key;
  }

  const sequential = normalized.match(/(?:回答|質問|設問|問)\s*0?(\d{1,2})(?=[^0-9]|$)/);
  if (sequential) {
    return questionOrder[Number(sequential[1]) - 1] || "";
  }

  const numericOnly = normalized.match(/^0?(\d{1,2})$/);
  if (numericOnly) {
    return questionOrder[Number(numericOnly[1]) - 1] || "";
  }

  return "";
}

function resolveGoogleResponseField(header) {
  const questionKey = questionKeyFromHeader(header);
  if (questionKey) return `answer:${questionKey}`;

  const key = normalizeLoose(header);
  const map = {
    timestamp: "submittedAt",
    タイムスタンプ: "submittedAt",
    送信日時: "submittedAt",
    回答日時: "submittedAt",
    受検者id: "respondentId",
    受検者コード: "participantCode",
    受検コード: "participantCode",
    配布コード: "participantCode",
    社員id: "respondentId",
    社員番号: "respondentId",
    従業員id: "respondentId",
    respondentid: "respondentId",
    participantcode: "participantCode",
    氏名: "personName",
    名前: "personName",
    personname: "personName",
    フリガナ: "kanaName",
    ふりがな: "kanaName",
    kananame: "kanaName",
    生年月日: "birthDate",
    birthdate: "birthDate",
    性別: "gender",
    gender: "gender",
    会社名事業所名: "organization",
    会社名: "organization",
    事業所名: "organization",
    organization: "organization",
    部署: "department",
    部署名: "department",
    department: "department",
    職場コード: "workplaceCode",
    workplacecode: "workplaceCode",
    職場名: "workplaceName",
    workplacename: "workplaceName",
    変数値: "analysisVariable",
    分析変数: "analysisVariable",
    analysisvariable: "analysisVariable",
    前回社員id: "previousEmployeeId",
    previousemployeeid: "previousEmployeeId",
  };
  return map[key] || "";
}

function parseAnswerValue(value) {
  const text = cleanText(value).normalize("NFKC");
  const match = text.match(/[1-4]/);
  return match ? Number(match[0]) : "";
}

function buildRosterLookups(extraRows = []) {
  return [...generatedParticipants, ...extraRows].reduce((lookups, row) => {
    if (row.id) lookups.byId.set(row.id, row);
    if (row.accessCode) lookups.byCode.set(row.accessCode, row);
    return lookups;
  }, { byId: new Map(), byCode: new Map() });
}

function enrichGoogleRecord(record, lookups) {
  const idOrCode = cleanText(record.respondentId || record.participantCode);
  const roster = lookups.byCode.get(idOrCode) || lookups.byId.get(idOrCode) || lookups.byCode.get(record.participantCode) || lookups.byId.get(record.respondentId);
  return {
    submittedAt: cleanText(record.submittedAt),
    respondentId: cleanText(roster?.id || record.respondentId || record.participantCode),
    participantCode: cleanText(record.participantCode || (roster && idOrCode === roster.accessCode ? idOrCode : roster?.accessCode)),
    organization: cleanText(record.organization || roster?.organization),
    department: cleanText(record.department || roster?.department),
    personName: cleanText(record.personName || roster?.name),
    kanaName: cleanText(record.kanaName || roster?.kana),
    birthDate: cleanText(record.birthDate || roster?.birthDate),
    gender: cleanText(record.gender || roster?.gender),
    workplaceCode: cleanText(record.workplaceCode || roster?.workplaceCode),
    workplaceName: cleanText(record.workplaceName || roster?.workplaceName),
    analysisVariable: cleanText(record.analysisVariable || roster?.variable || record.department),
    previousEmployeeId: cleanText(record.previousEmployeeId || roster?.previousEmployeeId),
    answers: record.answers || {},
    sourceRowNumber: record.sourceRowNumber,
    matchedRoster: Boolean(roster),
  };
}

function mergeSupplementalInfo(record, supplemental) {
  if (!supplemental) return record;
  return {
    ...record,
    respondentId: cleanText(record.respondentId || supplemental.id || record.participantCode),
    participantCode: cleanText(record.participantCode || supplemental.accessCode),
    organization: cleanText(record.organization || supplemental.organization),
    department: cleanText(record.department || supplemental.department),
    personName: cleanText(record.personName || supplemental.name),
    kanaName: cleanText(record.kanaName || supplemental.kana),
    birthDate: cleanText(record.birthDate || supplemental.birthDate),
    gender: cleanText(record.gender || supplemental.gender),
    workplaceCode: cleanText(record.workplaceCode || supplemental.workplaceCode),
    workplaceName: cleanText(record.workplaceName || supplemental.workplaceName),
    analysisVariable: cleanText(record.analysisVariable || supplemental.variable || supplemental.department),
    previousEmployeeId: cleanText(record.previousEmployeeId || supplemental.previousEmployeeId),
    matchedRoster: record.matchedRoster || Boolean(supplemental.id || supplemental.accessCode),
  };
}

function importIssues(record) {
  const issues = [];
  if (!record.respondentId) issues.push("受検者ID");
  const missingAnswers = missingAnswerKeys(record);
  if (missingAnswers.length) {
    const shown = missingAnswers.slice(0, 8).join(" ");
    issues.push(`回答不足 ${missingAnswers.length}項目${shown ? `: ${shown}` : ""}`);
  }
  if (record.csvDuplicate) issues.push("CSV内で同じ受検者が重複");
  return issues;
}

function missingAnswerKeys(record) {
  return questionOrder.filter((key) => ![1, 2, 3, 4].includes(Number(record.answers?.[key])));
}

function normalizeGenderForMhlw(value) {
  const text = cleanText(value).normalize("NFKC").toLowerCase();
  if (!text) return "";
  if (text.includes("女") || text === "f" || text.includes("female")) return "female";
  if (text.includes("男") || text === "m" || text.includes("male")) return "male";
  return "";
}

function rangeIndex(value, ranges) {
  return ranges.findIndex(([min, max]) => value >= min && value <= max);
}

function mhlwEvaluationPoint(definition, gender, rawScore) {
  const ranges = definition.ranges[gender] || definition.ranges.male;
  const index = rangeIndex(rawScore, ranges);
  if (index < 0) return "";
  const point = index + 1;
  return definition.direction === "badHigh" ? ranges.length + 1 - point : point;
}

function sumByIds(scales, ids) {
  return ids.reduce((total, id) => {
    const scale = scales.find((item) => item.id === id);
    return total + Number(scale?.point || 0);
  }, 0);
}

function buildMhlwIndividualAnalysis(record) {
  const missingAnswers = missingAnswerKeys(record);
  const gender = normalizeGenderForMhlw(record.gender);
  const warnings = importWarnings(record);
  const canScore = !missingAnswers.length && Boolean(gender);
  const scales = canScore
    ? mhlwScaleDefinitions.map((definition) => {
        const rawScore = definition.raw(record.answers);
        return {
          ...definition,
          rawScore,
          point: mhlwEvaluationPoint(definition, gender, rawScore),
        };
      })
    : [];
  const reactionTotal = canScore ? sumByIds(scales, mhlwRiskDomains.reaction) : "";
  const factorSupportTotal = canScore ? sumByIds(scales, mhlwRiskDomains.factorsAndSupport) : "";
  const conditionA = canScore && reactionTotal <= 12;
  const conditionB = canScore && factorSupportTotal <= 26 && reactionTotal <= 17;
  const highStress = conditionA || conditionB;
  const reason = !canScore
    ? `${missingAnswers.length ? `回答不足 ${missingAnswers.length}項目` : ""}${!gender ? `${missingAnswers.length ? " / " : ""}性別未設定` : ""}`
    : highStress
      ? `高ストレス者判定該当（${conditionA ? "心身のストレス反応" : "要因・サポートと反応の組合せ"}）`
      : "高ストレス者判定には該当しません";

  return {
    sourceRowNumber: record.sourceRowNumber,
    respondentId: record.respondentId,
    participantCode: record.participantCode,
    personName: record.personName,
    department: record.department,
    workplaceCode: record.workplaceCode,
    workplaceName: record.workplaceName,
    gender: gender === "female" ? "女性" : gender === "male" ? "男性" : "",
    canScore,
    missingAnswers,
    missingBasic: warnings,
    scales,
    reactionTotal,
    factorSupportTotal,
    conditionA,
    conditionB,
    highStress,
    reason,
  };
}

function scalePointText(analysis, id) {
  const scale = analysis.scales.find((item) => item.id === id);
  return scale?.point || "";
}

function scaleRawScore(analysis, id) {
  const scale = analysis.scales.find((item) => item.id === id);
  return Number.isFinite(Number(scale?.rawScore)) ? Number(scale.rawScore) : "";
}

function roundHealthRisk(value) {
  if (!Number.isFinite(value)) return "";
  return Math.round(value);
}

function calculateRiskBySex(scoredRecords, sex) {
  const targets = scoredRecords.filter(({ record }) => normalizeGenderForMhlw(record.gender) === sex);
  if (!targets.length) return null;
  const coef = workStressJudgementCoefficients[sex];
  const quantity = average(targets.map(({ analysis }) => scaleRawScore(analysis, "A_QUANTITY")));
  const control = average(targets.map(({ analysis }) => scaleRawScore(analysis, "A_CONTROL")));
  const supervisor = average(targets.map(({ analysis }) => scaleRawScore(analysis, "C_SUPERVISOR")));
  const coworker = average(targets.map(({ analysis }) => scaleRawScore(analysis, "C_COWORKER")));
  const loadControl = 100 * Math.exp(
    (quantity - coef.quantityMean) * coef.quantityCoef +
    (control - coef.controlMean) * coef.controlCoef,
  );
  const support = 100 * Math.exp(
    (supervisor - coef.supervisorMean) * coef.supervisorCoef +
    (coworker - coef.coworkerMean) * coef.coworkerCoef,
  );
  return {
    sex,
    count: targets.length,
    quantity,
    control,
    supervisor,
    coworker,
    loadControl,
    support,
    total: (loadControl * support) / 100,
  };
}

function calculateWorkStressHealthRisk(scoredRecords) {
  const sexRisks = ["male", "female"].map((sex) => calculateRiskBySex(scoredRecords, sex)).filter(Boolean);
  const totalCount = sexRisks.reduce((sum, item) => sum + item.count, 0);
  if (!totalCount) return null;
  const weighted = (key) => sexRisks.reduce((sum, item) => sum + item[key] * item.count, 0) / totalCount;
  return {
    loadControl: roundHealthRisk(weighted("loadControl")),
    support: roundHealthRisk(weighted("support")),
    total: roundHealthRisk((weighted("loadControl") * weighted("support")) / 100),
    source: sexRisks.length === 2 ? "男女別係数を人数加重" : (sexRisks[0].sex === "male" ? "男性係数" : "女性係数"),
    sexBreakdown: sexRisks.map((item) => ({
      sex: item.sex,
      count: item.count,
      loadControl: roundHealthRisk(item.loadControl),
      support: roundHealthRisk(item.support),
      total: roundHealthRisk(item.total),
    })),
  };
}

function buildIndividualAnalysisCsv(rows) {
  const scaleHeaders = mhlwScaleDefinitions.flatMap((definition) => [`${definition.label} 素点`, `${definition.label} 評価点`]);
  const output = [
    [
      "CSV行", "受検者ID", "受検コード", "氏名", "性別", "部署", "職場コード", "職場名",
      "判定可否", "高ストレス者判定", "判定根拠", "心身のストレス反応6尺度合計", "仕事のストレス要因+周囲のサポート12尺度合計",
      "条件1_反応6尺度12点以下", "条件2_要因サポート26点以下かつ反応17点以下", "回答不足項目", "基本情報不足",
      ...scaleHeaders,
    ],
    ...rows.map((record) => {
      const analysis = buildMhlwIndividualAnalysis(record);
      return [
        analysis.sourceRowNumber,
        analysis.respondentId,
        analysis.participantCode,
        analysis.personName,
        analysis.gender,
        analysis.department,
        analysis.workplaceCode,
        analysis.workplaceName,
        analysis.canScore ? "判定可能" : "判定不可",
        analysis.canScore ? (analysis.highStress ? "該当" : "非該当") : "",
        analysis.reason,
        analysis.reactionTotal,
        analysis.factorSupportTotal,
        analysis.conditionA ? "該当" : "非該当",
        analysis.conditionB ? "該当" : "非該当",
        analysis.missingAnswers.join(" "),
        analysis.missingBasic.join(" / "),
        ...mhlwScaleDefinitions.flatMap((definition) => {
          const scale = analysis.scales.find((item) => item.id === definition.id);
          return [scale?.rawScore ?? "", scale?.point ?? ""];
        }),
      ];
    }),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function safeFileName(value) {
  return cleanText(value || "result")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "result";
}

function personalRiskText(analysis) {
  if (!analysis.canScore) return "回答または基本情報が不足しているため、結果を出力できません。";
  if (analysis.highStress) {
    return "今回のストレスチェック結果は、厚労省資料の数値基準例に基づく高ストレス者判定に該当します。医師による面接指導の申出について、実施者からの案内を確認してください。";
  }
  return "今回のストレスチェック結果は、厚労省資料の数値基準例に基づく高ストレス者判定には該当しません。結果をセルフケアや働き方の見直しに活用してください。";
}

function scaleLevelText(point) {
  const labels = {
    1: "高いストレス状態",
    2: "やや高い",
    3: "普通",
    4: "やや低い",
    5: "低い",
  };
  return labels[point] || "-";
}

function profileRadarSvg(analysis) {
  if (!analysis.canScore) return "";
  const scales = analysis.scales.filter((scale) => scale.domain !== "D");
  const size = 420;
  const center = size / 2;
  const maxRadius = 150;
  const points = scales.map((scale, index) => {
    const angle = (-90 + (360 / scales.length) * index) * Math.PI / 180;
    const radius = maxRadius * (Number(scale.point) / 5);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (maxRadius + 34),
      labelY: center + Math.sin(angle) * (maxRadius + 34),
      label: scale.label.replace("心理的な仕事の負担（", "負担").replace("）", ""),
    };
  });
  const rings = [1, 2, 3, 4, 5].map((level) => {
    const r = maxRadius * (level / 5);
    return `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#d8e2e8" stroke-width="1" />`;
  }).join("");
  const axes = points.map((point) => `<line x1="${center}" y1="${center}" x2="${point.labelX}" y2="${point.labelY}" stroke="#edf2f7" stroke-width="1" />`).join("");
  const labelText = points.map((point) => `<text x="${point.labelX}" y="${point.labelY}" text-anchor="middle" dominant-baseline="middle" font-size="9" fill="#526173">${escapeHtml(point.label)}</text>`).join("");
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  return `
    <div class="chart-card">
      <h2>あなたのストレスプロフィール</h2>
      <p class="fine">評価点1〜5点をレーダー表示しています。外側に近いほどよい方向、中心に近いほど注意が必要な方向です。</p>
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="ストレスプロフィール">
        ${rings}
        ${axes}
        <polygon points="${polygon}" fill="rgba(47, 148, 147, 0.28)" stroke="#2f9493" stroke-width="3" />
        ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4" fill="#2f9493" />`).join("")}
        ${labelText}
      </svg>
    </div>
  `;
}

function buildPersonalResultHtml(record) {
  const analysis = buildMhlwIndividualAnalysis(record);
  const settings = getImplementationSettings();
  const titleName = analysis.personName || analysis.respondentId || analysis.participantCode || "受検者";
  const scaleRows = analysis.scales.map((scale) => `
    <tr>
      <td>${escapeHtml(scale.label)}</td>
      <td>${escapeHtml(scale.domain)}</td>
      <td>${escapeHtml(scale.rawScore)}</td>
      <td>${escapeHtml(scale.point)}</td>
      <td>${escapeHtml(scaleLevelText(scale.point))}</td>
    </tr>
  `).join("");
  const highStressLabel = analysis.highStress ? "該当" : "非該当";
  const resultClass = analysis.highStress ? "attention" : "stable";
  const names = recommendedFileNames([record]);
  const interviewNotice = analysis.highStress
    ? `
      <h2>医師による面接指導の申出</h2>
      <div class="notice attention">
        <p>この結果は高ストレス者判定に該当します。医師による面接指導を希望する場合は、下記の申出先へ連絡してください。</p>
        <div class="meta">
          <div><strong>申出先</strong><br>${escapeHtml(settings.interviewContact || "実施者からの案内を確認してください")}</div>
          <div><strong>申出期限</strong><br>${escapeHtml(settings.interviewDeadline || "実施者からの案内を確認してください")}</div>
        </div>
        <p class="fine">面接指導の申出を行う場合、法令・制度運用上、事業者が面接指導の実施に必要な範囲で結果情報を取り扱うことがあります。詳細は実施者の案内を確認してください。</p>
      </div>
    `
    : `
      <h2>相談先</h2>
      <div class="notice stable">
        <p>高ストレス者判定には該当しませんが、心身の不調や働き方について相談したい場合は、実施者または産業保健窓口に相談してください。</p>
        <p class="fine">相談先: ${escapeHtml(settings.interviewContact || "実施者からの案内を確認してください")}</p>
      </div>
    `;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ストレスチェック個人結果 - ${escapeHtml(titleName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; background: #eef3f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
    main { max-width: 920px; margin: 28px auto; padding: 28px; background: #fff; border: 1px solid #d8e2e8; border-radius: 8px; }
    h1, h2 { margin: 0; line-height: 1.25; }
    h1 { font-size: 1.8rem; }
    h2 { margin-top: 24px; font-size: 1.18rem; }
    p { margin: 8px 0 0; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
    .meta div, .notice, .box { padding: 12px 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .chart-card { margin-top: 24px; padding: 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .chart-card svg { display: block; width: min(100%, 520px); margin: 10px auto 0; }
    .notice { margin-top: 18px; font-weight: 800; }
    .attention { background: #fff2f2; border-color: #f5c2c7; color: #9f1239; }
    .stable { background: #e9f7f6; border-color: #bde7e5; color: #176c6a; }
    table { width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.94rem; }
    th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #edf5f7; }
    .screen-actions { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 18px; }
    .screen-actions button { min-height: 42px; padding: 9px 15px; border-radius: 999px; border: 0; color: #fff; background: #2f9493; font-weight: 800; cursor: pointer; }
    .summary { display: grid; gap: 10px; margin-top: 14px; }
    @media (min-width: 720px) { .summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .summary strong, .summary span { display: block; }
    .summary strong { font-size: 1.6rem; line-height: 1.1; }
    .fine { color: #5b6678; font-size: 0.88rem; }
    @media print { body { background: #fff; } main { margin: 0; border: 0; border-radius: 0; } .screen-actions { display: none; } }
  </style>
</head>
<body>
  <main>
    <div class="screen-actions"><button type="button" onclick="window.print()">印刷 / PDF保存</button></div>
    <h1>ストレスチェック個人結果</h1>
    <p class="fine">この結果は本人通知用です。本人の同意なく、会社担当者へ個人結果や高ストレス者判定を共有しないでください。PDF保存名の例: ${escapeHtml(names.personal)}</p>
    <div class="meta">
      <div><strong>氏名</strong><br>${escapeHtml(analysis.personName || "-")}</div>
      <div><strong>受検者ID</strong><br>${escapeHtml(analysis.respondentId || "-")}</div>
      <div><strong>職場</strong><br>${escapeHtml(analysis.workplaceName || analysis.workplaceCode || analysis.department || "-")}</div>
      <div><strong>性別</strong><br>${escapeHtml(analysis.gender || "-")}</div>
      <div><strong>実施者</strong><br>${escapeHtml(settings.operator || "-")}</div>
      <div><strong>通知日</strong><br>${escapeHtml(new Date().toLocaleDateString("ja-JP"))}</div>
      <div><strong>実施ID</strong><br>${escapeHtml(currentRunId || "-")}</div>
    </div>
    <div class="notice ${resultClass}">
      ${escapeHtml(personalRiskText(analysis))}
    </div>

    <h2>判定サマリー</h2>
    <div class="summary">
      <div class="box"><span>高ストレス者判定</span><strong>${escapeHtml(highStressLabel)}</strong></div>
      <div class="box"><span>心身のストレス反応6尺度</span><strong>${escapeHtml(analysis.reactionTotal)}</strong><span class="fine">12点以下で条件該当</span></div>
      <div class="box"><span>要因+サポート12尺度</span><strong>${escapeHtml(analysis.factorSupportTotal)}</strong><span class="fine">26点以下で条件確認</span></div>
    </div>

    ${interviewNotice}
    ${profileRadarSvg(analysis)}
    <h2>尺度別の結果</h2>
    <p class="fine">評価点は1〜5点です。1点に近いほどストレス状況がよくない方向、5点に近いほどよい方向を示します。</p>
    <table>
      <thead><tr><th>尺度</th><th>領域</th><th>素点</th><th>評価点</th><th>目安</th></tr></thead>
      <tbody>${scaleRows}</tbody>
    </table>

    <h2>結果の扱い</h2>
    <p>この結果は、あなた自身のセルフケアと、必要に応じた医師面接指導のためのものです。職場環境の改善に使う場合も、個人が特定されない範囲で集団分析として扱われます。</p>
    <p class="fine">算出方法: 職業性ストレス簡易調査票57項目、厚生労働省資料「数値基準に基づいて高ストレス者を選定する方法」の素点換算表方式。</p>
  </main>
</body>
</html>`;
}

function buildAllPersonalResultsHtml(rows) {
  const names = recommendedFileNames(rows);
  const documents = rows
    .filter((row) => buildMhlwIndividualAnalysis(row).canScore)
    .map((row) => buildPersonalResultHtml(row).match(/<main>([\s\S]*?)<\/main>/)?.[1] || "")
    .filter(Boolean);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ストレスチェック本人向け結果 一括印刷</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; background: #eef3f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
    main { max-width: 920px; margin: 28px auto; padding: 28px; background: #fff; border: 1px solid #d8e2e8; border-radius: 8px; page-break-after: always; }
    h1, h2 { margin: 0; line-height: 1.25; }
    h1 { font-size: 1.8rem; }
    h2 { margin-top: 24px; font-size: 1.18rem; }
    p { margin: 8px 0 0; }
    .screen-actions { position: sticky; top: 0; z-index: 3; max-width: 920px; margin: 0 auto; padding: 12px; display: flex; gap: 12px; align-items: center; justify-content: flex-end; background: rgba(238, 243, 246, 0.92); }
    .screen-actions span { color: #526173; font-size: 0.88rem; font-weight: 700; }
    .screen-actions button { min-height: 42px; padding: 9px 15px; border-radius: 999px; border: 0; color: #fff; background: #2f9493; font-weight: 800; cursor: pointer; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
    .meta div, .notice, .box, .chart-card { padding: 12px 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .notice { margin-top: 18px; font-weight: 800; }
    .attention { background: #fff2f2; border-color: #f5c2c7; color: #9f1239; }
    .stable { background: #e9f7f6; border-color: #bde7e5; color: #176c6a; }
    table { width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.94rem; }
    th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #edf5f7; }
    .summary { display: grid; gap: 10px; margin-top: 14px; }
    @media (min-width: 720px) { .summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    .summary strong, .summary span { display: block; }
    .summary strong { font-size: 1.6rem; line-height: 1.1; }
    .fine { color: #5b6678; font-size: 0.88rem; }
    .chart-card { margin-top: 24px; }
    .chart-card svg { display: block; width: min(100%, 520px); margin: 10px auto 0; }
    @media print { body { background: #fff; } .screen-actions { display: none; } main { margin: 0; border: 0; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="screen-actions"><span>PDF保存名の例: ${escapeHtml(names.personal)}</span><button type="button" onclick="window.print()">全員分を印刷 / PDF保存</button></div>
  ${documents.map((body) => `<main>${body.replace(/<div class="screen-actions">[\s\S]*?<\/div>/, "")}</main>`).join("")}
</body>
</html>`;
}

function downloadTextFile(filename, content, type = "text/html;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function fileNameWithRunId(baseName, extension) {
  const suffix = safeFileName(currentRunId || "no-run-id");
  return `${baseName}_${suffix}.${extension}`;
}

function openHtmlDocument(content) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return Boolean(opened);
}

function groupKeyForGoogleRecord(record) {
  return cleanText(record.analysisVariable || record.workplaceName || record.workplaceCode || record.department || "未設定");
}

function average(values) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numeric.length) return "";
  return Math.round((numeric.reduce((sum, value) => sum + value, 0) / numeric.length) * 100) / 100;
}

function percent(count, total) {
  if (!total) return "";
  return `${Math.round((count / total) * 1000) / 10}%`;
}

function summarizeGroup(records, label) {
  const scoredRecords = records
    .map((record) => ({ record, analysis: buildMhlwIndividualAnalysis(record) }))
    .filter(({ analysis }) => analysis.canScore);
  const analyses = scoredRecords.map(({ analysis }) => analysis);
  const scaleAverages = Object.fromEntries(mhlwScaleDefinitions.map((definition) => [
    definition.id,
    average(analyses.map((analysis) => scalePointText(analysis, definition.id))),
  ]));
  const rawScaleAverages = Object.fromEntries(mhlwScaleDefinitions.map((definition) => [
    definition.id,
    average(analyses.map((analysis) => scaleRawScore(analysis, definition.id))),
  ]));
  return {
    label,
    count: analyses.length,
    highStressCount: analyses.filter((analysis) => analysis.highStress).length,
    highStressRate: percent(analyses.filter((analysis) => analysis.highStress).length, analyses.length),
    reactionAverage: average(analyses.map((analysis) => analysis.reactionTotal)),
    factorSupportAverage: average(analyses.map((analysis) => analysis.factorSupportTotal)),
    scaleAverages,
    rawScaleAverages,
    healthRisk: calculateWorkStressHealthRisk(scoredRecords),
  };
}

function buildCompanyGroupAnalysis(rows, minSize = 10) {
  const scoreableRows = rows.filter((row) => buildMhlwIndividualAnalysis(row).canScore);
  const grouped = scoreableRows.reduce((map, row) => {
    const key = groupKeyForGoogleRecord(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
    return map;
  }, new Map());
  const groups = Array.from(grouped.entries()).map(([label, records]) => ({ label, records }));
  return {
    totalRows: rows.length,
    scoreableRows: scoreableRows.length,
    overall: scoreableRows.length >= minSize ? summarizeGroup(scoreableRows, "会社全体") : null,
    visibleGroups: groups
      .filter((group) => group.records.length >= minSize)
      .map((group) => summarizeGroup(group.records, group.label))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja")),
    suppressedGroups: groups
      .filter((group) => group.records.length > 0 && group.records.length < minSize)
      .map((group) => ({ label: group.label, count: group.records.length }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja")),
    minSize,
  };
}

function companyScaleRows(summary) {
  const rows = [];
  const targets = [summary.overall, ...summary.visibleGroups].filter(Boolean);
  for (const target of targets) {
    for (const definition of mhlwScaleDefinitions.filter((item) => item.domain !== "D")) {
      rows.push(`
        <tr>
          <td>${escapeHtml(target.label)}</td>
          <td>${escapeHtml(definition.label)}</td>
          <td>${escapeHtml(definition.domain)}</td>
          <td>${escapeHtml(target.scaleAverages[definition.id] || "-")}</td>
        </tr>
      `);
    }
  }
  return rows.join("");
}

function groupJudgementSvg(summary, mode) {
  const targets = [summary.overall, ...summary.visibleGroups].filter(Boolean);
  if (!targets.length) return "";
  const config = mode === "loadControl"
    ? {
        title: "仕事のストレス判定図（量-コントロール）",
        xLabel: "仕事の量的負担",
        yLabel: "仕事のコントロール",
        xId: "A_QUANTITY",
        yId: "A_CONTROL",
        riskKey: "loadControl",
        note: "右下に近いほど、仕事量が多く裁量が低い状態として注意が必要です。",
      }
    : {
        title: "仕事のストレス判定図（上司-同僚支援）",
        xLabel: "上司からのサポート",
        yLabel: "同僚からのサポート",
        xId: "C_SUPERVISOR",
        yId: "C_COWORKER",
        riskKey: "support",
        note: "左下に近いほど、支援が少ない状態として注意が必要です。",
      };
  const size = 420;
  const pad = 58;
  const plot = size - pad * 2;
  const pointFor = (value) => pad + ((Number(value) - 3) / 9) * plot;
  const yFor = (value) => pad + ((12 - Number(value)) / 9) * plot;
  const points = targets.map((target, index) => ({
    label: target.label,
    risk: target.healthRisk?.[config.riskKey] || "",
    x: pointFor(target.rawScaleAverages[config.xId] || 7.5),
    y: yFor(target.rawScaleAverages[config.yId] || 7.5),
    color: index === 0 ? "#9f1239" : "#2f9493",
  }));
  return `
    <section class="chart-card">
      <h2>${escapeHtml(config.title)}</h2>
      <p class="fine">${escapeHtml(config.note)} 点横の数値は、東京大学「仕事のストレス判定図」テクニカルノートの式で算出した健康リスクです。</p>
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(config.title)}">
        <rect x="${pad}" y="${pad}" width="${plot}" height="${plot}" fill="#fff" stroke="#d8e2e8" />
        <line x1="${pad}" y1="${pad + plot / 2}" x2="${pad + plot}" y2="${pad + plot / 2}" stroke="#d8e2e8" />
        <line x1="${pad + plot / 2}" y1="${pad}" x2="${pad + plot / 2}" y2="${pad + plot}" stroke="#d8e2e8" />
        <text x="${pad}" y="${size - 18}" text-anchor="middle" font-size="11" fill="#526173">3</text>
        <text x="${pad + plot}" y="${size - 18}" text-anchor="middle" font-size="11" fill="#526173">12</text>
        <text x="${pad + plot / 2}" y="${size - 16}" text-anchor="middle" font-size="13" fill="#526173">${escapeHtml(config.xLabel)} 素点</text>
        <text x="18" y="${pad + plot / 2}" transform="rotate(-90 18 ${pad + plot / 2})" text-anchor="middle" font-size="13" fill="#526173">${escapeHtml(config.yLabel)} 素点</text>
        ${points.map((point) => `
          <circle cx="${point.x}" cy="${point.y}" r="7" fill="${point.color}" />
          <text x="${point.x + 10}" y="${point.y - 8}" font-size="11" fill="#111827">${escapeHtml(point.label)}${point.risk ? ` ${escapeHtml(point.risk)}` : ""}</text>
        `).join("")}
      </svg>
    </section>
  `;
}

function buildCompanyGroupHtml(rows) {
  const summary = buildCompanyGroupAnalysis(rows);
  const names = recommendedFileNames(rows);
  const visibleRows = summary.visibleGroups.map((group) => `
    <tr>
      <td>${escapeHtml(group.label)}</td>
      <td>${escapeHtml(group.count)}</td>
      <td>${escapeHtml(group.highStressRate)}</td>
      <td>${escapeHtml(group.reactionAverage)}</td>
      <td>${escapeHtml(group.factorSupportAverage)}</td>
      <td>${escapeHtml(group.healthRisk?.loadControl || "-")}</td>
      <td>${escapeHtml(group.healthRisk?.support || "-")}</td>
      <td>${escapeHtml(group.healthRisk?.total || "-")}</td>
    </tr>
  `).join("");
  const suppressedRows = summary.suppressedGroups.map((group) => `
    <li>${escapeHtml(group.label)}: ${escapeHtml(group.count)}人（10人未満のため数値非表示）</li>
  `).join("");
  const overall = summary.overall;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ストレスチェック集団分析結果</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; background: #eef3f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
    main { max-width: 1040px; margin: 28px auto; padding: 28px; background: #fff; border: 1px solid #d8e2e8; border-radius: 8px; }
    h1, h2 { margin: 0; line-height: 1.25; }
    h1 { font-size: 1.9rem; }
    h2 { margin-top: 26px; font-size: 1.2rem; }
    p { margin: 8px 0 0; }
    .fine { color: #5b6678; font-size: 0.9rem; }
    .summary { display: grid; gap: 10px; margin-top: 18px; }
    @media (min-width: 760px) { .summary { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .box, .notice { padding: 13px 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .box strong, .box span { display: block; }
    .box strong { font-size: 1.55rem; line-height: 1.1; }
    .notice { margin-top: 18px; background: #fff8db; }
    table { width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.94rem; }
    th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #edf5f7; }
    ul { margin: 10px 0 0; }
    .chart-grid { display: grid; gap: 14px; margin-top: 14px; }
    @media (min-width: 860px) { .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .chart-card { padding: 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .chart-card svg { display: block; width: min(100%, 460px); margin: 10px auto 0; }
    .screen-actions { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 18px; }
    .screen-actions button { min-height: 42px; padding: 9px 15px; border-radius: 999px; border: 0; color: #fff; background: #2f9493; font-weight: 800; cursor: pointer; }
    @media print { body { background: #fff; } main { margin: 0; border: 0; border-radius: 0; } .screen-actions { display: none; } }
  </style>
</head>
<body>
  <main>
    <div class="screen-actions"><button type="button" onclick="window.print()">印刷 / PDF保存</button></div>
    <h1>ストレスチェック集団分析結果</h1>
    <p class="fine">企業担当者向け資料です。個人名、受検者ID、個人別の高ストレス判定は含めていません。10人未満の集団は個人特定防止のため数値を非表示にしています。PDF保存名の例: ${escapeHtml(names.company)}</p>
    <div class="summary">
      <div class="box"><span>読取件数</span><strong>${escapeHtml(summary.totalRows)}</strong></div>
      <div class="box"><span>分析対象</span><strong>${escapeHtml(summary.scoreableRows)}</strong></div>
      <div class="box"><span>表示集団</span><strong>${escapeHtml(summary.visibleGroups.length)}</strong></div>
      <div class="box"><span>非表示集団</span><strong>${escapeHtml(summary.suppressedGroups.length)}</strong></div>
      <div class="box"><span>実施ID</span><strong style="font-size:1rem">${escapeHtml(currentRunId || "-")}</strong></div>
    </div>
    ${overall ? `
      <h2>会社全体</h2>
      <div class="summary">
        <div class="box"><span>対象人数</span><strong>${escapeHtml(overall.count)}</strong></div>
        <div class="box"><span>高ストレス者割合</span><strong>${escapeHtml(overall.highStressRate)}</strong></div>
        <div class="box"><span>心身反応6尺度 平均</span><strong>${escapeHtml(overall.reactionAverage)}</strong></div>
        <div class="box"><span>要因+サポート12尺度 平均</span><strong>${escapeHtml(overall.factorSupportAverage)}</strong></div>
      </div>
      <div class="summary">
        <div class="box"><span>量-コントロール健康リスク</span><strong>${escapeHtml(overall.healthRisk?.loadControl || "-")}</strong></div>
        <div class="box"><span>職場の支援健康リスク</span><strong>${escapeHtml(overall.healthRisk?.support || "-")}</strong></div>
        <div class="box"><span>総合健康リスク</span><strong>${escapeHtml(overall.healthRisk?.total || "-")}</strong></div>
        <div class="box"><span>算出</span><strong style="font-size:1rem">${escapeHtml(overall.healthRisk?.source || "-")}</strong></div>
      </div>
    ` : `<div class="notice"><strong>会社全体の数値は表示できません。</strong><br>判定可能な回答が${summary.minSize}人未満です。</div>`}

    <div class="chart-grid">
      ${groupJudgementSvg(summary, "loadControl")}
      ${groupJudgementSvg(summary, "support")}
    </div>

    <h2>集団別サマリー</h2>
    ${summary.visibleGroups.length ? `
      <table>
        <thead><tr><th>集団</th><th>人数</th><th>高ストレス者割合</th><th>心身反応6尺度 平均</th><th>要因+サポート12尺度 平均</th><th>量-コントロール</th><th>職場の支援</th><th>総合健康リスク</th></tr></thead>
        <tbody>${visibleRows}</tbody>
      </table>
    ` : `<p>10人以上の表示可能な集団はありません。</p>`}

    <h2>尺度別平均</h2>
    <p class="fine">評価点は1〜5点です。1点に近いほどストレス状況がよくない方向、5点に近いほどよい方向を示します。満足度Dは高ストレス者判定には含めていません。</p>
    <table>
      <thead><tr><th>集団</th><th>尺度</th><th>領域</th><th>平均評価点</th></tr></thead>
      <tbody>${companyScaleRows(summary)}</tbody>
    </table>

    <h2>非表示の集団</h2>
    ${summary.suppressedGroups.length ? `<ul>${suppressedRows}</ul>` : `<p>10人未満で非表示にした集団はありません。</p>`}

    <h2>会社側で扱う範囲</h2>
    <p>この資料は職場環境改善のための集団分析です。個人結果、個人別の高ストレス者判定、医師面接指導の対象者情報は、本人同意がない限り会社側へ共有しないでください。</p>
  </main>
</body>
</html>`;
}

function buildImplementationRecordHtml(rows) {
  const names = recommendedFileNames(rows);
  const analyses = rows.map(buildMhlwIndividualAnalysis);
  const scoreableCount = analyses.filter((item) => item.canScore).length;
  const highStressCount = analyses.filter((item) => item.highStress).length;
  const blockedRows = rows.filter((row) => importIssues(row).length);
  const warningRows = rows.filter((row) => importWarnings(row).length);
  const summary = buildCompanyGroupAnalysis(rows);
  const legalChecks = getLegalOperationChecks();
  const settings = getImplementationSettings();
  const uncheckedLegalChecks = legalChecks.filter((item) => !item.checked);
  const visibleRows = [summary.overall, ...summary.visibleGroups].filter(Boolean).map((group) => `
    <tr>
      <td>${escapeHtml(group.label)}</td>
      <td>${escapeHtml(group.count)}</td>
      <td>${escapeHtml(group.highStressRate)}</td>
      <td>${escapeHtml(group.healthRisk?.loadControl || "-")}</td>
      <td>${escapeHtml(group.healthRisk?.support || "-")}</td>
      <td>${escapeHtml(group.healthRisk?.total || "-")}</td>
    </tr>
  `).join("");
  const suppressedRows = summary.suppressedGroups.map((group) => `
    <tr><td>${escapeHtml(group.label)}</td><td>${escapeHtml(group.count)}</td><td>10人未満のため数値非表示</td></tr>
  `).join("");
  const logRows = operationLog.map((item) => `
    <tr>
      <td>${escapeHtml(item.timestamp)}</td>
      <td>${escapeHtml(item.runId || "-")}</td>
      <td>${escapeHtml(item.action)}</td>
      <td>${escapeHtml(item.detail || "")}</td>
    </tr>
  `).join("");
  const legalCheckRows = legalChecks.map((item) => `
    <tr>
      <td>${item.checked ? "確認済み" : "未確認"}</td>
      <td>${escapeHtml(item.label)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ストレスチェック実施記録</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; background: #eef3f6; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; }
    main { max-width: 1040px; margin: 28px auto; padding: 28px; background: #fff; border: 1px solid #d8e2e8; border-radius: 8px; }
    h1, h2 { margin: 0; line-height: 1.25; }
    h1 { font-size: 1.9rem; }
    h2 { margin-top: 26px; font-size: 1.2rem; }
    p { margin: 8px 0 0; }
    .fine { color: #5b6678; font-size: 0.9rem; }
    .summary { display: grid; gap: 10px; margin-top: 18px; }
    @media (min-width: 760px) { .summary { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
    .box, .notice { padding: 13px 14px; border-radius: 8px; background: #f8fbfc; border: 1px solid #d8e2e8; }
    .box strong, .box span { display: block; }
    .box strong { font-size: 1.45rem; line-height: 1.1; }
    .notice { margin-top: 18px; background: #fff8db; }
    table { width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.94rem; }
    th, td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
    th { background: #edf5f7; }
    .screen-actions { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 18px; }
    .screen-actions button { min-height: 42px; padding: 9px 15px; border-radius: 999px; border: 0; color: #fff; background: #2f9493; font-weight: 800; cursor: pointer; }
    @media print { body { background: #fff; } main { margin: 0; border: 0; border-radius: 0; } .screen-actions { display: none; } }
  </style>
</head>
<body>
  <main>
    <div class="screen-actions"><button type="button" onclick="window.print()">印刷 / PDF保存</button></div>
    <h1>ストレスチェック実施記録</h1>
    <p class="fine">この帳票は実施者・事務局向けの保管用記録です。本人向け結果そのもの、個人別の高ストレス判定、個人名は載せていません。PDF保存名の例: ${escapeHtml(names.implementation)}</p>
    <div class="summary">
      <div class="box"><span>CSV読込件数</span><strong>${escapeHtml(rows.length)}</strong></div>
      <div class="box"><span>判定可能</span><strong>${escapeHtml(scoreableCount)}</strong></div>
      <div class="box"><span>判定不可</span><strong>${escapeHtml(analyses.length - scoreableCount)}</strong></div>
      <div class="box"><span>高ストレス該当</span><strong>${escapeHtml(highStressCount)}</strong></div>
      <div class="box"><span>実施ID</span><strong style="font-size:1rem">${escapeHtml(currentRunId || "-")}</strong></div>
    </div>
    <div class="notice">
      <strong>運用確認</strong>
      <p>本人向け結果は本人へ通知し、本人同意なしに会社側へ個人結果・高ストレス者判定を共有しない運用を前提にしてください。集団分析は10人未満の集団を非表示にしています。</p>
      <p>${uncheckedLegalChecks.length ? `未確認の運用チェックが ${uncheckedLegalChecks.length}件あります。実施完了前に確認してください。` : "実施前チェックはすべて確認済みです。"}</p>
    </div>

    <h2>実施前チェック</h2>
    <table>
      <thead><tr><th>状態</th><th>確認項目</th></tr></thead>
      <tbody>${legalCheckRows || `<tr><td colspan="2">チェック項目を取得できませんでした。</td></tr>`}</tbody>
    </table>

    <h2>本人通知・面接指導案内</h2>
    <table>
      <tbody>
        <tr><th>実施者名</th><td>${escapeHtml(settings.operator || "未入力")}</td></tr>
        <tr><th>面接指導の申出先</th><td>${escapeHtml(settings.interviewContact || "未入力")}</td></tr>
        <tr><th>申出期限</th><td>${escapeHtml(settings.interviewDeadline || "未入力")}</td></tr>
      </tbody>
    </table>

    <h2>読込・補完状況</h2>
    <table>
      <tbody>
        <tr><th>保存不可行</th><td>${escapeHtml(blockedRows.length)}件</td></tr>
        <tr><th>基本情報不足見込み</th><td>${escapeHtml(warningRows.length)}件</td></tr>
        <tr><th>57項目認識</th><td>${escapeHtml(googleImportDiagnostics?.recognizedQuestionCount || 0)}/57</td></tr>
        <tr><th>未認識列</th><td>${escapeHtml((googleImportDiagnostics?.unknownHeaders || []).slice(0, 20).join("、") || "なし")}</td></tr>
      </tbody>
    </table>

    <h2>企業向け集団分析サマリー</h2>
    ${visibleRows ? `
      <table>
        <thead><tr><th>集団</th><th>人数</th><th>高ストレス者割合</th><th>量-コントロール</th><th>職場の支援</th><th>総合健康リスク</th></tr></thead>
        <tbody>${visibleRows}</tbody>
      </table>
    ` : `<p>10人以上の表示可能な集団はありません。</p>`}

    <h2>非表示集団</h2>
    ${suppressedRows ? `
      <table>
        <thead><tr><th>集団</th><th>人数</th><th>理由</th></tr></thead>
        <tbody>${suppressedRows}</tbody>
      </table>
    ` : `<p>10人未満で非表示にした集団はありません。</p>`}

    <h2>操作ログ</h2>
    <p class="fine">操作ログには個人名、受検者ID、配布コード、回答内容、点数、高ストレス判定を記録しません。</p>
    ${logRows ? `
      <table>
        <thead><tr><th>日時</th><th>実施ID</th><th>操作</th><th>詳細</th></tr></thead>
        <tbody>${logRows}</tbody>
      </table>
    ` : `<p>この画面で記録された操作ログはまだありません。</p>`}
  </main>
</body>
</html>`;
}

const editableBasicFields = [
  ["respondentId", "受検者ID", "text"],
  ["personName", "氏名", "text"],
  ["kanaName", "フリガナ", "text"],
  ["birthDate", "生年月日", "date"],
  ["gender", "性別", "select"],
  ["workplaceCode", "職場コード", "text"],
  ["workplaceName", "職場名", "text"],
  ["department", "部署", "text"],
];

function needsBasicInfoEdit(row) {
  return importIssues(row).length || importWarnings(row).length || !normalizeGenderForMhlw(row.gender);
}

function renderBasicInfoEditor(rows) {
  if (!basicInfoEditor) return;
  const targets = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => needsBasicInfoEdit(row));

  if (!targets.length) {
    basicInfoEditor.innerHTML = "";
    return;
  }

  basicInfoEditor.innerHTML = `
    <div class="basic-info-editor-head">
      <strong>不足情報をその場で入力</strong>
      <span>性別が入ると本人向け結果の判定が可能になります。入力内容はこの画面内だけで使い、サーバーには保存しません。</span>
    </div>
    <div class="basic-info-row-list">
      ${targets.slice(0, 50).map(({ row, index }) => `
        <section class="basic-info-row" data-row-index="${index}">
          <h3>CSV ${escapeHtml(row.sourceRowNumber)}行目 / ${escapeHtml(row.respondentId || row.participantCode || "ID未設定")}</h3>
          <div class="basic-info-grid">
            ${editableBasicFields.map(([field, label, type]) => {
              if (type === "select") {
                return `
                  <label>
                    <span>${label}</span>
                    <select data-basic-field="${field}">
                      <option value="">選択</option>
                      <option value="男性" ${normalizeGenderForMhlw(row[field]) === "male" ? "selected" : ""}>男性</option>
                      <option value="女性" ${normalizeGenderForMhlw(row[field]) === "female" ? "selected" : ""}>女性</option>
                    </select>
                  </label>
                `;
              }
              return `
                <label>
                  <span>${label}</span>
                  <input type="${type}" data-basic-field="${field}" value="${escapeHtml(row[field] || "")}">
                </label>
              `;
            }).join("")}
          </div>
        </section>
      `).join("")}
      ${targets.length > 50 ? `<p class="fine">残り ${targets.length - 50}件は省略しています。補完CSVを使うと一括補完できます。</p>` : ""}
    </div>
  `;
}

function refreshAnalysisAfterBasicEdit(redrawEditor = false) {
  renderIndividualAnalysisPreview(googleImportRows);
  if (redrawEditor) renderBasicInfoEditor(googleImportRows);
  const blockedRows = googleImportRows.filter((row) => importIssues(row).length);
  const matchedRows = googleImportRows.filter((row) => row.matchedRoster).length;
  const type = blockedRows.length ? "error" : "success";
  setGoogleImportMessage(`${googleImportRows.length}件を確認しました。名簿照合 ${matchedRows}件。${blockedRows.length ? "保存できない行があります。" : "この内容で結果出力できます。"}`, type);
}

function renderIndividualAnalysisPreview(rows) {
  if (!individualAnalysisPreview) return;
  if (!rows.length) {
    renderEmpty(individualAnalysisPreview, "CSVを確認すると、厚労省57項目の素点換算表方式に基づく個人分析を表示します。");
    renderCompletionChecklist([]);
    if (downloadIndividualAnalysisCsv) downloadIndividualAnalysisCsv.disabled = true;
    if (downloadPersonalResultHtml) downloadPersonalResultHtml.disabled = true;
    if (downloadCompanyGroupHtml) downloadCompanyGroupHtml.disabled = true;
    if (downloadImplementationRecordHtml) downloadImplementationRecordHtml.disabled = true;
    return;
  }

  const analyses = rows.map(buildMhlwIndividualAnalysis);
  const scoreableCount = analyses.filter((item) => item.canScore).length;
  const highStressCount = analyses.filter((item) => item.highStress).length;
  const groupAnalysis = buildCompanyGroupAnalysis(rows);
  const settings = getImplementationSettings();
  const missingGuidance = [
    !settings.operator ? "実施者名" : "",
    !settings.interviewContact ? "面接指導の申出先" : "",
    !settings.interviewDeadline ? "申出期限" : "",
  ].filter(Boolean);
  if (downloadIndividualAnalysisCsv) downloadIndividualAnalysisCsv.disabled = !rows.length;
  if (downloadPersonalResultHtml) downloadPersonalResultHtml.disabled = !scoreableCount;
  if (downloadCompanyGroupHtml) downloadCompanyGroupHtml.disabled = !groupAnalysis.overall && !groupAnalysis.visibleGroups.length;
  if (downloadImplementationRecordHtml) downloadImplementationRecordHtml.disabled = !rows.length;
  renderCompletionChecklist(rows);

  individualAnalysisPreview.innerHTML = [
    `<div class="suppressed-item"><strong>個人分析（厚労省57項目・素点換算表方式）</strong><span>判定可能 ${scoreableCount}件 / 高ストレス者判定該当 ${highStressCount}件 / 判定不可 ${analyses.length - scoreableCount}件。満足度Dは高ストレス者判定に含めていません。</span></div>`,
    `<div class="suppressed-item"><strong>本人向け結果</strong><span>${scoreableCount ? "「本人向け結果を開く」で、判定可能な受検者の本人通知画面を開けます。" : "本人向け結果を出すには、57項目回答と性別が必要です。"}</span></div>`,
    `<div class="suppressed-item"><strong>企業向け集団分析</strong><span>${groupAnalysis.overall || groupAnalysis.visibleGroups.length ? `会社全体または10人以上の集団を表示できます。表示集団 ${groupAnalysis.visibleGroups.length}件 / 非表示集団 ${groupAnalysis.suppressedGroups.length}件。` : "企業向け集団分析を出すには、判定可能な回答が10人以上必要です。"}</span></div>`,
    `<div class="suppressed-item"><strong>本人通知・面接指導案内</strong><span>${missingGuidance.length ? `未入力: ${missingGuidance.join("、")}。本人向け結果を出す前に入力してください。` : "実施者名・申出先・申出期限を本人向け結果に反映します。"}</span></div>`,
    `<div class="suppressed-item"><strong>法定運用メモ</strong><span>個人結果と高ストレス該当情報は実施者管理です。本人通知、面接指導の申出対応、会社側への本人同意なし非開示を前提に扱ってください。</span></div>`,
    ...analyses.slice(0, 12).map((analysis) => {
      const label = analysis.canScore ? (analysis.highStress ? "高ストレス者判定該当" : "非該当") : "判定不可";
      const id = analysis.respondentId || analysis.participantCode || "-";
      const name = analysis.personName || "-";
      const scores = analysis.canScore
        ? `B反応6尺度 ${analysis.reactionTotal}点 / A+C 12尺度 ${analysis.factorSupportTotal}点 / 活気 ${scalePointText(analysis, "B_VIGOR")}・不安 ${scalePointText(analysis, "B_ANXIETY")}・抑うつ ${scalePointText(analysis, "B_DEPRESSION")}`
        : analysis.reason;
      const action = analysis.canScore ? `<button type="button" class="btn btn-outline btn-sm personal-result-action" data-row-index="${index}">本人向け結果を開く</button>` : "";
      return `<div class="suppressed-item"><strong>${escapeHtml(`CSV ${analysis.sourceRowNumber}行目 / ${id} / ${name} / ${label}`)}</strong><span>${escapeHtml(scores)}</span>${action}</div>`;
    }),
    analyses.length > 12 ? `<div class="suppressed-item">残り ${analyses.length - 12}件は省略表示しています。全件は「個人分析CSVを保存」で確認してください。</div>` : "",
  ].join("");
}

function importWarnings(record) {
  const warnings = [];
  for (const [key, label] of [
    ["personName", "氏名"],
    ["kanaName", "フリガナ"],
    ["birthDate", "生年月日"],
    ["gender", "性別"],
    ["workplaceCode", "職場コード"],
  ]) {
    if (!record[key]) warnings.push(label);
  }
  return warnings;
}

function googleImportKey(row) {
  return cleanText(row.participantCode || row.respondentId);
}

function buildGoogleImportDiagnostics(headers, fields, records) {
  const recognizedQuestions = Array.from(new Set(fields
    .filter((field) => field.startsWith("answer:"))
    .map((field) => field.slice("answer:".length))));
  const recognizedMeta = fields.filter((field) => field && !field.startsWith("answer:")).length;
  const unknownHeaders = headers
    .map((header, index) => ({ header, index, field: fields[index] }))
    .filter((item) => item.header && !item.field)
    .map((item) => item.header);
  const duplicateKeys = duplicatedKeys(countBy(records, googleImportKey));
  const completeRows = records.filter((record) => !importIssues(record).length).length;

  return {
    headers,
    recognizedQuestionCount: recognizedQuestions.length,
    recognizedMetaCount: recognizedMeta,
    unknownHeaders,
    duplicateKeys,
    completeRows,
  };
}

function parseGoogleFormCsv(text) {
  const rows = parseCsvText(text);
  googleImportDiagnostics = null;
  if (rows.length < 2) return [];

  const headers = rows[0];
  const fields = headers.map(resolveGoogleResponseField);
  const supplementalRows = basicInfoSource ? parseBasicInfoSource(basicInfoSource.value) : [];
  const lookups = buildRosterLookups(supplementalRows);
  const records = rows.slice(1).map((cells, index) => {
    const raw = { answers: {}, sourceRowNumber: index + 2 };
    fields.forEach((field, cellIndex) => {
      if (!field) return;
      const value = cells[cellIndex] || "";
      if (field.startsWith("answer:")) {
        raw.answers[field.slice("answer:".length)] = parseAnswerValue(value);
      } else {
        raw[field] = value;
      }
    });
    const enriched = enrichGoogleRecord(raw, lookups);
    if (enriched.matchedRoster || !supplementalRows[index]) return enriched;
    return mergeSupplementalInfo(enriched, supplementalRows[index]);
  });

  const duplicateCounts = countBy(records, googleImportKey);
  records.forEach((record) => {
    const key = googleImportKey(record);
    record.csvDuplicate = Boolean(key && duplicateCounts.get(key) > 1);
  });
  googleImportDiagnostics = buildGoogleImportDiagnostics(headers, fields, records);
  return records;
}

function renderGoogleImportPreview(rows) {
  if (!rows.length) {
    renderEmpty(googleImportPreview, "CSVを読み込めませんでした。1行目が見出し、2行目以降が回答になっているか確認してください。");
    renderIndividualAnalysisPreview([]);
    renderBasicInfoEditor([]);
    importGoogleCsv.disabled = true;
    downloadGoogleImportCheck.disabled = true;
    if (downloadIndividualAnalysisCsv) downloadIndividualAnalysisCsv.disabled = true;
    return;
  }

  const blockedRows = rows.filter((row) => importIssues(row).length);
  const warningRows = rows.filter((row) => importWarnings(row).length);
  const matchedRows = rows.filter((row) => row.matchedRoster).length;
  importGoogleCsv.disabled = isPublicStaticPage || Boolean(blockedRows.length);
  downloadGoogleImportCheck.disabled = false;
  renderBasicInfoEditor(rows);
  renderIndividualAnalysisPreview(rows);
  const diagnostics = googleImportDiagnostics || {};
  const duplicateCount = rows.filter((row) => row.csvDuplicate).length;
  const answerCount = diagnostics.recognizedQuestionCount || 0;
  const unknownHeaders = diagnostics.unknownHeaders || [];
  const warningLabels = Array.from(new Set(rows.flatMap((row) => importWarnings(row))));
  const issueLabels = Array.from(new Set(rows.flatMap((row) => importIssues(row))));
  const answerMissingRows = rows.filter((row) => missingAnswerKeys(row).length).length;
  const nextAction = blockedRows.length
    ? "保存不可の行があります。保存不可理由と回答不足項目を直してから、もう一度CSVを確認してください。"
    : warningRows.length
      ? "回答57項目は読めています。厚労省CSVに出す場合は、不足している基本情報を名簿CSVで補完するか、Googleフォーム側に項目を追加してください。個人分析・集団分析だけならローカル版で保存できます。"
      : isPublicStaticPage
        ? "CSVは確認できました。保存まで行う場合はローカル版を起動してください。"
        : "問題ありません。ローカル版では「回答をローカル保存」を押して保存できます。";
  const columnStatus = answerCount === questionOrder.length
    ? "57項目すべて認識"
    : `回答列認識 ${answerCount}/57。Googleフォームの設問見出しが A1. / B1. で始まるか確認`;

  googleImportPreview.innerHTML = [
    `<div class="suppressed-item"><strong>確認サマリー</strong><span>回答 ${rows.length}件 / 設問 ${answerCount}/57 / 保存不可 ${blockedRows.length}件 / 厚労省CSV不足見込み ${warningRows.length}件</span></div>`,
    `<div class="suppressed-item"><strong>実施ID</strong><span>${escapeHtml(currentRunId || "-")}</span></div>`,
    `<div class="suppressed-item"><strong>次にやること</strong><span>${escapeHtml(nextAction)}</span></div>`,
    warningLabels.length ? `<div class="suppressed-item"><strong>不足している基本情報</strong><span>${escapeHtml(warningLabels.join("、"))}</span></div>` : `<div class="suppressed-item"><strong>不足している基本情報</strong><span>ありません</span></div>`,
    issueLabels.length || answerMissingRows ? `<div class="suppressed-item"><strong>保存不可の理由</strong><span>${escapeHtml(issueLabels.join("、") || "回答不足があります")}</span></div>` : `<div class="suppressed-item"><strong>保存不可の理由</strong><span>ありません</span></div>`,
    `<div class="suppressed-item"><strong>読込件数</strong><span>${rows.length}件 / 名簿照合 ${matchedRows}件 / 保存不可 ${blockedRows.length}件 / 厚労省CSV不足見込み ${warningRows.length}件</span></div>`,
    `<div class="suppressed-item"><strong>列認識</strong><span>${escapeHtml(columnStatus)} / 基本項目 ${diagnostics.recognizedMetaCount || 0}列 / 未認識 ${unknownHeaders.length}列</span></div>`,
    duplicateCount ? `<div class="suppressed-item"><strong>CSV内重複</strong><span>${duplicateCount}行。同じ受検者がCSV内に複数あります。保存前にCSVを整理してください。</span></div>` : `<div class="suppressed-item"><strong>CSV内重複</strong><span>ありません。</span></div>`,
    unknownHeaders.length ? `<div class="suppressed-item"><strong>未認識列</strong><span>${escapeHtml(unknownHeaders.slice(0, 12).join("、"))}${unknownHeaders.length > 12 ? " ほか" : ""}</span></div>` : "",
    ...rows.slice(0, 12).map((row) => {
      const issues = importIssues(row);
      const warnings = importWarnings(row);
      const note = issues.length
        ? `保存不可: ${issues.join("、")}`
        : warnings.length
          ? `保存可。ただし厚労省CSV不足: ${warnings.join("、")}`
          : "保存可";
      const matched = row.matchedRoster ? "名簿照合あり" : "名簿照合なし";
      return `<div class="suppressed-item"><strong>${escapeHtml(`CSV ${row.sourceRowNumber}行目 / ${row.respondentId || "-"}`)}</strong><span>${escapeHtml(`${note} / ${matched}`)}</span></div>`;
    }),
    rows.length > 12 ? `<div class="suppressed-item">残り ${rows.length - 12}件は省略表示しています。</div>` : "",
  ].join("");
}

async function handlePreviewGoogleCsv() {
  const file = googleCsvFile.files?.[0];
  if (!file) {
    setGoogleImportMessage("Googleフォームから保存したCSVファイルを選択してください。", "error");
    renderGoogleImportPreview([]);
    return;
  }

  try {
    const text = await file.text();
    currentRunId = createRunId("SC");
    googleImportRows = parseGoogleFormCsv(text);
    renderGoogleImportPreview(googleImportRows);
    if (!googleImportRows.length) {
      setGoogleImportMessage("CSVの回答行を認識できませんでした。", "error");
      return;
    }

    const blockedRows = googleImportRows.filter((row) => importIssues(row).length);
    const matchedRows = googleImportRows.filter((row) => row.matchedRoster).length;
    const type = blockedRows.length ? "error" : "success";
    setGoogleImportMessage(`${googleImportRows.length}件を確認しました。名簿照合 ${matchedRows}件。${blockedRows.length ? "保存できない行があります。" : "この内容でローカル保存できます。"}`, type);
    addOperationLog("CSV確認", { matchedRows, blockedRows: blockedRows.length });
  } catch (error) {
    setGoogleImportMessage(`CSV確認に失敗しました。理由: ${error.message}`, "error");
    renderGoogleImportPreview([]);
  }
}

async function handleLoadSampleCsv() {
  try {
    const response = await fetch("sample-group-analysis.csv", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    currentRunId = createRunId("SAMPLE");
    googleImportRows = parseGoogleFormCsv(text);
    renderGoogleImportPreview(googleImportRows);
    if (!googleImportRows.length) {
      setGoogleImportMessage("サンプルCSVを読み込めませんでした。", "error");
      return;
    }
    setGoogleImportMessage("サンプルCSVを読み込みました。本人向け結果・企業向け集団分析・実施記録を試せます。", "success");
    addOperationLog("サンプルCSV確認", { rows: googleImportRows.length });
  } catch (error) {
    setGoogleImportMessage(`サンプルCSVの読み込みに失敗しました。理由: ${error.message}`, "error");
  }
}

async function handleImportGoogleCsv() {
  if (isPublicStaticPage) {
    setGoogleImportMessage("GitHub Pages版ではサーバー保存はできません。CSV確認と取込チェックCSV保存はこの画面で使えます。回答を保存する場合はローカル版を起動してください。", "info");
    importGoogleCsv.disabled = true;
    return;
  }

  if (!googleImportRows.length || googleImportRows.some((row) => importIssues(row).length)) {
    setGoogleImportMessage("保存前にCSVを確認してください。保存不可の行がある場合は修正が必要です。", "error");
    return;
  }

  try {
    const response = await fetch("/api/stress-check-admin/import-google-form-csv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
      },
      body: JSON.stringify({ records: googleImportRows }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "保存できませんでした。");

    setGoogleImportMessage(`${result.importedCount}件をローカル保存しました。厚労省CSV不足見込み ${result.incompleteForMhlwCount}件。`, "success");
    googleImportRows = [];
    importGoogleCsv.disabled = true;
    await Promise.all([loadSummary(), loadStoredResponses()]);
  } catch (error) {
    setGoogleImportMessage(`ローカル保存に失敗しました。理由: ${error.message}`, "error");
  }
}

function buildParticipantUrl(row) {
  const url = new URL("stress-check-form.html", location.href);
  url.searchParams.set("code", row.accessCode);
  return url.href;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function buildParticipantCsv(rows) {
  const output = [
    ["社員ID", "氏名", "職場コード", "職場名", "部署", "変数値", "受検コード", "ローカルフォームURL"],
    ...rows.map((row) => [
      row.id,
      row.name,
      row.workplaceCode,
      row.workplaceName,
      row.department,
      row.variable,
      row.accessCode,
      row.url,
    ]),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function generateAccessCode(usedCodes = new Set()) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  let code = "";
  do {
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }
    code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

function getStatus(row) {
  const submittedAt = submittedCodeMap.get(row.accessCode) || submittedMap.get(row.id);
  return {
    label: submittedAt ? "受検済み" : "未受検",
    submittedAt: submittedAt || "",
  };
}

function buildStatusCsv(rows) {
  const output = [
    ["社員ID", "氏名", "職場コード", "職場名", "部署", "変数値", "受検コード", "受検状況", "受検日時"],
    ...rows.map((row) => {
      const status = getStatus(row);
      return [
        row.id,
        row.name,
        row.workplaceCode,
        row.workplaceName,
        row.department,
        row.variable,
        row.accessCode,
        status.label,
        status.submittedAt,
      ];
    }),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function pendingRows(rows) {
  return rows.filter((row) => !getStatus(row).submittedAt);
}

function buildPendingCsv(rows) {
  const output = [
    ["社員ID", "氏名", "職場コード", "職場名", "部署", "変数値", "受検コード", "ローカルフォームURL"],
    ...pendingRows(rows).map((row) => [
      row.id,
      row.name,
      row.workplaceCode,
      row.workplaceName,
      row.department,
      row.variable,
      row.accessCode,
      row.url,
    ]),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function buildCompanySummaryCsv(rows) {
  const total = rows.length;
  const submitted = rows.filter((row) => getStatus(row).submittedAt).length;
  const pending = total - submitted;
  const rate = total ? `${Math.round((submitted / total) * 1000) / 10}%` : "0%";
  const groupCounts = Array.from(countBy(rows, groupKeyForParticipant).entries());
  const visibleGroups = groupCounts.filter(([, count]) => count >= 10);
  const suppressedGroups = groupCounts.filter(([, count]) => count > 0 && count < 10);

  const output = [
    ["区分", "項目", "値", "備考"],
    ["全体", "対象人数", total, "名簿貼り付け件数"],
    ["全体", "受検済み", submitted, "回答内容・点数・高ストレス判定は含まない"],
    ["全体", "未受検", pending, "督促管理用"],
    ["全体", "受検率", rate, ""],
    ["集団分析", "表示可能集団数", visibleGroups.length, "10人以上"],
    ["集団分析", "非表示集団数", suppressedGroups.length, "10人未満は個人特定防止のため非表示"],
    ...visibleGroups.map(([group, count]) => ["表示可能集団", group, count, "集団分析対象"]),
    ...suppressedGroups.map(([group, count]) => ["非表示集団", group, count, "10人未満"]),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function clientAuditStats(action, rows) {
  const submitted = rows.filter((row) => getStatus(row).submittedAt).length;
  const pending = rows.length - submitted;
  const groupCounts = Array.from(countBy(rows, groupKeyForParticipant).values());
  return {
    action,
    rosterTargetResponses: rows.length,
    submittedCount: submitted,
    pendingCount: pending,
    visibleGroupCount: groupCounts.filter((count) => count >= 10).length,
    suppressedGroupCount: groupCounts.filter((count) => count > 0 && count < 10).length,
  };
}

async function loadAuditLog() {
  const auditResponse = await fetch("/api/stress-check-admin/audit-log", { headers: adminHeaders() });
  const audit = await auditResponse.json();
  if (auditResponse.ok) renderAuditLog(audit.auditLog || []);
}

async function logClientAudit(action, rows = generatedParticipants) {
  if (isPublicStaticPage || !rows.length) return;
  try {
    await fetch("/api/stress-check-admin/audit-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...adminHeaders(),
      },
      body: JSON.stringify(clientAuditStats(action, rows)),
    });
    await loadAuditLog();
  } catch {
    // Logging must not block CSV download or printing.
  }
}

function qrSrc(url) {
  return `/api/qr.svg?data=${encodeURIComponent(url)}`;
}

function renderQrCell(row) {
  if (!qrAvailable) return `<span class="participant-qr-unavailable">ローカルQR生成が使えません</span>`;
  return `<img class="participant-qr" src="${escapeHtml(qrSrc(row.url))}" alt="${escapeHtml(row.id)}のQRコード" loading="lazy">`;
}

function renderParticipants(rows) {
  if (!rows.length) {
    participantRows.innerHTML = `<tr><td colspan="8">社員IDを含む名簿を貼り付けてください。</td></tr>`;
    renderParticipantChecks([]);
    downloadParticipantUrls.disabled = true;
    downloadStatusCsv.disabled = true;
    downloadPendingCsv.disabled = true;
    downloadCompanySummaryCsv.disabled = true;
    printParticipantQrSheet.disabled = true;
    printPendingQrSheet.disabled = true;
    return;
  }
  const pending = pendingRows(rows);
  participantRows.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.id)}</td>
      <td><code>${escapeHtml(row.accessCode)}</code></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.workplaceName || row.department || row.workplaceCode)}</td>
      <td>${escapeHtml(row.variable)}</td>
      <td><span class="status-pill ${getStatus(row).submittedAt ? "done" : "pending"}">${escapeHtml(getStatus(row).label)}</span></td>
      <td>${renderQrCell(row)}</td>
      <td><a href="${escapeHtml(row.url)}" target="_blank" rel="noreferrer">${escapeHtml(row.url)}</a></td>
    </tr>
  `).join("");
  downloadParticipantUrls.disabled = false;
  downloadStatusCsv.disabled = false;
  downloadPendingCsv.disabled = !pending.length;
  downloadCompanySummaryCsv.disabled = false;
  printParticipantQrSheet.disabled = !qrAvailable;
  printPendingQrSheet.disabled = !qrAvailable || !pending.length;
}

function renderQrSheet(rows, title = "ローカルフォームURL 配布シート") {
  participantQrSheet.innerHTML = `
    <div class="qr-sheet-head">
      <p>ストレスチェック回答用QRコード</p>
      <h1>${escapeHtml(title)}</h1>
      <span>会社担当者には回答内容・点数・高ストレス判定を共有しません。</span>
    </div>
    <div class="qr-card-grid">
      ${rows.map((row) => `
        <article class="qr-card">
          <div>
            <span>社員ID</span>
            <strong>${escapeHtml(row.id)}</strong>
          </div>
          <div>
            <span>受検コード</span>
            <strong>${escapeHtml(row.accessCode)}</strong>
          </div>
          <div>
            <span>氏名</span>
            <strong>${escapeHtml(row.name || "-")}</strong>
          </div>
          <img src="${escapeHtml(qrSrc(row.url))}" alt="${escapeHtml(row.id)}のQRコード">
          <p>${escapeHtml(row.url)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function waitForImages(target) {
  const images = Array.from(target.querySelectorAll("img"));
  return Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function handlePrintParticipantQrSheet() {
  if (!generatedParticipants.length || !qrAvailable) return;
  await logClientAudit("QR配布シート印刷", generatedParticipants);
  renderQrSheet(generatedParticipants);
  participantQrSheet.hidden = false;
  document.body.classList.add("printing-qr-sheet");
  await waitForImages(participantQrSheet);
  window.print();
}

async function handlePrintPendingQrSheet() {
  const pending = pendingRows(generatedParticipants);
  if (!pending.length || !qrAvailable) return;
  await logClientAudit("未受検者QR印刷", pending);
  renderQrSheet(pending, "未受検者QR 再配布シート");
  participantQrSheet.hidden = false;
  document.body.classList.add("printing-qr-sheet");
  await waitForImages(participantQrSheet);
  window.print();
}

function handleGenerateParticipantUrls() {
  const usedCodes = new Set();
  generatedParticipants = parseParticipantSource(participantSource.value).map((row) => {
    const enrichedRow = {
      ...row,
      accessCode: row.accessCode || generateAccessCode(usedCodes),
    };
    if (row.accessCode) usedCodes.add(row.accessCode);
    return {
      ...enrichedRow,
      url: buildParticipantUrl(enrichedRow),
    };
  });
  renderParticipants(generatedParticipants);
  renderParticipantChecks(analyzeParticipants(generatedParticipants));
  if (generatedParticipants.length) {
    const qrNote = qrAvailable ? "QR配布シートも印刷できます。" : "QR生成ライブラリが見つからないため、URL配布のみ利用できます。";
    setParticipantMessage(`${generatedParticipants.length}件の名簿を読み込みました。GoogleフォームCSV取込時の照合に使えます。代替用のローカルフォームURLにはランダムな受検コードだけを入れ、社員ID・氏名・生年月日・性別は入れていません。名簿は保存していません。${qrNote}`, "success");
  } else {
    setParticipantMessage("社員IDを含むヘッダー行と名簿行を貼り付けてください。", "error");
  }
}

function handleDownloadParticipantUrls() {
  if (!generatedParticipants.length) return;
  void logClientAudit("ローカル配布用CSV保存", generatedParticipants);
  const blob = new Blob([`\uFEFF${buildParticipantCsv(generatedParticipants)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stress-check-participant-urls.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function handleDownloadStatusCsv() {
  if (!generatedParticipants.length) return;
  void logClientAudit("受検状況CSV保存", generatedParticipants);
  const blob = new Blob([`\uFEFF${buildStatusCsv(generatedParticipants)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stress-check-submission-status.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function handleDownloadPendingCsv() {
  if (!generatedParticipants.length) return;
  const pending = pendingRows(generatedParticipants);
  if (!pending.length) return;
  void logClientAudit("未受検者CSV保存", pending);
  const blob = new Blob([`\uFEFF${buildPendingCsv(generatedParticipants)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stress-check-pending-participants.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function handleDownloadCompanySummaryCsv() {
  if (!generatedParticipants.length) return;
  void logClientAudit("会社共有サマリーCSV保存", generatedParticipants);
  const blob = new Blob([`\uFEFF${buildCompanySummaryCsv(generatedParticipants)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stress-check-company-summary.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildGoogleCsvTemplate() {
  const sampleAnswers = Object.fromEntries(questionOrder.map((key) => [key, key.startsWith("A") ? 2 : 1]));
  const sample = {
    タイムスタンプ: "2026/05/30 09:00:00",
    受検者ID: "SC-0001",
    受検コード: "任意。名簿の受検コードを使う場合のみ",
    "会社名・事業所名": "株式会社サンプル",
    部署: "営業部",
    職場コード: "D001",
    職場名: "営業部",
    変数値: "営業部",
    個人情報の扱いの確認: "確認しました",
    回答内容の確認: "すべての設問に回答しました",
    ...sampleAnswers,
  };
  const rows = [
    googleCsvTemplateHeaders,
    googleCsvTemplateHeaders.map((header) => sample[header] || ""),
  ];
  return rows.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function handleDownloadGoogleCsvTemplate() {
  const blob = new Blob([`\uFEFF${buildGoogleCsvTemplate()}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "google-form-response-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildGoogleImportCheckCsv(rows) {
  const output = [
    ["CSV行", "受検者ID", "受検コード", "保存判定", "保存不可理由", "厚労省CSV不足", "名簿照合", "回答不足項目"],
    ...rows.map((row) => {
      const issues = importIssues(row);
      const warnings = importWarnings(row);
      return [
        row.sourceRowNumber,
        row.respondentId,
        row.participantCode,
        issues.length ? "保存不可" : "保存可",
        issues.join(" / "),
        warnings.join(" / "),
        row.matchedRoster ? "あり" : "なし",
        missingAnswerKeys(row).join(" "),
      ];
    }),
  ];
  return output.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

function handleDownloadGoogleImportCheck() {
  if (!googleImportRows.length) {
    setGoogleImportMessage("先にCSVを確認してください。", "error");
    return;
  }
  const blob = new Blob([`\uFEFF${buildGoogleImportCheckCsv(googleImportRows)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameWithRunId("google-form-import-check", "csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  setGoogleImportMessage(`取込チェックCSVを保存しました。実施ID: ${currentRunId || "-"}`, "success");
}

function handleDownloadIndividualAnalysisCsv() {
  if (!googleImportRows.length) {
    setGoogleImportMessage("先にCSVを確認してください。", "error");
    return;
  }
  const blob = new Blob([`\uFEFF${buildIndividualAnalysisCsv(googleImportRows)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameWithRunId("stress-check-individual-analysis-mhlw57", "csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  setGoogleImportMessage(`個人分析CSVを保存しました。実施ID: ${currentRunId || "-"}。厚労省57項目の素点換算表方式による評価点と高ストレス者判定を出力しています。`, "success");
  addOperationLog("個人分析CSV保存");
}

function handleDownloadPersonalResultHtml() {
  if (!googleImportRows.length) {
    setGoogleImportMessage("先にCSVを確認してください。", "error");
    return;
  }
  const scoreableRows = googleImportRows.filter((row) => buildMhlwIndividualAnalysis(row).canScore);
  const settings = getImplementationSettings();
  const missingGuidance = ["operator", "interviewContact", "interviewDeadline"].filter((key) => !settings[key]).length;
  if (!scoreableRows.length) {
    setGoogleImportMessage("本人向け結果を出力できる行がありません。57項目回答と性別を確認してください。", "error");
    return;
  }
  if (scoreableRows.length === 1) {
    const opened = openHtmlDocument(buildPersonalResultHtml(scoreableRows[0]));
    setGoogleImportMessage(opened ? "本人向け結果を開きました。開いた画面の「印刷 / PDF保存」を使ってください。" : "ポップアップがブロックされました。下の本人別ボタンからもう一度開いてください。", opened ? "success" : "error");
    if (opened) addOperationLog("本人向け結果表示", { count: 1, missingGuidance });
    return;
  }
  const opened = openHtmlDocument(buildAllPersonalResultsHtml(scoreableRows));
  setGoogleImportMessage(opened ? "本人向け結果の一括印刷画面を開きました。必要に応じて、下の一覧から1人ずつ開くこともできます。" : "ポップアップがブロックされました。ブラウザのポップアップ許可を確認してください。", opened ? "success" : "error");
  if (opened) addOperationLog("本人向け結果一括表示", { count: scoreableRows.length, missingGuidance });
}

function handleDownloadCompanyGroupHtml() {
  if (!googleImportRows.length) {
    setGoogleImportMessage("先にCSVを確認してください。", "error");
    return;
  }
  const summary = buildCompanyGroupAnalysis(googleImportRows);
  if (!summary.overall && !summary.visibleGroups.length) {
    setGoogleImportMessage("企業向け集団分析を出力できません。判定可能な回答が10人以上必要です。", "error");
    return;
  }
  const opened = openHtmlDocument(buildCompanyGroupHtml(googleImportRows));
  setGoogleImportMessage(opened ? "企業向け集団分析を開きました。開いた画面の「印刷 / PDF保存」を使ってください。" : "ポップアップがブロックされました。ブラウザのポップアップ許可を確認してください。", opened ? "success" : "error");
  if (opened) addOperationLog("企業向け集団分析表示", { visibleGroups: summary.visibleGroups.length, suppressedGroups: summary.suppressedGroups.length });
}

function handleDownloadImplementationRecordHtml() {
  if (!googleImportRows.length) {
    setGoogleImportMessage("先にCSVを確認してください。", "error");
    return;
  }
  const uncheckedCount = getLegalOperationChecks().filter((item) => !item.checked).length;
  const settings = getImplementationSettings();
  const missingGuidance = ["operator", "interviewContact", "interviewDeadline"].filter((key) => !settings[key]).length;
  const opened = openHtmlDocument(buildImplementationRecordHtml(googleImportRows));
  setGoogleImportMessage(opened ? "実施記録を開きました。開いた画面の「印刷 / PDF保存」で保管してください。" : "ポップアップがブロックされました。ブラウザのポップアップ許可を確認してください。", opened ? "success" : "error");
  if (opened) addOperationLog("実施記録表示", { rows: googleImportRows.length, uncheckedLegalChecks: uncheckedCount, missingGuidance });
}

function handleDownloadOperationLogCsv() {
  if (!operationLog.length) return;
  addOperationLog("実施ログCSV保存", { rows: operationLog.length });
  downloadTextFile(fileNameWithRunId("stress-check-operation-log", "csv"), `\uFEFF${buildOperationLogCsv()}`, "text/csv;charset=utf-8");
}

async function loadSummary() {
  if (isPublicStaticPage) {
    setMessage("公開サイト上では管理APIを利用できません。ローカルサーバーで開いてください。", "info");
    document.querySelectorAll(".admin-actions a").forEach((link) => {
      if (link.href.includes("/api/")) link.setAttribute("aria-disabled", "true");
    });
    return;
  }

  try {
    const response = await fetch("/api/stress-check-admin/summary", { headers: adminHeaders() });
    const summary = await response.json();
    if (!response.ok) throw new Error(summary.error || "読み込めませんでした。");
    renderSummary(summary);
    await loadAuditLog();
    setMessage("回答保存・CSV出力・集団分析の準備ができています。", "success");
  } catch (error) {
    setMessage(`管理情報を読み込めませんでした。理由: ${error.message}`, "error");
  }
}

adminKeyInput.addEventListener("input", () => {
  const key = getAdminKey();
  if (key) {
    sessionStorage.setItem("stressCheckAdminKey", key);
  } else {
    sessionStorage.removeItem("stressCheckAdminKey");
  }
  applyAdminKeyToLinks();
});

applyAdminKeyToLinks();
restoreOperationSettings();
loadSummary();
loadStoredResponses();
generateParticipantUrls.addEventListener("click", handleGenerateParticipantUrls);
downloadParticipantUrls.addEventListener("click", handleDownloadParticipantUrls);
downloadStatusCsv.addEventListener("click", handleDownloadStatusCsv);
downloadPendingCsv.addEventListener("click", handleDownloadPendingCsv);
downloadCompanySummaryCsv.addEventListener("click", handleDownloadCompanySummaryCsv);
printParticipantQrSheet.addEventListener("click", handlePrintParticipantQrSheet);
printPendingQrSheet.addEventListener("click", handlePrintPendingQrSheet);
previewGoogleCsv.addEventListener("click", handlePreviewGoogleCsv);
loadSampleCsv.addEventListener("click", handleLoadSampleCsv);
importGoogleCsv.addEventListener("click", handleImportGoogleCsv);
downloadGoogleCsvTemplate.addEventListener("click", handleDownloadGoogleCsvTemplate);
downloadGoogleImportCheck.addEventListener("click", handleDownloadGoogleImportCheck);
downloadIndividualAnalysisCsv.addEventListener("click", handleDownloadIndividualAnalysisCsv);
downloadPersonalResultHtml.addEventListener("click", handleDownloadPersonalResultHtml);
downloadCompanyGroupHtml.addEventListener("click", handleDownloadCompanyGroupHtml);
downloadImplementationRecordHtml.addEventListener("click", handleDownloadImplementationRecordHtml);
downloadOperationLogCsv.addEventListener("click", handleDownloadOperationLogCsv);
reloadStoredResponses.addEventListener("click", loadStoredResponses);
downloadResponseAdminCsv.addEventListener("click", handleDownloadResponseAdminCsv);
legalOperationChecklist?.addEventListener("change", () => {
  saveOperationSettings();
  if (googleImportRows.length) refreshAnalysisAfterBasicEdit(false);
});
[implementationOperator, interviewContact, interviewDeadline].forEach((input) => {
  input?.addEventListener("input", () => {
    saveOperationSettings();
    if (googleImportRows.length) refreshAnalysisAfterBasicEdit(false);
  });
});
responseAdminRows.addEventListener("click", (event) => {
  const button = event.target.closest(".response-status-action");
  if (!button) return;
  void updateResponseStatus(button.dataset.submissionId, button.dataset.nextStatus);
});
individualAnalysisPreview.addEventListener("click", (event) => {
  const button = event.target.closest(".personal-result-action");
  if (!button) return;
  const row = googleImportRows[Number(button.dataset.rowIndex)];
  if (!row) return;
  const opened = openHtmlDocument(buildPersonalResultHtml(row));
  setGoogleImportMessage(opened ? "本人向け結果を開きました。開いた画面の「印刷 / PDF保存」を使ってください。" : "ポップアップがブロックされました。ブラウザのポップアップ許可を確認してください。", opened ? "success" : "error");
  const settings = getImplementationSettings();
  const missingGuidance = ["operator", "interviewContact", "interviewDeadline"].filter((key) => !settings[key]).length;
  if (opened) addOperationLog("本人向け結果個別表示", { row: row.sourceRowNumber, missingGuidance });
});
googleCsvFile.addEventListener("change", () => {
  currentRunId = "";
  googleImportRows = [];
  googleImportDiagnostics = null;
  importGoogleCsv.disabled = true;
  downloadGoogleImportCheck.disabled = true;
  downloadIndividualAnalysisCsv.disabled = true;
  downloadPersonalResultHtml.disabled = true;
  downloadCompanyGroupHtml.disabled = true;
  downloadImplementationRecordHtml.disabled = true;
  downloadOperationLogCsv.disabled = !operationLog.length;
  googleImportMessage.hidden = true;
  renderEmpty(googleImportPreview, "CSVを選択したら「CSVを確認」を押してください。");
  renderBasicInfoEditor([]);
  renderIndividualAnalysisPreview([]);
  if (googleCsvFile.files?.[0]) void handlePreviewGoogleCsv();
});
basicInfoSource.addEventListener("input", () => {
  if (googleCsvFile.files?.[0]) void handlePreviewGoogleCsv();
});
basicInfoEditor.addEventListener("input", (event) => {
  const field = event.target?.dataset?.basicField;
  const rowElement = event.target?.closest?.(".basic-info-row");
  if (!field || !rowElement) return;
  const rowIndex = Number(rowElement.dataset.rowIndex);
  if (!googleImportRows[rowIndex]) return;
  googleImportRows[rowIndex][field] = cleanText(event.target.value);
  refreshAnalysisAfterBasicEdit();
});
basicInfoEditor.addEventListener("change", (event) => {
  const field = event.target?.dataset?.basicField;
  const rowElement = event.target?.closest?.(".basic-info-row");
  if (!field || !rowElement) return;
  const rowIndex = Number(rowElement.dataset.rowIndex);
  if (!googleImportRows[rowIndex]) return;
  googleImportRows[rowIndex][field] = cleanText(event.target.value);
  refreshAnalysisAfterBasicEdit(true);
});
window.addEventListener("afterprint", () => {
  participantQrSheet.hidden = true;
  document.body.classList.remove("printing-qr-sheet");
});
