const sections = [
  {
    key: "A",
    title: "A あなたの仕事について",
    lead: "最もあてはまるものを一つ選んでください。",
    options: ["そうだ", "まあそうだ", "ややちがう", "ちがう"],
    questions: [
      "非常にたくさんの仕事をしなければならない",
      "時間内に仕事が処理しきれない",
      "一生懸命働かなければならない",
      "かなり注意を集中する必要がある",
      "高度の知識や技術が必要なむずかしい仕事だ",
      "勤務時間中はいつも仕事のことを考えていなければならない",
      "からだを大変よく使う仕事だ",
      "自分のペースで仕事ができる",
      "自分で仕事の順番・やり方を決めることができる",
      "職場の仕事の方針に自分の意見を反映できる",
      "自分の技能や知識を仕事で使うことが少ない",
      "私の部署内で意見のくい違いがある",
      "私の部署と他の部署とはうまが合わない",
      "私の職場の雰囲気は友好的である",
      "私の職場の作業環境（騒音、照明、温度、換気など）はよくない",
      "仕事の内容は自分にあっている",
      "働きがいのある仕事だ",
    ],
  },
  {
    key: "B",
    title: "B 最近1か月間のあなたの状態について",
    lead: "最もあてはまるものを一つ選んでください。",
    options: ["ほとんどなかった", "ときどきあった", "しばしばあった", "ほとんどいつもあった"],
    questions: [
      "活気がわいてくる",
      "元気がいっぱいだ",
      "生き生きする",
      "怒りを感じる",
      "内心腹立たしい",
      "イライラしている",
      "ひどく疲れた",
      "へとへとだ",
      "だるい",
      "気がはりつめている",
      "不安だ",
      "落着かない",
      "ゆううつだ",
      "何をするのも面倒だ",
      "物事に集中できない",
      "気分が晴れない",
      "仕事が手につかない",
      "悲しいと感じる",
      "めまいがする",
      "体のふしぶしが痛む",
      "頭が重かったり頭痛がする",
      "首筋や肩がこる",
      "腰が痛い",
      "目が疲れる",
      "動悸や息切れがする",
      "胃腸の具合が悪い",
      "食欲がない",
      "便秘や下痢をする",
      "よく眠れない",
    ],
  },
  {
    key: "C",
    title: "C あなたの周りの方々について",
    lead: "次の人たちはどのくらい気軽に話ができ、頼りになり、相談を聞いてくれますか。",
    options: ["非常に", "かなり", "多少", "全くない"],
    groups: [
      {
        label: "次の人たちはどのくらい気軽に話ができますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"],
      },
      {
        label: "あなたが困った時、次の人たちはどのくらい頼りになりますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"],
      },
      {
        label: "あなたの個人的な問題を相談したら、次の人たちはどのくらいきいてくれますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"],
      },
    ],
  },
  {
    key: "D",
    title: "D 満足度について",
    lead: "最もあてはまるものを一つ選んでください。",
    options: ["満足", "まあ満足", "やや不満足", "不満足"],
    questions: ["仕事に満足だ", "家庭生活に満足だ"],
  },
];

const questionRoot = document.querySelector("#questionRoot");
const form = document.querySelector("#stressCheckForm");
const message = document.querySelector("#formMessage");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const respondentId = document.querySelector("#respondentId");
const saveDraftButton = document.querySelector("#saveDraftButton");
const clearDraftButton = document.querySelector("#clearDraftButton");
const totalQuestions = 57;
const draftKey = "infom-stress-check-draft";
const isPublicStaticPage = location.hostname.endsWith("github.io");
const mhlwRequiredFields = ["personName", "kanaName", "birthDate", "gender", "workplaceCode", "workplaceName"];

function getQuestions(section) {
  if (section.questions) {
    return section.questions.map((text) => ({ text }));
  }
  return section.groups.flatMap((group) => group.questions.map((text) => ({ text, group: group.label })));
}

function questionId(sectionKey, index) {
  return `${sectionKey}${index + 1}`;
}

function createOption(sectionKey, qIndex, optionText, value) {
  const name = questionId(sectionKey, qIndex);
  const id = `${name}_${value}`;
  const label = document.createElement("label");
  label.className = "answer-option";
  label.setAttribute("for", id);
  label.innerHTML = `
    <input id="${id}" type="radio" name="${name}" value="${value}" required />
    <span>${value}. ${optionText}</span>
  `;
  return label;
}

function renderQuestions() {
  for (const section of sections) {
    const sectionEl = document.createElement("section");
    sectionEl.className = "question-section";
    const questions = getQuestions(section);

    sectionEl.innerHTML = `
      <div class="question-section-head">
        <p class="lp-kicker">${section.key}</p>
        <h2>${section.title}</h2>
        <p>${section.lead}</p>
      </div>
    `;

    questions.forEach((question, index) => {
      const item = document.createElement("fieldset");
      item.className = "question-item";
      const number = questionId(section.key, index);
      const groupLabel = question.group ? `<span class="question-group-label">${question.group}</span>` : "";
      item.innerHTML = `
        <legend>${groupLabel}<strong>${number}.</strong> ${question.text}</legend>
        <div class="answer-grid"></div>
      `;

      const answerGrid = item.querySelector(".answer-grid");
      section.options.forEach((optionText, optionIndex) => {
        answerGrid.appendChild(createOption(section.key, index, optionText, optionIndex + 1));
      });
      sectionEl.appendChild(item);
    });

    questionRoot.appendChild(sectionEl);
  }
}

function collectAnswers() {
  const answers = {};
  for (const section of sections) {
    getQuestions(section).forEach((_, index) => {
      const key = questionId(section.key, index);
      const checked = form.querySelector(`input[name="${key}"]:checked`);
      if (checked) answers[key] = Number(checked.value);
    });
  }
  return answers;
}

function updateProgress() {
  const answered = Object.keys(collectAnswers()).length;
  const percent = Math.round((answered / totalQuestions) * 100);
  progressText.textContent = `入力状況 ${answered} / ${totalQuestions}`;
  progressBar.style.width = `${percent}%`;
}

function showMessage(text, type = "info") {
  message.hidden = false;
  message.className = `form-message ${type}`;
  message.textContent = text;
}

function setInitialId() {
  const params = new URLSearchParams(window.location.search);
  const fieldMap = {
    code: "participantCode",
    id: "respondentId",
    organization: "organization",
    department: "department",
    name: "personName",
    kana: "kanaName",
    birthDate: "birthDate",
    gender: "gender",
    workplaceCode: "workplaceCode",
    workplaceName: "workplaceName",
    variable: "analysisVariable",
    previousEmployeeId: "previousEmployeeId",
  };
  for (const [paramName, fieldName] of Object.entries(fieldMap)) {
    const value = params.get(paramName);
    const field = form.elements.namedItem(fieldName);
    if (value && field && typeof field.value !== "undefined") {
      field.value = value;
    }
  }
}

function saveDraft() {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.answers = collectAnswers();
  localStorage.setItem(draftKey, JSON.stringify(data));
  showMessage("途中保存しました。この端末のブラウザ内にだけ保存されています。", "info");
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    for (const [key, value] of Object.entries(data)) {
      if (key === "answers") continue;
      const field = form.elements.namedItem(key);
      if (field && typeof field.value !== "undefined" && !field.value) field.value = value;
    }
    if (data.answers) {
      for (const [key, value] of Object.entries(data.answers)) {
        const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
        if (radio) radio.checked = true;
      }
    }
    updateProgress();
    showMessage("途中保存した回答を復元しました。共有端末の場合は、送信後に保存を消してください。", "info");
  } catch {
    localStorage.removeItem(draftKey);
  }
}

function clearDraft() {
  localStorage.removeItem(draftKey);
  showMessage("この端末に保存された途中回答を削除しました。", "info");
}

function findFirstMissing() {
  if (!respondentId.value.trim()) return respondentId;
  for (const fieldName of mhlwRequiredFields) {
    const field = form.elements.namedItem(fieldName);
    if (field && !String(field.value || "").trim()) {
      return field;
    }
  }
  for (const section of sections) {
    for (let index = 0; index < getQuestions(section).length; index += 1) {
      const key = questionId(section.key, index);
      if (!form.querySelector(`input[name="${key}"]:checked`)) {
        return form.querySelector(`input[name="${key}"]`);
      }
    }
  }
  if (!document.querySelector("#privacyConfirm").checked) return document.querySelector("#privacyConfirm");
  if (!document.querySelector("#answerConfirm").checked) return document.querySelector("#answerConfirm");
  return null;
}

async function submitForm(event) {
  event.preventDefault();
  updateProgress();

  const missing = findFirstMissing();
  if (missing) {
    showMessage("未入力の項目があります。表示された箇所を確認してください。", "error");
    missing.focus({ preventScroll: true });
    missing.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = {
    respondentId: respondentId.value.trim(),
    participantCode: document.querySelector("#participantCode").value.trim(),
    organization: document.querySelector("#organization").value.trim(),
    department: document.querySelector("#department").value.trim(),
    personName: document.querySelector("#personName").value.trim(),
    kanaName: document.querySelector("#kanaName").value.trim(),
    birthDate: document.querySelector("#birthDate").value.trim(),
    gender: document.querySelector("#gender").value.trim(),
    workplaceCode: document.querySelector("#workplaceCode").value.trim(),
    workplaceName: document.querySelector("#workplaceName").value.trim(),
    analysisVariable: document.querySelector("#analysisVariable").value.trim(),
    previousEmployeeId: document.querySelector("#previousEmployeeId").value.trim(),
    answers: collectAnswers(),
    privacyConfirmed: document.querySelector("#privacyConfirm").checked,
    answerConfirmed: document.querySelector("#answerConfirm").checked,
    userAgent: navigator.userAgent,
  };

  if (isPublicStaticPage) {
    showMessage("公開サイト上では回答送信を受け付けていません。本番実施では、実施者から案内される本人専用URLで回答してください。", "info");
    return;
  }

  try {
    const response = await fetch("/api/stress-check-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "送信できませんでした。");

    localStorage.removeItem(draftKey);
    form.querySelectorAll("input, button").forEach((element) => {
      element.disabled = true;
    });
    showMessage(`送信しました。受付番号: ${result.submissionId}。結果通知は実施者から本人へ行います。`, "success");
  } catch (error) {
    showMessage(`送信できませんでした。実施者に連絡してください。理由: ${error.message}`, "error");
  }
}

renderQuestions();
setInitialId();
restoreDraft();
updateProgress();
if (isPublicStaticPage) {
  showMessage("このページはフォーム内容の確認用です。本番回答は、実施者から案内される本人専用URLで行います。", "info");
}
form.addEventListener("change", updateProgress);
form.addEventListener("submit", submitForm);
saveDraftButton.addEventListener("click", saveDraft);
clearDraftButton.addEventListener("click", clearDraft);
