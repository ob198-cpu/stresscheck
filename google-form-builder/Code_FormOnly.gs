const FORM_TITLE = "InfoM ストレスチェック回答フォーム（57項目）";

const FORM_DESCRIPTION = [
  "このフォームはストレスチェック回答用です。案内文に記載された受検者IDで回答してください。",
  "氏名・メールアドレスは原則として収集しません。",
  "回答内容、点数、高ストレス判定は、本人同意なしに会社担当者へ共有しません。",
  "個人結果通知は、Googleフォームの自動返信ではなく、実施者から本人へ行います。"
].join("\n");

const SECTIONS = [
  {
    key: "A",
    title: "A あなたの仕事について",
    help: "最もあてはまるものを一つ選んでください。",
    options: ["1 そうだ", "2 まあそうだ", "3 ややちがう", "4 ちがう"],
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
      "働きがいのある仕事だ"
    ]
  },
  {
    key: "B",
    title: "B 最近1か月間のあなたの状態について",
    help: "最もあてはまるものを一つ選んでください。",
    options: ["1 ほとんどなかった", "2 ときどきあった", "3 しばしばあった", "4 ほとんどいつもあった"],
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
      "よく眠れない"
    ]
  },
  {
    key: "C",
    title: "C あなたの周りの方々について",
    help: "次の人たちはどのくらい気軽に話ができ、頼りになり、相談を聞いてくれますか。",
    options: ["1 非常に", "2 かなり", "3 多少", "4 全くない"],
    groups: [
      {
        label: "次の人たちはどのくらい気軽に話ができますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"]
      },
      {
        label: "あなたが困った時、次の人たちはどのくらい頼りになりますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"]
      },
      {
        label: "あなたの個人的な問題を相談したら、次の人たちはどのくらいきいてくれますか？",
        questions: ["上司", "職場の同僚", "配偶者、家族、友人等"]
      }
    ]
  },
  {
    key: "D",
    title: "D 満足度について",
    help: "最もあてはまるものを一つ選んでください。",
    options: ["1 満足", "2 まあ満足", "3 やや不満足", "4 不満足"],
    questions: ["仕事に満足だ", "家庭生活に満足だ"]
  }
];

function createStressCheckGoogleFormOnly() {
  const form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION);
  form.setConfirmationMessage("回答を受け付けました。個人結果は実施者から本人へ通知します。");
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setAcceptingResponses(true);
  form.setShuffleQuestions(false);

  form.addSectionHeaderItem()
    .setTitle("回答前の確認")
    .setHelpText("案内文に記載された受検者IDで回答してください。氏名やメールアドレスは、このフォームでは原則として収集しません。");

  form.addTextItem()
    .setTitle("受検者ID")
    .setHelpText("案内文に記載されたIDを入力してください。例: SC-0001")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("性別")
    .setHelpText("結果作成に使用します。")
    .setChoiceValues(["男性", "女性"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("会社名・事業所名")
    .setHelpText("案内文で指定されている場合のみ入力してください。")
    .setRequired(false);

  form.addTextItem()
    .setTitle("部署")
    .setHelpText("集団分析に使用します。案内文で指定されている表記で入力してください。")
    .setRequired(false);

  form.addTextItem()
    .setTitle("職場コード")
    .setHelpText("案内文で指定されている場合のみ入力してください。")
    .setRequired(false);

  form.addTextItem()
    .setTitle("職場名")
    .setHelpText("案内文で指定されている場合のみ入力してください。")
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle("個人情報の扱いの確認")
    .setHelpText("回答内容・点数・高ストレス判定は、本人同意なしに会社担当者へ共有しません。")
    .setChoiceValues(["確認しました"])
    .setRequired(true);

  for (const section of SECTIONS) {
    form.addSectionHeaderItem()
      .setTitle(section.title)
      .setHelpText(section.help);

    const questions = expandQuestions(section);
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const prefix = `${section.key}${index + 1}. `;
      const title = question.group ? `${prefix}${question.group}：${question.text}` : `${prefix}${question.text}`;
      form.addMultipleChoiceItem()
        .setTitle(title)
        .setChoiceValues(section.options)
        .setRequired(true);
    }
  }

  form.addSectionHeaderItem()
    .setTitle("送信前の確認")
    .setHelpText("すべての設問に、現在の状態に最も近い選択肢で回答してください。");

  form.addCheckboxItem()
    .setTitle("回答内容の確認")
    .setChoiceValues(["すべての設問に回答しました"])
    .setRequired(true);

  const result = {
    formTitle: form.getTitle(),
    editUrl: form.getEditUrl(),
    responseUrl: form.getPublishedUrl(),
    formId: form.getId(),
    questionCount: 57,
    note: "会社担当者には編集権限を付けず、従業員には responseUrl のみ共有してください。"
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

function expandQuestions(section) {
  if (section.questions) {
    return section.questions.map((text) => ({ text }));
  }
  return section.groups.flatMap((group) => group.questions.map((text) => ({
    text,
    group: group.label
  })));
}
