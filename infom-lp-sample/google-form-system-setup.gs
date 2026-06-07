/**
 * InfoM stress-check Google Form / response Sheet setup.
 *
 * Run this script from the response Spreadsheet:
 * 1. Open the response Spreadsheet.
 * 2. Extensions > Apps Script.
 * 3. Paste this file.
 * 4. Run setupInfoMStressCheck().
 *
 * The script uses the Form linked to the active Spreadsheet.
 */
const INFOM_REQUIRED_FORM_ITEMS = [
  {
    title: "受検者ID",
    type: "TEXT",
    helpText: "会社から案内された受検者IDまたは受検コードを入力してください。個人結果と名簿照合に使います。",
    required: true,
  },
  {
    title: "氏名",
    type: "TEXT",
    helpText: "本人向け結果作成に使います。名簿補完で管理する場合は、フォームでは収集せず名簿補完テンプレートを使ってください。",
    required: false,
  },
  {
    title: "フリガナ",
    type: "TEXT",
    helpText: "本人確認・同姓同名確認に使います。名簿補完で管理する場合は未入力でも運用できます。",
    required: false,
  },
  {
    title: "生年月日",
    type: "DATE",
    helpText: "本人確認・同姓同名確認に使います。名簿補完で管理する場合は未入力でも運用できます。",
    required: false,
  },
  {
    title: "性別",
    type: "MULTIPLE_CHOICE",
    choices: ["男性", "女性"],
    helpText: "厚労省資料の素点換算表方式による本人向け結果作成に必要です。",
    required: true,
  },
  {
    title: "職場コード",
    type: "TEXT",
    helpText: "集団分析の単位に使います。名簿補完で管理する場合は未入力でも運用できます。",
    required: false,
  },
  {
    title: "職場名",
    type: "TEXT",
    helpText: "集団分析の表示名に使います。名簿補完で管理する場合は未入力でも運用できます。",
    required: false,
  },
];

const INFOM_ROSTER_HEADERS = [
  "受検者ID",
  "氏名",
  "フリガナ",
  "生年月日",
  "性別",
  "会社名・事業所名",
  "部署",
  "職場コード",
  "職場名",
  "備考",
];

const INFOM_OPERATION_HEADERS = [
  ["区分", "確認項目", "内容", "状態", "備考"],
  ["質問紙", "厚労省PDF原文維持", "A/B/C/D見出し、57項目設問文、回答選択肢、順番を原文どおり使う", "", "設問文は一字一句変更しない"],
  ["質問紙", "操作表現変更記録", "Googleフォーム用に追加・補足した操作説明だけ記録する", "", "設問文・選択肢の変更は不可"],
  ["権限", "回答スプレッドシート", "閲覧権限を実施者・実施事務従事者に限定する", "", "会社担当者が個人結果を見ない状態にする"],
  ["本人通知", "申出先・申出期限", "本人向け結果に面接指導申出先・申出期限を記載する", "", ""],
  ["集団分析", "10人未満非表示", "10人未満部署や個人推測リスクのある単位を会社共有から外す", "", ""],
  ["労基署報告", "50人以上事業場", "報告要否、提出者、提出方法、控えの保管場所を確認する", "", ""],
];

const INFOM_WORDING_LOG_HEADERS = [
  "分類",
  "対象箇所",
  "厚労省PDF原文",
  "フォーム上の表記",
  "変更理由",
  "実施者確認",
  "確認日",
  "備考",
];

function setupInfoMStressCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formUrl = ss.getFormUrl();
  if (!formUrl) {
    throw new Error("このスプレッドシートにリンクされたGoogleフォームが見つかりません。フォーム回答シートから実行してください。");
  }

  const form = FormApp.openByUrl(formUrl);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage("回答ありがとうございました。個人結果は、実施者側の案内に従って通知されます。");

  ensureDescription(form);
  ensureRequiredFormItems(form);
  createOrResetRosterSheet(ss);
  createOrResetOperationSheet(ss);
  createOrResetWordingLogSheet(ss);
  createOrResetSystemGuideSheet(ss);
}

function ensureDescription(form) {
  const text =
    "本フォームは、厚生労働省「職業性ストレス簡易調査票57項目」のA/B/C/D見出し、設問文、回答選択肢、順番を原文に沿って作成します。Googleフォームの仕様上、回答は選択肢をクリックして行ってください。回答内容、点数、個人結果、高ストレス判定は、本人同意なしに会社担当者へ共有しません。";
  form.setDescription(text);
}

function ensureRequiredFormItems(form) {
  const existing = form.getItems().reduce((map, item) => {
    map[item.getTitle()] = item;
    return map;
  }, {});

  let insertIndex = findFirstQuestionIndex(form);
  INFOM_REQUIRED_FORM_ITEMS.forEach((spec) => {
    const item = prepareFormItem(form, existing[spec.title], spec);
    applyItemSettings(item, spec);
    try {
      form.moveItem(item, insertIndex);
      insertIndex += 1;
    } catch (e) {
      // If Google changes item movement behavior, the item still exists and remains usable.
    }
  });
}

function prepareFormItem(form, item, spec) {
  if (!item) return createItem(form, spec);
  if (isCompatibleItem(item, spec)) return item;

  const oldTitle = `${spec.title}（旧・型不一致）`;
  try {
    item.setTitle(oldTitle);
  } catch (e) {
    // Non-editable or unexpected item types are left in place and a correct item is added.
  }
  return createItem(form, spec);
}

function isCompatibleItem(item, spec) {
  const type = item.getType();
  if (spec.type === "DATE") return type === FormApp.ItemType.DATE;
  if (spec.type === "MULTIPLE_CHOICE") {
    return type === FormApp.ItemType.MULTIPLE_CHOICE || type === FormApp.ItemType.LIST;
  }
  if (spec.type === "TEXT") {
    return type === FormApp.ItemType.TEXT || type === FormApp.ItemType.PARAGRAPH_TEXT;
  }
  return false;
}

function createItem(form, spec) {
  if (spec.type === "DATE") return form.addDateItem().setTitle(spec.title);
  if (spec.type === "MULTIPLE_CHOICE") return form.addMultipleChoiceItem().setTitle(spec.title);
  return form.addTextItem().setTitle(spec.title);
}

function applyItemSettings(item, spec) {
  if (spec.type === "DATE") {
    const dateItem = castItemOrSelf(item, "asDateItem");
    dateItem.setHelpText(spec.helpText || "").setRequired(!!spec.required);
    return;
  }
  if (spec.type === "MULTIPLE_CHOICE") {
    if (item.getType() === FormApp.ItemType.LIST) {
      const list = castItemOrSelf(item, "asListItem");
      list.setHelpText(spec.helpText || "").setRequired(!!spec.required);
      list.setChoices((spec.choices || []).map((choice) => list.createChoice(choice)));
      return;
    }
    const mc = castItemOrSelf(item, "asMultipleChoiceItem");
    mc.setHelpText(spec.helpText || "").setRequired(!!spec.required);
    mc.setChoices((spec.choices || []).map((choice) => mc.createChoice(choice)));
    return;
  }
  if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) {
    castItemOrSelf(item, "asParagraphTextItem").setHelpText(spec.helpText || "").setRequired(!!spec.required);
    return;
  }
  const textItem = castItemOrSelf(item, "asTextItem");
  textItem.setHelpText(spec.helpText || "").setRequired(!!spec.required);
}

function castItemOrSelf(item, methodName) {
  try {
    if (item && typeof item[methodName] === "function") return item[methodName]();
  } catch (e) {
    // Newly created items are already concrete item types and do not need casting.
  }
  return item;
}

function findFirstQuestionIndex(form) {
  const items = form.getItems();
  const idx = items.findIndex((item) => /^A1[.．]/.test(item.getTitle()));
  return idx >= 0 ? idx : Math.min(1, items.length);
}

function createOrResetRosterSheet(ss) {
  const sheet = getOrCreateSheet(ss, "名簿補完テンプレート");
  sheet.clear();
  sheet.getRange(1, 1, 1, INFOM_ROSTER_HEADERS.length).setValues([INFOM_ROSTER_HEADERS]);
  sheet.getRange(2, 1, 1, INFOM_ROSTER_HEADERS.length).setValues([
    ["SC-0001", "山田 太郎", "ヤマダ タロウ", "1980/01/01", "男性", "株式会社サンプル", "営業部", "D001", "営業部", "サンプル行"],
  ]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, INFOM_ROSTER_HEADERS.length);
}

function createOrResetOperationSheet(ss) {
  const sheet = getOrCreateSheet(ss, "運用確認");
  sheet.clear();
  sheet.getRange(1, 1, INFOM_OPERATION_HEADERS.length, INFOM_OPERATION_HEADERS[0].length).setValues(INFOM_OPERATION_HEADERS);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, INFOM_OPERATION_HEADERS[0].length);
}

function createOrResetWordingLogSheet(ss) {
  const sheet = getOrCreateSheet(ss, "フォーム文言変更記録");
  sheet.clear();
  sheet.getRange(1, 1, 1, INFOM_WORDING_LOG_HEADERS.length).setValues([INFOM_WORDING_LOG_HEADERS]);
  sheet.getRange(2, 1, 1, INFOM_WORDING_LOG_HEADERS.length).setValues([
    ["操作説明", "回答方法", "", "Googleフォームの仕様上、回答は選択肢をクリックして行ってください", "フォーム操作の補足", "", "", "設問文・選択肢は変更しない"],
  ]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, INFOM_WORDING_LOG_HEADERS.length);
}

function createOrResetSystemGuideSheet(ss) {
  const sheet = getOrCreateSheet(ss, "InfoM連携手順");
  sheet.clear();
  const rows = [
    ["手順", "内容"],
    ["1", "フォーム回答をCSVで保存する"],
    ["2", "必要に応じて名簿補完テンプレートをCSV保存する"],
    ["3", "InfoM管理画面でGoogleフォーム回答CSVを読み込む"],
    ["4", "質問紙照合CSVで厚労省PDF原文との一致を確認する"],
    ["5", "不足情報がある場合は名簿補完CSVまたは管理画面内入力で補完する"],
    ["6", "本人向け結果、集団分析、労基署報告用集計、実施完了チェックCSVを保存する"],
  ];
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
