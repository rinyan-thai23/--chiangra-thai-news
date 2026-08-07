# Chiangrai Thai News

## このリポジトリの目的

ChatGPTで作成した「北タイ優先のタイニュース＋日本ニュース」を受け取り、GitHub上で保管・検証し、将来LINE BOTへ配信するための中継リポジトリです。現在はLINE Messaging APIへ実送信しません。

## 全体フロー

```text
ChatGPT
  ↓
GitHub（latestへ保存、archiveへ保管）
  ↓
GitHub Actions（内容を検証、送信データを準備）
  ↓
LINE送信処理（将来実装）
  ↓
LINEグループ
```

## ディレクトリ

- `latest/`: 最新の記事、LINE用本文、画像、配信状態を置きます。
- `archive/`: 確定した過去記事を `YYYY/MM/YYYY-MM-DD/` 単位で保管します。
- `scripts/`: ニュース検証とLINE送信データ準備のスクリプトです。
- `templates/`: 毎日の記事とpayloadを作るための雛形です。
- `logs/`: 将来、配信処理のログを置くための予約領域です。ログファイル自体はGit管理しません。
- `.github/workflows/`: pushとpull request時に自動検証するGitHub Actionsです。

## 毎日の運用手順

1. `templates/` を参考にChatGPTでニュース本文を生成します。
2. `latest/article.md` を更新します。
3. `latest/message.txt` をLINEで読みやすいプレーンテキストに更新します。
4. `latest/thumbnail.png` を16:9の画像に更新します。
5. `latest/payload.json` の日付、タイトル、状態、保存先を更新します。
6. `npm run check` でローカル検証します。
7. GitHubへcommit/pushします。
8. GitHub Actionsが内容を検証し、LINE送信用データをドライランで準備します。
9. 将来、検証後のLINE自動配信を追加します。

確定した記事は、payloadの `archive_path` が示すディレクトリ（例: `archive/2026/08/2026-08-07/`）へ `latest/` の4ファイルをコピーして保管します。事故防止のため、現段階では自動コピーや既存アーカイブの上書きは行いません。

## ローカルテスト

Node.js 20以上を使用します。外部パッケージのインストールは不要です。

```bash
npm run validate
npm run prepare
npm run check
```

- `validate`: 必須ファイル、JSON、日付、status、参照先、記事タイトル、本文を検証します。
- `prepare`: LINE送信直前のオブジェクトを表示します。外部通信はしません。
- `check`: 上記2つを順番に実行します。

## payload.jsonのstatus

- `draft`: 編集中
- `ready`: 検証・配信準備が完了
- `processing`: 配信処理中（将来利用）
- `sent`: 配信済み（将来利用）
- `error`: エラー発生（将来利用）

`line.enabled` はLINE連携の有効状態、`line.sent` と `line.sent_at` は送信結果を記録するための予約項目です。現在のスクリプトはこれらを変更しません。

## LINE連携予定

将来は次の環境変数をGitHub ActionsのGitHub Secretsから渡します。

- `LINE_GROUP_ID`: 配信先グループID
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Messaging APIのアクセストークン

現在の `prepare-line-message.js` は `LINE_GROUP_ID` がなければ `LINE_GROUP_ID_NOT_SET` を表示し、トークンは読み取りません。LINE APIへの実送信処理もありません。

## セキュリティ

APIキー、アクセストークン、groupIdなどの秘密情報をコードやJSONへ直接コミットしないでください。`.env`、`.env.local`、`secrets/`、`*.secret`、ログは `.gitignore` の対象です。本番用の秘密情報はGitHub Secretsで管理してください。

## 初期サンプル

`latest/` には2026年8月7日付の接続テスト用ダミーニュースと16:9のダミーPNGがあります。実運用開始時に、ChatGPTが生成した記事・本文・画像・payloadへ4ファイルすべてを置き換えてください。
