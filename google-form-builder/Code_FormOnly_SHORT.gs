function createStressCheckGoogleFormOnly() {
  const title = "InfoM ストレスチェック回答フォーム（57項目）";
  const form = FormApp.create(title);
  form.setDescription([
    "このフォームはストレスチェック回答用です。案内文に記載された受検者IDで回答してください。",
    "氏名・メールアドレスは原則として収集しません。",
    "回答内容、点数、高ストレス判定は、本人同意なしに会社担当者へ共有しません。",
    "個人結果通知は、Googleフォームの自動返信ではなく、実施者から本人へ行います。"
  ].join("\n\n"));
  form.setConfirmationMessage("回答を受け付けました。個人結果は実施者から本人へ通知します。");
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setAcceptingResponses(true);
  form.setShuffleQuestions(false);

  addHeader(form, "回答前の確認", "案内文に記載された受検者IDで回答してください。氏名やメールアドレスは、このフォームでは原則として収集しません。");
  form.addTextItem().setTitle("受検者ID").setHelpText("案内文に記載されたIDを入力してください。例: SC-0001").setRequired(true);
  form.addMultipleChoiceItem().setTitle("性別").setHelpText("結果作成に使用します。").setChoiceValues(["男性", "女性"]).setRequired(true);
  form.addTextItem().setTitle("会社名・事業所名").setHelpText("案内文で指定されている場合のみ入力してください。").setRequired(false);
  form.addTextItem().setTitle("部署").setHelpText("集団分析に使用します。案内文で指定されている表記で入力してください。").setRequired(false);
  form.addTextItem().setTitle("職場コード").setHelpText("案内文で指定されている場合のみ入力してください。").setRequired(false);
  form.addTextItem().setTitle("職場名").setHelpText("案内文で指定されている場合のみ入力してください。").setRequired(false);
  form.addCheckboxItem().setTitle("個人情報の扱いの確認").setHelpText("回答内容・点数・高ストレス判定は、本人同意なしに会社担当者へ共有しません。").setChoiceValues(["確認しました"]).setRequired(true);

  addSection(form, "A", "A あなたの仕事について", "最もあてはまるものを一つ選んでください。", ["1 そうだ", "2 まあそうだ", "3 ややちがう", "4 ちがう"], `
非常にたくさんの仕事をしなければならない
時間内に仕事が処理しきれない
一生懸命働かなければならない
かなり注意を集中する必要がある
高度の知識や技術が必要なむずかしい仕事だ
勤務時間中はいつも仕事のことを考えていなければならない
からだを大変よく使う仕事だ
自分のペースで仕事ができる
自分で仕事の順番・やり方を決めることができる
職場の仕事の方針に自分の意見を反映できる
自分の技能や知識を仕事で使うことが少ない
私の部署内で意見のくい違いがある
私の部署と他の部署とはうまが合わない
私の職場の雰囲気は友好的である
私の職場の作業環境（騒音、照明、温度、換気など）はよくない
仕事の内容は自分にあっている
働きがいのある仕事だ`);

  addSection(form, "B", "B 最近1か月間のあなたの状態について", "最もあてはまるものを一つ選んでください。", ["1 ほとんどなかった", "2 ときどきあった", "3 しばしばあった", "4 ほとんどいつもあった"], `
活気がわいてくる
元気がいっぱいだ
生き生きする
怒りを感じる
内心腹立たしい
イライラしている
ひどく疲れた
へとへとだ
だるい
気がはりつめている
不安だ
落着かない
ゆううつだ
何をするのも面倒だ
物事に集中できない
気分が晴れない
仕事が手につかない
悲しいと感じる
めまいがする
体のふしぶしが痛む
頭が重かったり頭痛がする
首筋や肩がこる
腰が痛い
目が疲れる
動悸や息切れがする
胃腸の具合が悪い
食欲がない
便秘や下痢をする
よく眠れない`);

  addSection(form, "C", "C あなたの周りの方々について", "次の人たちはどのくらい気軽に話ができ、頼りになり、相談を聞いてくれますか。", ["1 非常に", "2 かなり", "3 多少", "4 全くない"], `
次の人たちはどのくらい気軽に話ができますか？：上司
次の人たちはどのくらい気軽に話ができますか？：職場の同僚
次の人たちはどのくらい気軽に話ができますか？：配偶者、家族、友人等
あなたが困った時、次の人たちはどのくらい頼りになりますか？：上司
あなたが困った時、次の人たちはどのくらい頼りになりますか？：職場の同僚
あなたが困った時、次の人たちはどのくらい頼りになりますか？：配偶者、家族、友人等
あなたの個人的な問題を相談したら、次の人たちはどのくらいきいてくれますか？：上司
あなたの個人的な問題を相談したら、次の人たちはどのくらいきいてくれますか？：職場の同僚
あなたの個人的な問題を相談したら、次の人たちはどのくらいきいてくれますか？：配偶者、家族、友人等`);

  addSection(form, "D", "D 満足度について", "最もあてはまるものを一つ選んでください。", ["1 満足", "2 まあ満足", "3 やや不満足", "4 不満足"], "仕事に満足だ\n家庭生活に満足だ");
  addHeader(form, "送信前の確認", "すべての設問に、現在の状態に最も近い選択肢で回答してください。");
  form.addCheckboxItem().setTitle("回答内容の確認").setChoiceValues(["すべての設問に回答しました"]).setRequired(true);
  console.log(JSON.stringify({ editUrl: form.getEditUrl(), responseUrl: form.getPublishedUrl(), formId: form.getId(), questionCount: 57 }, null, 2));
}

function addHeader(form, title, help) {
  form.addSectionHeaderItem().setTitle(title).setHelpText(help);
}

function addSection(form, key, title, help, options, questionText) {
  addHeader(form, title, help);
  questionText.trim().split("\n").forEach((q, i) => {
    form.addMultipleChoiceItem().setTitle(`${key}${i + 1}. ${q}`).setChoiceValues(options).setRequired(true);
  });
}
