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
    helpText: "案内文に記載されたIDを入力してください。例: SC-0001",
    required: true,
  },
  {
    title: "性別",
    type: "MULTIPLE_CHOICE",
    choices: ["男性", "女性"],
    helpText: "結果作成に使用します。",
    required: true,
  },
  {
    title: "職場コード",
    type: "TEXT",
    helpText: "案内文で指定されている場合のみ入力してください。",
    required: false,
  },
  {
    title: "職場名",
    type: "TEXT",
    helpText: "案内文で指定されている場合のみ入力してください。",
    required: false,
  },
];

const INFOM_REMOVE_FORM_ITEM_TITLES = ["氏名", "フリガナ", "生年月日"];

const INFOM_SECTION_DEFAULTS = {
  A: { title: "A あなたの仕事について", helpText: "最もあてはまるものを一つ選んでください。", choices: ["1 そうだ", "2 まあそうだ", "3 ややちがう", "4 ちがう"] },
  B: { title: "B 最近1か月間のあなたの状態について", helpText: "最もあてはまるものを一つ選んでください。", choices: ["1 ほとんどなかった", "2 ときどきあった", "3 しばしばあった", "4 ほとんどいつもあった"] },
  C: { title: "C あなたの周りの方々について", helpText: "最もあてはまるものを一つ選んでください。", choices: ["1 非常に", "2 かなり", "3 多少", "4 全くない"] },
  D: { title: "D 満足度について", helpText: "最もあてはまるものを一つ選んでください。", choices: ["1 満足", "2 まあ満足", "3 やや不満足", "4 不満足"] },
};

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
  removeUnnecessaryPersonalItems(form);
  ensureRequiredFormItems(form);
  createOrResetRosterSheet(ss);
  createOrResetOperationSheet(ss);
  createOrResetWordingLogSheet(ss);
  createOrResetSystemGuideSheet(ss);
  createOrResetNormalizedImportSheet(ss);
}

function rebuildLinkedInfoMForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formUrl = ss.getFormUrl();
  if (!formUrl) {
    throw new Error("このスプレッドシートにリンクされたGoogleフォームが見つかりません。フォーム回答シートから実行してください。");
  }

  const form = FormApp.openByUrl(formUrl);
  const questionnaire = readQuestionnaireItems(form);
  const questionCount = Object.values(questionnaire).reduce((sum, section) => sum + section.questions.length, 0);
  if (questionCount !== 57) {
    throw new Error(`57項目を読み取れませんでした。読み取り件数: ${questionCount}。先にフォームのA1〜D2が揃っているか確認してください。`);
  }

  deleteAllFormItems(form);
  applyBaseFormSettings(form);
  addCleanIntroItems(form);
  addQuestionnaireItems(form, questionnaire);
  addFinalConfirmationItems(form);
  createOrResetRosterSheet(ss);
  createOrResetOperationSheet(ss);
  createOrResetWordingLogSheet(ss);
  createOrResetSystemGuideSheet(ss);
  createOrResetNormalizedImportSheet(ss);
}

function applyBaseFormSettings(form) {
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage("回答ありがとうございました。個人結果は、実施者側の案内に従って通知されます。");
  ensureDescription(form);
}

function addCleanIntroItems(form) {
  form.addSectionHeaderItem()
    .setTitle("回答前の確認")
    .setHelpText("案内文に記載された受検者IDで回答してください。氏名やメールアドレスは、このフォームでは原則として収集しません。");

  INFOM_REQUIRED_FORM_ITEMS.forEach((spec) => {
    applyItemSettings(createItem(form, spec), spec);
  });

  form.addTextItem()
    .setTitle("会社名・事業所名")
    .setHelpText("案内文で指定されている場合のみ入力してください。")
    .setRequired(false);

  form.addTextItem()
    .setTitle("部署")
    .setHelpText("案内文で指定されている場合のみ入力してください。")
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle("個人情報の扱いの確認")
    .setHelpText("回答内容・点数・個人結果・高ストレス判定は、本人同意なしに会社担当者へ共有しません。")
    .setChoiceValues(["確認しました"])
    .setRequired(true);
}

function addQuestionnaireItems(form, questionnaire) {
  ["A", "B", "C", "D"].forEach((key) => {
    const section = questionnaire[key];
    const defaults = INFOM_SECTION_DEFAULTS[key];
    form.addSectionHeaderItem()
      .setTitle(section.title || defaults.title)
      .setHelpText(section.helpText || defaults.helpText);
    section.questions
      .sort((a, b) => a.order - b.order)
      .forEach((question) => {
        form.addMultipleChoiceItem()
          .setTitle(question.title)
          .setChoiceValues(question.choices.length ? question.choices : defaults.choices)
          .setRequired(true);
      });
  });
}

function addFinalConfirmationItems(form) {
  form.addSectionHeaderItem()
    .setTitle("送信前の確認")
    .setHelpText("すべての設問に、現在の状態に最も近い選択肢で回答してください。");

  form.addCheckboxItem()
    .setTitle("回答内容の確認")
    .setChoiceValues(["すべての設問に回答しました"])
    .setRequired(true);
}

function readQuestionnaireItems(form) {
  const result = {
    A: { ...INFOM_SECTION_DEFAULTS.A, questions: [] },
    B: { ...INFOM_SECTION_DEFAULTS.B, questions: [] },
    C: { ...INFOM_SECTION_DEFAULTS.C, questions: [] },
    D: { ...INFOM_SECTION_DEFAULTS.D, questions: [] },
  };
  let currentSectionKey = "";
  form.getItems().forEach((item) => {
    const title = item.getTitle();
    const sectionMatch = title.match(/^([ABCD])\s/);
    if (sectionMatch && result[sectionMatch[1]]) {
      currentSectionKey = sectionMatch[1];
      result[currentSectionKey].title = title;
      result[currentSectionKey].helpText = getItemHelpText(item) || result[currentSectionKey].helpText;
      return;
    }
    const questionMatch = title.match(/^([ABCD])(\d+)[.．]/);
    if (!questionMatch || !result[questionMatch[1]]) return;
    const choices = getItemChoices(item);
    result[questionMatch[1]].questions.push({
      order: Number(questionMatch[2]),
      title,
      choices,
    });
  });
  return result;
}

function getItemHelpText(item) {
  try {
    return item.getHelpText ? item.getHelpText() : "";
  } catch (e) {
    return "";
  }
}

function getItemChoices(item) {
  try {
    const casted = item.getType() === FormApp.ItemType.LIST
      ? castItemOrSelf(item, "asListItem")
      : castItemOrSelf(item, "asMultipleChoiceItem");
    return casted.getChoices().map((choice) => choice.getValue());
  } catch (e) {
    return [];
  }
}

function deleteAllFormItems(form) {
  const items = form.getItems();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    form.deleteItem(index);
  }
}

function ensureDescription(form) {
  const text =
    "このフォームはストレスチェック回答用です。案内文に記載された受検者IDで回答してください。氏名・メールアドレスは原則として収集しません。回答内容、点数、個人結果、高ストレス判定は、本人同意なしに会社担当者へ共有しません。個人結果は実施者から本人へ通知します。";
  form.setDescription(text);
}

function removeUnnecessaryPersonalItems(form) {
  const items = form.getItems();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    const baseTitle = item.getTitle().replace(/（旧・型不一致）$/, "");
    if (INFOM_REMOVE_FORM_ITEM_TITLES.includes(baseTitle)) {
      form.deleteItem(index);
    }
  }
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
  const idx = items.findIndex((item) => /^A\s|^A　|^A1[.．]/.test(item.getTitle()));
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

function createOrResetNormalizedImportSheet(ss) {
  const sourceSheet = ss.getSheets().find((sheet) => /^フォームの回答/.test(sheet.getName())) || ss.getSheets()[0];
  const sourceName = sourceSheet.getName();
  const sourceLastColumn = Math.max(sourceSheet.getLastColumn(), 1);
  const sourceHeaders = sourceSheet.getRange(1, 1, 1, sourceLastColumn).getValues()[0].filter(Boolean);
  const baseHeaders = ["タイムスタンプ", "受検者ID", "性別", "会社名・事業所名", "部署", "職場コード", "職場名", "個人情報の扱いの確認"];
  const questionHeaders = sourceHeaders.filter((header) => /^[ABCD]\d+[.．]/.test(String(header)));
  const tailHeaders = ["回答内容の確認"];
  const headers = [...baseHeaders, ...questionHeaders, ...tailHeaders].filter((header, index, all) => all.indexOf(header) === index);
  const sheet = getOrCreateSheet(ss, "InfoM取込用CSV");
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const escapedSourceName = sourceName.replace(/'/g, "''");
  const formulas = [];
  for (let row = 2; row <= 1001; row += 1) {
    formulas.push(headers.map((_, colIndex) => {
      const colLetter = columnLetter(colIndex + 1);
      return `=IFERROR(INDEX('${escapedSourceName}'!$A:$ZZ,ROW(),MATCH(${colLetter}$1,'${escapedSourceName}'!$1:$1,0)),"")`;
    }));
  }
  sheet.getRange(2, 1, formulas.length, headers.length).setFormulas(formulas);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function columnLetter(index) {
  let value = "";
  while (index > 0) {
    const mod = (index - 1) % 26;
    value = String.fromCharCode(65 + mod) + value;
    index = Math.floor((index - mod) / 26);
  }
  return value;
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
