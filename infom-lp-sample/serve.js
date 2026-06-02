const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 8890);
const ROOT = __dirname;
const ADMIN_KEY = String(process.env.ADMIN_KEY || "");
const RESPONSE_DIR = path.join(ROOT, "responses");
const RESPONSE_FILE = path.join(RESPONSE_DIR, "stress-check-responses.jsonl");
const AUDIT_FILE = path.join(RESPONSE_DIR, "stress-check-audit-log.jsonl");
const STATUS_FILE = path.join(RESPONSE_DIR, "stress-check-response-status.jsonl");
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MIN_GROUP_SIZE = 10;
let QRCode = null;

try {
  QRCode = require(path.join(ROOT, "..", "stresscheck-system", "node_modules", "qrcode"));
} catch {
  QRCode = null;
}

const questionOrder = [
  ...Array.from({ length: 17 }, (_, index) => `A${index + 1}`),
  ...Array.from({ length: 29 }, (_, index) => `B${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `C${index + 1}`),
  ...Array.from({ length: 2 }, (_, index) => `D${index + 1}`),
];

const sectionRanges = {
  A: questionOrder.slice(0, 17),
  B: questionOrder.slice(17, 46),
  C: questionOrder.slice(46, 55),
  D: questionOrder.slice(55, 57),
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendCsv(res, filename, csv) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  });
  res.end(`\uFEFF${csv}`);
}

function sendSvg(res, svg) {
  res.writeHead(200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(svg);
}

function requireAdmin(req, res) {
  if (!ADMIN_KEY) return true;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const providedKey = req.headers["x-admin-key"] || url.searchParams.get("adminKey") || "";
  if (providedKey === ADMIN_KEY) return true;
  sendJson(res, 401, { error: "管理キーが必要です。" });
  return false;
}

function readJsonBody(req, res, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      sendJson(res, 413, { error: "送信データが大きすぎます。" });
      req.destroy();
    }
  });
  req.on("end", () => {
    try {
      callback(JSON.parse(body || "{}"));
    } catch {
      sendJson(res, 400, { error: "JSONとして読み取れませんでした。" });
    }
  });
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeDate(value) {
  const raw = clean(value);
  if (!raw) return "";
  const normalized = raw.replaceAll("-", "/");
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return normalized;
  const [, year, month, day] = match;
  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
}

function normalizeGender(value) {
  const raw = clean(value).toLowerCase();
  if (["男性", "男", "m", "male", "1"].includes(raw)) return "男性";
  if (["女性", "女", "f", "female", "2"].includes(raw)) return "女性";
  return clean(value);
}

function validateStressCheckPayload(payload) {
  if (!payload || typeof payload !== "object") return "送信内容が不正です。";
  if (!clean(payload.respondentId)) return "社員ID・受検者IDが未入力です。";
  if (!clean(payload.personName)) return "氏名が未入力です。厚労省プログラム取込用CSVに必要です。";
  if (!clean(payload.kanaName)) return "フリガナが未入力です。厚労省プログラム取込用CSVに必要です。";
  if (!clean(payload.birthDate)) return "生年月日が未入力です。厚労省プログラム取込用CSVに必要です。";
  if (!["男性", "女性"].includes(normalizeGender(payload.gender))) return "性別は男性または女性を選択してください。";
  if (!clean(payload.workplaceCode)) return "職場コードが未入力です。厚労省プログラム取込用CSVに必要です。";
  if (!payload.privacyConfirmed || !payload.answerConfirmed) return "送信前の確認に同意してください。";
  if (!payload.answers || typeof payload.answers !== "object") return "回答が見つかりません。";

  for (const key of questionOrder) {
    if (![1, 2, 3, 4].includes(Number(payload.answers[key]))) {
      return `${key} が未回答です。`;
    }
  }
  return "";
}

function buildRecord(payload, submittedAt, submissionId) {
  return {
    submissionId,
    submittedAt,
    respondentId: clean(payload.respondentId),
    participantCode: clean(payload.participantCode),
    organization: clean(payload.organization),
    department: clean(payload.department),
    personName: clean(payload.personName),
    kanaName: clean(payload.kanaName),
    birthDate: normalizeDate(payload.birthDate),
    gender: normalizeGender(payload.gender),
    workplaceCode: clean(payload.workplaceCode),
    workplaceName: clean(payload.workplaceName),
    analysisVariable: clean(payload.analysisVariable),
    previousEmployeeId: clean(payload.previousEmployeeId),
    answers: payload.answers,
    source: "stress-check-form",
  };
}

function normalizeSubmittedAt(value) {
  const raw = clean(value);
  if (!raw) return new Date().toISOString();

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const match = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) return new Date().toISOString();
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}+09:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function validateGoogleImportRecord(payload) {
  const missing = [];
  if (!payload || typeof payload !== "object") return ["record"];
  if (!clean(payload.respondentId)) missing.push("受検者ID");
  if (!payload.answers || typeof payload.answers !== "object") {
    missing.push("回答");
    return missing;
  }
  for (const key of questionOrder) {
    if (![1, 2, 3, 4].includes(Number(payload.answers[key]))) missing.push(key);
  }
  return missing;
}

function buildGoogleImportRecord(payload, fallbackIndex) {
  const submittedAt = normalizeSubmittedAt(payload.submittedAt);
  const datePart = submittedAt.slice(0, 10).replaceAll("-", "");
  return {
    submissionId: `GF-${datePart}-${crypto.randomUUID().slice(0, 8)}`,
    submittedAt,
    respondentId: clean(payload.respondentId),
    participantCode: clean(payload.participantCode),
    organization: clean(payload.organization),
    department: clean(payload.department),
    personName: clean(payload.personName),
    kanaName: clean(payload.kanaName),
    birthDate: normalizeDate(payload.birthDate),
    gender: normalizeGender(payload.gender),
    workplaceCode: clean(payload.workplaceCode),
    workplaceName: clean(payload.workplaceName),
    analysisVariable: clean(payload.analysisVariable),
    previousEmployeeId: clean(payload.previousEmployeeId),
    answers: Object.fromEntries(questionOrder.map((key) => [key, Number(payload.answers?.[key])])),
    source: "google-form-csv",
    sourceRowNumber: Number(payload.sourceRowNumber) || fallbackIndex + 1,
  };
}

function readJsonlFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line.replace(/^\uFEFF/, ""));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readRecords() {
  return readJsonlFile(RESPONSE_FILE);
}

function readAuditLog(limit = 50) {
  return readJsonlFile(AUDIT_FILE)
    .slice(-limit)
    .reverse();
}

function readStatusEvents() {
  return readJsonlFile(STATUS_FILE);
}

function appendAuditLog(entry) {
  try {
    fs.mkdirSync(RESPONSE_DIR, { recursive: true });
    fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
}

function appendStatusEvent(event) {
  fs.mkdirSync(RESPONSE_DIR, { recursive: true });
  fs.appendFileSync(STATUS_FILE, `${JSON.stringify(event)}\n`, "utf8");
}

function responseStatusMap() {
  return readStatusEvents().reduce((map, event) => {
    const submissionId = clean(event.submissionId);
    if (!submissionId) return map;
    map.set(submissionId, {
      status: event.status === "disabled" ? "disabled" : "active",
      reason: clean(event.reason),
      timestamp: clean(event.timestamp),
    });
    return map;
  }, new Map());
}

function recordStatus(record, statuses) {
  return statuses.get(clean(record.submissionId))?.status || "active";
}

function activeRecords(records, statuses = responseStatusMap()) {
  return records.filter((record) => recordStatus(record, statuses) !== "disabled");
}

function recordIdentity(record) {
  return clean(record.participantCode) || clean(record.respondentId) || clean(record.submissionId);
}

function latestRecords(records) {
  const latest = new Map();
  for (const record of records) {
    const key = recordIdentity(record);
    if (!key) continue;
    const current = latest.get(key);
    if (!current || clean(current.submittedAt) < clean(record.submittedAt)) {
      latest.set(key, record);
    }
  }
  return Array.from(latest.values());
}

function buildDuplicateSubmissionGroups(records) {
  const grouped = new Map();
  for (const record of records) {
    const key = recordIdentity(record);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => {
      const sorted = [...items].sort((a, b) => clean(b.submittedAt).localeCompare(clean(a.submittedAt)));
      const latest = sorted[0];
      return {
        key,
        count: items.length,
        participantCode: clean(latest.participantCode),
        respondentId: clean(latest.respondentId),
        latestSubmittedAt: latest.submittedAt,
        olderSubmittedAt: sorted.slice(1).map((record) => record.submittedAt),
      };
    });
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function validateMhlwImportRecord(record) {
  const missing = [];
  for (const [key, label] of [
    ["personName", "氏名"],
    ["kanaName", "フリガナ"],
    ["birthDate", "生年月日"],
    ["gender", "性別"],
    ["respondentId", "社員ID"],
    ["workplaceCode", "職場コード"],
  ]) {
    if (!clean(record[key])) missing.push(label);
  }
  for (const key of questionOrder) {
    if (![1, 2, 3, 4].includes(Number(record.answers?.[key]))) missing.push(key);
  }
  return missing;
}

function buildMhlwResultCsv(records) {
  const headers = [
    "氏名",
    "フリガナ",
    "生年月日(西暦)",
    "性別",
    "社員ID",
    "職場コード",
    "職場名",
    "前回社員ID",
    "メールアドレス",
    "電話番号",
    "内線番号",
    "備考",
    "管理者コメント",
    "変数値",
    ...questionOrder.map((_, index) => `回答${index + 1}`),
  ];

  const rows = records.map((record) => [
    record.personName,
    record.kanaName,
    normalizeDate(record.birthDate),
    record.gender,
    record.respondentId,
    record.workplaceCode,
    record.workplaceName,
    record.previousEmployeeId,
    "",
    "",
    "",
    record.department || record.organization,
    "",
    record.analysisVariable,
    ...questionOrder.map((key) => record.answers?.[key] ?? ""),
  ]);

  return toCsv([headers, ...rows]);
}

function average(values) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numeric.length) return null;
  return Math.round((numeric.reduce((sum, value) => sum + value, 0) / numeric.length) * 100) / 100;
}

function groupKeyFor(record) {
  return (
    clean(record.analysisVariable) ||
    clean(record.workplaceCode) ||
    clean(record.department) ||
    "未設定"
  );
}

function buildGroupSummary(records, minGroupSize = MIN_GROUP_SIZE) {
  const groups = new Map();
  for (const record of records) {
    const key = groupKeyFor(record);
    if (!groups.has(key)) {
      groups.set(key, {
        group: key,
        workplaceCode: clean(record.workplaceCode),
        workplaceName: clean(record.workplaceName),
        department: clean(record.department),
        analysisVariable: clean(record.analysisVariable),
        records: [],
      });
    }
    groups.get(key).records.push(record);
  }

  const visibleGroups = [];
  const suppressedGroups = [];
  for (const group of groups.values()) {
    if (group.records.length < minGroupSize) {
      suppressedGroups.push({ group: group.group, count: group.records.length, reason: `${minGroupSize}人未満のため非表示` });
      continue;
    }

    const sectionAverage = {};
    for (const [section, keys] of Object.entries(sectionRanges)) {
      sectionAverage[section] = average(group.records.flatMap((record) => keys.map((key) => record.answers?.[key])));
    }

    visibleGroups.push({
      group: group.group,
      count: group.records.length,
      workplaceCode: group.workplaceCode,
      workplaceName: group.workplaceName,
      department: group.department,
      analysisVariable: group.analysisVariable,
      averages: sectionAverage,
      itemAverages: Object.fromEntries(questionOrder.map((key) => [key, average(group.records.map((record) => record.answers?.[key]))])),
    });
  }

  return { minGroupSize, visibleGroups, suppressedGroups };
}

function buildGroupCsv(summary) {
  const rows = [
    ["集団キー", "人数", "職場コード", "職場名", "部署", "変数値", "A平均", "B平均", "C平均", "D平均"],
    ...summary.visibleGroups.map((group) => [
      group.group,
      group.count,
      group.workplaceCode,
      group.workplaceName,
      group.department,
      group.analysisVariable,
      group.averages.A,
      group.averages.B,
      group.averages.C,
      group.averages.D,
    ]),
  ];
  return toCsv(rows);
}

function buildAuditEntry(action, records) {
  const statuses = responseStatusMap();
  const active = activeRecords(records, statuses);
  const exportRecords = latestRecords(active);
  const invalidRecords = exportRecords.filter((record) => validateMhlwImportRecord(record).length);
  const groupSummary = buildGroupSummary(exportRecords);
  return {
    timestamp: new Date().toISOString(),
    action,
    totalResponses: records.length,
    activeResponses: active.length,
    disabledResponses: records.length - active.length,
    exportTargetResponses: exportRecords.length,
    mhlwImportReady: exportRecords.length - invalidRecords.length,
    duplicateSubmissionGroups: buildDuplicateSubmissionGroups(active).length,
    visibleGroupCount: groupSummary.visibleGroups.length,
    suppressedGroupCount: groupSummary.suppressedGroups.length,
  };
}

function buildClientAuditEntry(payload) {
  const count = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  };

  return {
    timestamp: new Date().toISOString(),
    action: clean(payload.action).slice(0, 80) || "管理画面操作",
    source: "admin-client",
    rosterTargetResponses: count(payload.rosterTargetResponses),
    submittedCount: count(payload.submittedCount),
    pendingCount: count(payload.pendingCount),
    visibleGroupCount: count(payload.visibleGroupCount),
    suppressedGroupCount: count(payload.suppressedGroupCount),
  };
}

function handleStressCheckSubmit(req, res) {
  readJsonBody(req, res, (payload) => {
    const validationError = validateStressCheckPayload(payload);
    if (validationError) {
      sendJson(res, 400, { error: validationError });
      return;
    }

    const submittedAt = new Date().toISOString();
    const submissionId = `SC-${submittedAt.slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8)}`;
    const record = buildRecord(payload, submittedAt, submissionId);

    if (payload.dryRun) {
      sendJson(res, 201, { ok: true, submissionId, dryRun: true, mhlwImportReady: true });
      return;
    }

    fs.mkdir(RESPONSE_DIR, { recursive: true }, (mkdirError) => {
      if (mkdirError) {
        sendJson(res, 500, { error: "保存先フォルダを作成できませんでした。" });
        return;
      }

      fs.appendFile(RESPONSE_FILE, `${JSON.stringify(record)}\n`, "utf8", (writeError) => {
        if (writeError) {
          sendJson(res, 500, { error: "回答を保存できませんでした。" });
          return;
        }
        sendJson(res, 201, { ok: true, submissionId, mhlwImportReady: true });
      });
    });
  });
}

function handleGoogleFormCsvImport(req, res) {
  readJsonBody(req, res, (payload) => {
    const rows = Array.isArray(payload.records) ? payload.records : [];
    if (!rows.length) {
      sendJson(res, 400, { error: "取込対象の回答がありません。" });
      return;
    }
    if (rows.length > 2000) {
      sendJson(res, 400, { error: "一度に取り込める回答は2000件までです。" });
      return;
    }

    const errors = rows
      .map((row, index) => ({
        rowNumber: Number(row?.sourceRowNumber) || index + 1,
        missing: validateGoogleImportRecord(row),
      }))
      .filter((item) => item.missing.length);

    if (errors.length) {
      sendJson(res, 400, {
        error: "保存できない行があります。受検者IDと57項目の回答を確認してください。",
        errors: errors.slice(0, 30),
      });
      return;
    }

    const records = rows.map(buildGoogleImportRecord);
    if (payload.dryRun) {
      const incompleteForMhlw = records.filter((record) => validateMhlwImportRecord(record).length);
      sendJson(res, 200, {
        ok: true,
        dryRun: true,
        importedCount: records.length,
        incompleteForMhlwCount: incompleteForMhlw.length,
      });
      return;
    }

    fs.mkdir(RESPONSE_DIR, { recursive: true }, (mkdirError) => {
      if (mkdirError) {
        sendJson(res, 500, { error: "保存先フォルダを作成できませんでした。" });
        return;
      }

      fs.appendFile(RESPONSE_FILE, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8", (writeError) => {
        if (writeError) {
          sendJson(res, 500, { error: "GoogleフォームCSVの回答を保存できませんでした。" });
          return;
        }

        const allRecords = readRecords();
        const latest = latestRecords(activeRecords(allRecords));
        const groupSummary = buildGroupSummary(latest);
        const incompleteForMhlw = records.filter((record) => validateMhlwImportRecord(record).length);
        appendAuditLog({
          timestamp: new Date().toISOString(),
          action: "GoogleフォームCSV取込",
          source: "admin-google-csv",
          importedCount: records.length,
          incompleteForMhlwCount: incompleteForMhlw.length,
          exportTargetResponses: latest.length,
          visibleGroupCount: groupSummary.visibleGroups.length,
          suppressedGroupCount: groupSummary.suppressedGroups.length,
        });
        sendJson(res, 201, {
          ok: true,
          importedCount: records.length,
          incompleteForMhlwCount: incompleteForMhlw.length,
        });
      });
    });
  });
}

function handleAdminSummary(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedMin = Number(url.searchParams.get("minGroupSize") || MIN_GROUP_SIZE);
  const minGroupSize = Math.max(MIN_GROUP_SIZE, Number.isFinite(requestedMin) ? requestedMin : MIN_GROUP_SIZE);
  const records = readRecords();
  const statuses = responseStatusMap();
  const active = activeRecords(records, statuses);
  const exportRecords = latestRecords(active);
  const duplicateSubmissions = buildDuplicateSubmissionGroups(active);
  const submittedParticipants = Array.from(exportRecords.reduce((map, record) => {
    const key = clean(record.participantCode) || clean(record.respondentId);
    if (!key) return map;
    const current = map.get(key);
    if (!current || current.submittedAt < record.submittedAt) {
      map.set(key, {
        participantCode: clean(record.participantCode),
        respondentId: record.respondentId,
        submittedAt: record.submittedAt,
      });
    }
    return map;
  }, new Map()).values());
  const invalidRecords = exportRecords
    .map((record) => ({ submissionId: record.submissionId, respondentId: record.respondentId, missing: validateMhlwImportRecord(record) }))
    .filter((item) => item.missing.length);

  sendJson(res, 200, {
    totalResponses: records.length,
    activeResponses: active.length,
    disabledResponses: records.length - active.length,
    exportTargetResponses: exportRecords.length,
    mhlwImportReady: exportRecords.length - invalidRecords.length,
    submittedParticipants,
    duplicateSubmissions,
    invalidRecords,
    groupSummary: buildGroupSummary(exportRecords, minGroupSize),
    exports: {
      mhlwResultsCsv: "/api/stress-check-export/mhlw-results.csv",
      groupAnalysisCsv: "/api/stress-check-export/group-analysis.csv",
    },
    security: {
      adminKeyEnabled: Boolean(ADMIN_KEY),
      localOnly: HOST === "127.0.0.1",
      qrAvailable: Boolean(QRCode),
      responseStorage: "responses/stress-check-responses.jsonl",
      auditStorage: "responses/stress-check-audit-log.jsonl",
      statusStorage: "responses/stress-check-response-status.jsonl",
    },
    qrAvailable: Boolean(QRCode),
  });
}

function responseAdminRows(records) {
  const statuses = responseStatusMap();
  const active = activeRecords(records, statuses);
  const latestIds = new Set(latestRecords(active).map((record) => clean(record.submissionId)));
  return [...records]
    .sort((a, b) => clean(b.submittedAt).localeCompare(clean(a.submittedAt)))
    .map((record) => {
      const statusInfo = statuses.get(clean(record.submissionId));
      const missing = validateMhlwImportRecord(record);
      return {
        submissionId: record.submissionId,
        submittedAt: record.submittedAt,
        respondentId: record.respondentId,
        participantCode: record.participantCode,
        source: record.source,
        personName: record.personName,
        workplaceCode: record.workplaceCode,
        workplaceName: record.workplaceName,
        department: record.department,
        analysisVariable: record.analysisVariable,
        status: statusInfo?.status || "active",
        statusReason: statusInfo?.reason || "",
        statusUpdatedAt: statusInfo?.timestamp || "",
        exportTarget: latestIds.has(clean(record.submissionId)),
        mhlwReady: !missing.length,
        missing,
      };
    });
}

function handleAdminResponses(req, res) {
  const records = readRecords();
  const rows = responseAdminRows(records);
  sendJson(res, 200, {
    totalResponses: records.length,
    activeResponses: rows.filter((row) => row.status === "active").length,
    disabledResponses: rows.filter((row) => row.status === "disabled").length,
    responses: rows,
  });
}

function buildResponseStatusEntry(payload) {
  const status = payload.status === "disabled" ? "disabled" : "active";
  return {
    timestamp: new Date().toISOString(),
    submissionId: clean(payload.submissionId),
    status,
    reason: clean(payload.reason).slice(0, 200),
  };
}

function handleResponseStatusUpdate(req, res) {
  readJsonBody(req, res, (payload) => {
    const entry = buildResponseStatusEntry(payload);
    if (!entry.submissionId) {
      sendJson(res, 400, { error: "submissionId が必要です。" });
      return;
    }

    const exists = readRecords().some((record) => clean(record.submissionId) === entry.submissionId);
    if (!exists) {
      sendJson(res, 404, { error: "指定された回答が見つかりません。" });
      return;
    }

    try {
      appendStatusEvent(entry);
      appendAuditLog({
        timestamp: entry.timestamp,
        action: entry.status === "disabled" ? "回答無効化" : "回答有効化",
        source: "admin-response-status",
        submissionId: entry.submissionId,
        reason: entry.reason,
      });
      sendJson(res, 201, { ok: true, entry });
    } catch {
      sendJson(res, 500, { error: "回答状態を保存できませんでした。" });
    }
  });
}

function handleQr(req, res) {
  if (!QRCode) {
    sendJson(res, 503, { error: "QRコード生成ライブラリが見つかりません。" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const data = url.searchParams.get("data") || "";
  if (!data || data.length > 1400) {
    sendJson(res, 400, { error: "QRコード化するURLが空、または長すぎます。" });
    return;
  }

  QRCode.toString(data, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 220,
    color: {
      dark: "#08111f",
      light: "#ffffff",
    },
  }, (error, svg) => {
    if (error) {
      sendJson(res, 500, { error: "QRコードを生成できませんでした。" });
      return;
    }
    sendSvg(res, svg);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/stress-check-responses") {
    handleStressCheckSubmit(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/stress-check-admin/import-google-form-csv") {
    if (!requireAdmin(req, res)) return;
    handleGoogleFormCsvImport(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/stress-check-admin/summary")) {
    if (!requireAdmin(req, res)) return;
    handleAdminSummary(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/stress-check-admin/responses")) {
    if (!requireAdmin(req, res)) return;
    handleAdminResponses(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/stress-check-admin/response-status") {
    if (!requireAdmin(req, res)) return;
    handleResponseStatusUpdate(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/stress-check-admin/audit-log")) {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, { auditLog: readAuditLog(50) });
    return;
  }

  if (req.method === "POST" && req.url === "/api/stress-check-admin/audit-log") {
    if (!requireAdmin(req, res)) return;
    readJsonBody(req, res, (payload) => {
      appendAuditLog(buildClientAuditEntry(payload));
      sendJson(res, 201, { ok: true });
    });
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/stress-check-export/mhlw-results.csv")) {
    if (!requireAdmin(req, res)) return;
    const records = readRecords();
    const exportRecords = latestRecords(activeRecords(records));
    appendAuditLog(buildAuditEntry("厚労省取込用CSV出力", records));
    sendCsv(res, "mhlw-stress-check-results.csv", buildMhlwResultCsv(exportRecords));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/stress-check-export/group-analysis.csv")) {
    if (!requireAdmin(req, res)) return;
    const records = readRecords();
    const exportRecords = latestRecords(activeRecords(records));
    appendAuditLog(buildAuditEntry("集団分析CSV出力", records));
    sendCsv(res, "stress-check-group-analysis.csv", buildGroupCsv(buildGroupSummary(exportRecords)));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/qr.svg")) {
    handleQr(req, res);
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(path.join(ROOT, cleanPath));
  const rootPath = path.resolve(ROOT);

  if (filePath !== rootPath && !filePath.startsWith(`${rootPath}${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Infom LP running at http://${HOST}:${PORT}`);
});
