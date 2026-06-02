# stresscheck

Googleフォーム等の回答CSVを読み込み、ストレスチェックの個人通知・集団分析・会社共有用CSVを扱うためのローカル運用システムです。

## 主な構成

- `infom-lp-sample/`
  - 管理画面、回答フォーム、GoogleフォームCSV取込、厚労省取込用CSV出力、集団分析CSV出力を含むローカルWebシステムです。
- `google-form-builder/`
  - 職業性ストレス簡易調査票57項目のGoogleフォームを作成するApps Scriptです。
- `stresscheck-system/`
  - 本人専用URL、個人結果通知、会社向け集団分析、実施者画面を確認するMVPです。

## 起動

### GoogleフォームCSV取込・集団分析システム

```powershell
cd infom-lp-sample
node serve.js
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:8890/stress-check-admin.html
```

### スマホ回答MVP

```powershell
cd stresscheck-system
npm install
node server.js
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:8787
```

## 運用上の注意

- `responses/`、`data/`、ログ、`node_modules/` はGit管理対象外です。
- 会社へ共有するのは受検済み・未受検と、個人が特定されない集団分析のみです。
- 個人結果、点数、高ストレス判定は本人同意なしに会社へ共有しません。
- 10人未満の集団分析は表示・出力しない前提です。
- 本番利用前に、認証、HTTPS、バックアップ、個人情報管理、契約・規程類を確認してください。
