const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const QUESTIONS = [
  { id: "q1", text: "非常にたくさんの仕事をしなければならない" },
  { id: "q2", text: "時間内に仕事が処理しきれない" },
  { id: "q3", text: "一生懸命働かなければならない" },
  { id: "q4", text: "かなり注意を集中する必要がある" },
  { id: "q5", text: "高度の知識や技術が必要なむずかしい仕事だ" },
  { id: "q6", text: "勤務時間中はいつも仕事のことを考えていなければならない" },
  { id: "q7", text: "からだを大変よく使う仕事だ" },
  { id: "q8", text: "自分のペースで仕事ができる" },
  { id: "q9", text: "自分で仕事の順番・やり方を決めることができる" },
  { id: "q10", text: "職場の仕事の方針に自分の意見を反映できる" },
  { id: "q11", text: "自分の技能や知識を仕事で使うことが少ない" },
  { id: "q12", text: "私の部署内で意見のくい違いがある" },
  { id: "q13", text: "私の部署と他の部署とはうまが合わない" },
  { id: "q14", text: "私の職場の雰囲気は友好的である" },
  { id: "q15", text: "私の職場の作業環境はよくない" },
  { id: "q16", text: "仕事の内容は自分にあっている" },
  { id: "q17", text: "働きがいのある仕事だ" },
  { id: "q18", text: "活気がわいてくる" },
  { id: "q19", text: "元気がいっぱいだ" },
  { id: "q20", text: "生き生きする" },
  { id: "q21", text: "怒りを感じる" },
  { id: "q22", text: "内心腹立たしい" },
  { id: "q23", text: "イライラしている" },
];

const OPTIONS = [
  { value: 1, label: "そうだ" },
  { value: 2, label: "まあそうだ" },
  { value: 3, label: "ややちがう" },
  { value: 4, label: "ちがう" },
];

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const companyKey = crypto.randomBytes(12).toString("hex");
    const participants = Array.from({ length: 12 }, (_, index) => ({
      id: `p${index + 1}`,
      name: `デモ従業員${index + 1}`,
      department: index < 10 ? "介護事業部" : "管理部",
      token: crypto.randomBytes(16).toString("hex"),
      answeredAt: null,
      result: null,
      companyResultConsentAt: null,
      interviewRequestedAt: null,
    }));
    writeStore({
      companies: [
        {
          id: "demo",
          name: "デモ株式会社",
          companyKey,
          participants,
        },
      ],
      settings: {
        practitionerKey: crypto.randomBytes(24).toString("hex"),
        createdAt: new Date().toISOString(),
      },
      accessLogs: [],
    });
  }
}

function readStore() {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  store.settings ||= {};
  if (!store.settings.practitionerKey) {
    store.settings.practitionerKey = crypto.randomBytes(24).toString("hex");
    writeStore(store);
  }
  return store;
}

function writeStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function logAccess(store, entry) {
  store.accessLogs.push({
    at: new Date().toISOString(),
    ...entry,
  });
  if (store.accessLogs.length > 1000) store.accessLogs = store.accessLogs.slice(-1000);
}

function findParticipant(store, token) {
  for (const company of store.companies) {
    const participant = company.participants.find((item) => item.token === token);
    if (participant) return { company, participant };
  }
  return null;
}

function calculateResult(answers) {
  const values = Object.values(answers).map(Number);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / values.length;
  const highStress = average >= 3.1;
  const level = highStress ? "高ストレス傾向" : average >= 2.4 ? "注意" : "概ね安定";
  return {
    total,
    average: Number(average.toFixed(2)),
    level,
    highStress,
    note: highStress
      ? "医師による面接指導の申出を検討してください。申出は会社へ必要範囲の情報が伝わります。"
      : "現時点では強い高ストレス傾向は表示されていません。気になる症状がある場合は相談窓口を利用してください。",
  };
}

function html(title, body) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --text:#18212f; --muted:#667085; --line:#d8dee8; --bg:#f6f8fb; --panel:#fff; --accent:#1261a6; --danger:#b42318; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--text); line-height:1.65; }
    header { background:#fff; border-bottom:1px solid var(--line); padding:16px 20px; position:sticky; top:0; z-index:1; }
    main { width:min(980px, 100%); margin:0 auto; padding:22px 16px 48px; }
    h1 { font-size:24px; margin:0; }
    h2 { font-size:18px; margin:28px 0 10px; }
    .panel { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:18px; margin:14px 0; }
    .muted { color:var(--muted); }
    .danger { color:var(--danger); font-weight:700; }
    .grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .question { border-top:1px solid var(--line); padding:16px 0; }
    .options { display:grid; gap:8px; margin-top:10px; }
    label.option { display:flex; gap:10px; align-items:center; border:1px solid var(--line); border-radius:8px; padding:10px 12px; background:#fff; }
    button, .button { appearance:none; border:0; background:var(--accent); color:#fff; padding:11px 14px; border-radius:8px; font-weight:700; cursor:pointer; text-decoration:none; display:inline-block; }
    table { width:100%; border-collapse: collapse; background:#fff; }
    th, td { border:1px solid var(--line); padding:9px; text-align:left; vertical-align:top; }
    th { background:#edf2f7; }
    code { background:#eef2f6; padding:2px 5px; border-radius:4px; }
  </style>
</head>
<body>
  <header><h1>${escapeHtml(title)}</h1></header>
  <main>${body}</main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function send(res, status, title, body) {
  res.writeHead(status, securityHeaders({ "Content-Type": "text/html; charset=utf-8" }));
  res.end(html(title, body));
}

function sendRaw(res, status, headers, body) {
  res.writeHead(status, securityHeaders(headers));
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(303, securityHeaders({ Location: location }));
  res.end();
}

function securityHeaders(extra = {}) {
  return {
    "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline' 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
    ...extra,
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy();
    });
    req.on("end", () => resolve(new URLSearchParams(data)));
  });
}

function renderHome(store) {
  const company = store.companies[0];
  const first = company.participants[0];
  const practitionerKey = store.settings.practitionerKey;
  return `<div class="panel">
    <p>外部実施者が管理するスマホ回答MVPです。会社担当者は個人結果を閲覧できません。</p>
    <div class="grid">
      <a class="button" href="/respond/${first.token}">従業員デモ回答</a>
      <a class="button" href="/company/${company.id}?key=${company.companyKey}">会社担当者画面</a>
      <a class="button" href="/practitioner?key=${practitionerKey}">実施者画面</a>
    </div>
    <p class="muted">このMVPはローカル限定起動です。本番では正式なログイン、HTTPS、暗号化DBが必要です。</p>
  </div>`;
}

function renderSurvey(company, participant) {
  if (participant.answeredAt) {
    return `<div class="panel">
      <p>回答は送信済みです。</p>
      <a class="button" href="/result/${participant.token}">本人結果を見る</a>
    </div>`;
  }
  const questions = QUESTIONS.map((q, index) => `<div class="question">
    <strong>${index + 1}. ${escapeHtml(q.text)}</strong>
    <div class="options">
      ${OPTIONS.map((option) => `<label class="option">
        <input type="radio" name="${q.id}" value="${option.value}" required>
        <span>${escapeHtml(option.label)}</span>
      </label>`).join("")}
    </div>
  </div>`).join("");
  return `<div class="panel">
    <p>${escapeHtml(company.name)} のストレスチェックです。回答内容と個人結果は実施者が管理し、本人同意なく会社へ提供されません。</p>
    <p class="muted">回答者: ${escapeHtml(participant.name)} / ${escapeHtml(participant.department)}</p>
  </div>
  <form method="post" action="/respond/${participant.token}">
    <div class="panel">${questions}</div>
    <button type="submit">回答を送信して本人結果を見る</button>
  </form>`;
}

function renderResult(participant) {
  if (!participant.result) return `<div class="panel"><p>まだ回答がありません。</p></div>`;
  return `<div class="panel">
    <h2>本人結果</h2>
    <p><strong>判定:</strong> ${escapeHtml(participant.result.level)}</p>
    <p><strong>平均スコア:</strong> ${participant.result.average}</p>
    <p>${escapeHtml(participant.result.note)}</p>
    <p class="muted">この結果は本人と実施者のみが確認できます。会社には本人同意なく提供されません。</p>
  </div>
  <form method="post" action="/consent/${participant.token}">
    <div class="panel">
      <h2>会社への個人結果提供同意</h2>
      <p>会社への個人結果提供は任意です。制度上、結果通知後に本人が内容を確認したうえで判断します。</p>
      <button type="submit">会社への個人結果提供に同意する</button>
    </div>
  </form>
  <form method="post" action="/interview/${participant.token}">
    <div class="panel">
      <h2>医師面接指導の申出</h2>
      <p>申出を行うと、面接実施に必要な範囲で会社へ情報が伝わります。</p>
      <button type="submit">医師面接指導を申し出る</button>
    </div>
  </form>`;
}

function aggregate(company) {
  const answered = company.participants.filter((p) => p.result);
  const departments = {};
  for (const participant of answered) {
    departments[participant.department] ||= [];
    departments[participant.department].push(participant.result.average);
  }
  return Object.entries(departments)
    .filter(([, values]) => values.length >= 10)
    .map(([department, values]) => ({
      department,
      count: values.length,
      average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
    }));
}

function renderCompany(company) {
  const rows = company.participants.map((p) => `<tr><td>${escapeHtml(p.department)}</td><td>${escapeHtml(p.name)}</td><td>${p.answeredAt ? "受検済み" : "未受検"}</td></tr>`).join("");
  const aggregateRows = aggregate(company).map((item) => `<tr><td>${escapeHtml(item.department)}</td><td>${item.count}</td><td>${item.average}</td></tr>`).join("");
  return `<div class="panel">
    <p>会社担当者画面です。個人回答・個人結果・高ストレス判定は表示されません。</p>
  </div>
  <h2>受検状況</h2>
  <table><thead><tr><th>部署</th><th>氏名</th><th>状況</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>集団分析</h2>
  <table><thead><tr><th>部署</th><th>人数</th><th>平均スコア</th></tr></thead><tbody>${aggregateRows || `<tr><td colspan="3">10人以上の集団がまだありません</td></tr>`}</tbody></table>`;
}

function renderPractitioner(store) {
  const companies = store.companies.map((company) => {
    const rows = company.participants.map((p) => `<tr>
      <td>${escapeHtml(p.department)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${p.answeredAt ? "受検済み" : "未受検"}</td>
      <td>${p.result ? escapeHtml(p.result.level) : "-"}</td>
      <td>${p.companyResultConsentAt ? "同意あり" : "同意なし"}</td>
      <td>${p.interviewRequestedAt ? "申出あり" : "-"}</td>
      <td><a href="/result/${p.token}">本人結果</a></td>
    </tr>`).join("");
    return `<h2>${escapeHtml(company.name)}</h2>
      <p class="muted">会社画面URL: <code>/company/${company.id}?key=${company.companyKey}</code></p>
      <p><a class="button" href="/practitioner/invites/${company.id}?key=${store.settings.practitionerKey}">QRコード付き受検案内を作成</a></p>
      <table><thead><tr><th>部署</th><th>氏名</th><th>状況</th><th>判定</th><th>会社提供同意</th><th>面接申出</th><th>結果</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join("");
  return `<div class="panel"><p>実施者画面です。個人結果を扱うため、アクセス権を厳格に管理してください。</p></div>${companies}`;
}

function renderInvites(company, practitionerKey, origin) {
  const cards = company.participants.map((p) => {
    const responseUrl = `${origin}/respond/${p.token}`;
    const qrUrl = `/qr/${p.token}.svg?key=${practitionerKey}`;
    return `<section class="panel invite-card">
      <div>
        <h2>${escapeHtml(p.name)} 様</h2>
        <p class="muted">${escapeHtml(company.name)} / ${escapeHtml(p.department)}</p>
        <p>下のQRコードをスマホで読み込み、ブラウザで回答してください。</p>
        <p class="muted">アプリのインストールは不要です。</p>
        <p><strong>本人専用URL</strong><br><code>${escapeHtml(responseUrl)}</code></p>
      </div>
      <img class="qr" src="${qrUrl}" alt="${escapeHtml(p.name)}様の受検QRコード">
    </section>`;
  }).join("");

  return `<style>
    .tools { display:flex; gap:10px; flex-wrap:wrap; margin:12px 0 18px; }
    .invite-card { display:grid; grid-template-columns: 1fr 160px; gap:18px; align-items:center; break-inside: avoid; }
    .qr { width:160px; height:160px; border:1px solid var(--line); border-radius:4px; background:#fff; padding:8px; }
    @media (max-width: 620px) { .invite-card { grid-template-columns: 1fr; } }
    @media print {
      header, .tools { display:none; }
      body { background:#fff; }
      main { width:100%; padding:0; }
      .panel { page-break-inside: avoid; box-shadow:none; border:1px solid #999; }
    }
  </style>
  <div class="panel">
    <p>受検者ごとの本人専用URLとQRコードです。印刷して本人に配布するか、本人専用URLを社内メール等で送付してください。</p>
    <p class="danger">QRコードやURLは本人専用です。配り間違いに注意してください。</p>
  </div>
  <div class="tools">
    <button onclick="window.print()">印刷する</button>
    <a class="button" href="/practitioner?key=${practitionerKey}">実施者画面へ戻る</a>
    <a class="button" href="/practitioner/mail-template/${company.id}?key=${practitionerKey}">社内メール文を見る</a>
  </div>
  ${cards}`;
}

function renderMailTemplate(company, practitionerKey, origin) {
  const rows = company.participants.map((p) => {
    const responseUrl = `${origin}/respond/${p.token}`;
    return `<tr><td>${escapeHtml(p.department)}</td><td>${escapeHtml(p.name)}</td><td><code>${escapeHtml(responseUrl)}</code></td></tr>`;
  }).join("");
  return `<div class="panel">
    <h2>社内メール文テンプレート</h2>
    <p>件名: ストレスチェック受検のお願い</p>
    <pre>従業員各位

ストレスチェックを実施します。
案内された本人専用URLから、スマートフォンまたはPCのブラウザで回答してください。
アプリのインストールは不要です。

回答内容・個人結果・高ストレス者判定は、本人の同意なく会社には提供されません。
会社が確認できるのは、受検済み/未受検の状況と、個人が特定されない集団分析のみです。

回答期限: ＿＿年＿＿月＿＿日

問い合わせ先:
外部実施者 ＿＿＿＿＿＿</pre>
  </div>
  <div class="panel">
    <h2>本人専用URL一覧</h2>
    <p class="danger">この一覧は実施者管理用です。会社へ渡す場合は、配布目的と取扱者を限定してください。</p>
    <table><thead><tr><th>部署</th><th>氏名</th><th>本人専用URL</th></tr></thead><tbody>${rows}</tbody></table>
  </div>
  <p><a class="button" href="/practitioner/invites/${company.id}?key=${practitionerKey}">QR案内へ戻る</a></p>`;
}

const server = http.createServer(async (req, res) => {
  const store = readStore();
  const url = new URL(req.url, `http://${req.headers.host}`);
  logAccess(store, { method: req.method, path: url.pathname });

  try {
    if (req.method === "GET" && url.pathname === "/") {
      writeStore(store);
      return send(res, 200, "ストレスチェック受検システム", renderHome(store));
    }

    const respondMatch = url.pathname.match(/^\/respond\/([a-f0-9]+)$/);
    if (respondMatch && req.method === "GET") {
      const found = findParticipant(store, respondMatch[1]);
      writeStore(store);
      if (!found) return send(res, 404, "Not Found", "<p>受検URLが見つかりません。</p>");
      return send(res, 200, "スマホ回答", renderSurvey(found.company, found.participant));
    }
    if (respondMatch && req.method === "POST") {
      const found = findParticipant(store, respondMatch[1]);
      if (!found) return send(res, 404, "Not Found", "<p>受検URLが見つかりません。</p>");
      const form = await readBody(req);
      const answers = {};
      for (const q of QUESTIONS) answers[q.id] = Number(form.get(q.id));
      found.participant.answers = answers;
      found.participant.result = calculateResult(answers);
      found.participant.answeredAt = new Date().toISOString();
      writeStore(store);
      return redirect(res, `/result/${found.participant.token}`);
    }

    const resultMatch = url.pathname.match(/^\/result\/([a-f0-9]+)$/);
    if (resultMatch && req.method === "GET") {
      const found = findParticipant(store, resultMatch[1]);
      writeStore(store);
      if (!found) return send(res, 404, "Not Found", "<p>結果URLが見つかりません。</p>");
      return send(res, 200, "本人結果", renderResult(found.participant));
    }

    const consentMatch = url.pathname.match(/^\/consent\/([a-f0-9]+)$/);
    if (consentMatch && req.method === "POST") {
      const found = findParticipant(store, consentMatch[1]);
      if (!found) return send(res, 404, "Not Found", "<p>URLが見つかりません。</p>");
      found.participant.companyResultConsentAt = new Date().toISOString();
      writeStore(store);
      return redirect(res, `/result/${found.participant.token}`);
    }

    const interviewMatch = url.pathname.match(/^\/interview\/([a-f0-9]+)$/);
    if (interviewMatch && req.method === "POST") {
      const found = findParticipant(store, interviewMatch[1]);
      if (!found) return send(res, 404, "Not Found", "<p>URLが見つかりません。</p>");
      found.participant.interviewRequestedAt = new Date().toISOString();
      writeStore(store);
      return redirect(res, `/result/${found.participant.token}`);
    }

    const companyMatch = url.pathname.match(/^\/company\/([a-z0-9_-]+)$/);
    if (companyMatch && req.method === "GET") {
      const company = store.companies.find((item) => item.id === companyMatch[1]);
      writeStore(store);
      if (!company || url.searchParams.get("key") !== company.companyKey) {
        return send(res, 403, "Forbidden", "<p>会社担当者キーが違います。</p>");
      }
      return send(res, 200, "会社担当者画面", renderCompany(company));
    }

    if (url.pathname === "/practitioner" && req.method === "GET") {
      writeStore(store);
      if (url.searchParams.get("key") !== store.settings.practitionerKey) {
        return send(res, 403, "Forbidden", "<p>実施者キーが違います。</p>");
      }
      return send(res, 200, "実施者画面", renderPractitioner(store));
    }

    const invitesMatch = url.pathname.match(/^\/practitioner\/invites\/([a-z0-9_-]+)$/);
    if (invitesMatch && req.method === "GET") {
      const company = store.companies.find((item) => item.id === invitesMatch[1]);
      writeStore(store);
      if (url.searchParams.get("key") !== store.settings.practitionerKey) {
        return send(res, 403, "Forbidden", "<p>実施者キーが違います。</p>");
      }
      if (!company) return send(res, 404, "Not Found", "<p>会社が見つかりません。</p>");
      return send(res, 200, "QRコード付き受検案内", renderInvites(company, store.settings.practitionerKey, url.origin));
    }

    const mailMatch = url.pathname.match(/^\/practitioner\/mail-template\/([a-z0-9_-]+)$/);
    if (mailMatch && req.method === "GET") {
      const company = store.companies.find((item) => item.id === mailMatch[1]);
      writeStore(store);
      if (url.searchParams.get("key") !== store.settings.practitionerKey) {
        return send(res, 403, "Forbidden", "<p>実施者キーが違います。</p>");
      }
      if (!company) return send(res, 404, "Not Found", "<p>会社が見つかりません。</p>");
      return send(res, 200, "社内メール文", renderMailTemplate(company, store.settings.practitionerKey, url.origin));
    }

    const qrMatch = url.pathname.match(/^\/qr\/([a-f0-9]+)\.svg$/);
    if (qrMatch && req.method === "GET") {
      if (url.searchParams.get("key") !== store.settings.practitionerKey) {
        return send(res, 403, "Forbidden", "<p>実施者キーが違います。</p>");
      }
      const found = findParticipant(store, qrMatch[1]);
      writeStore(store);
      if (!found) return send(res, 404, "Not Found", "<p>QRコードが見つかりません。</p>");
      const responseUrl = `${url.origin}/respond/${found.participant.token}`;
      const svg = await QRCode.toString(responseUrl, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 2,
        width: 240,
      });
      return sendRaw(res, 200, { "Content-Type": "image/svg+xml; charset=utf-8" }, svg);
    }

    writeStore(store);
    return send(res, 404, "Not Found", "<p>ページが見つかりません。</p>");
  } catch (error) {
    writeStore(store);
    return send(res, 500, "Error", `<p class="danger">${escapeHtml(error.message)}</p>`);
  }
});

server.listen(PORT, HOST, () => {
  const store = readStore();
  console.log(`Stress check system running at http://${HOST}:${PORT}`);
  console.log(`Practitioner: http://${HOST}:${PORT}/practitioner?key=${store.settings.practitionerKey}`);
});
