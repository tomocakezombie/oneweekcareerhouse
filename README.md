# KKI 端末確認サイト

山梨大学キャリアハウス(KKI)の端末利用状況をリアルタイムで確認できるWebサービスです。

## 機能

- **端末状況のリアルタイム表示** — 5秒ごとに自動更新、使用中/空きを色分けで表示
- **週間利用ランキング** — 直近1週間の利用時間上位10名を表示（毎週月曜 6:00 更新）
- **混雑状況の可視化** — 使用率に応じて「混雑」「やや混雑」「空き」を表示
- **授業予定の確認** — lwwの計算機室時間割をiframeで表示

## 画面の色分け

| 色 | 意味 |
|---|---|
| オレンジ | 使用中 |
| 水色 | 空き |
| 金・銀・銅 | ランキング 1〜3 位の使用者 |
| 紫 | ランキング 4〜10 位の使用者 |

## ディレクトリ構成

```
.
├── index.html              # メインページ
├── how.html                # 使い方ガイド
├── newest_class_plan.html  # 授業予定ページ
├── seat_data.json          # 端末レイアウト定義
├── seat_output.txt         # 端末状況データ（スクリプトが生成）
├── weekly_login_time.txt   # 週間ランキングデータ（スクリプトが生成）
├── css/                    # スタイルシート
├── js/
│   └── script.js           # フロントエンドロジック
├── php/
│   ├── data.php            # 端末状況を返すAPI
│   ├── getnewclass.php     # 授業予定取得
│   └── getnewest.php       # 最新データ取得
├── python/
│   ├── careerscript        # 端末ログイン状況を収集するメインスクリプト
│   ├── whonow              # 現在のログインユーザ確認スクリプト
│   └── getNewestClassPlan  # 最新授業計画取得スクリプト
└── chmodScript.sh          # Webサーバ用パーミッション設定スクリプト
```

## 監視対象端末

`careerscript` が以下の端末への SSH 接続を監視します。

| 列 | 台数 |
|---|---|
| aw01〜aw06 | 6台 |
| bw01〜bw12 / cw〜jw | 各12台 |
| kw01〜kw10 | 10台 |
| lw01〜lw12 / nw01〜nw12 | 各12台 |
| mw01〜mw06 | 6台 |
| zw01, zw03 | 2台（zw02はWindows端末のため除外） |

## 使い方

### パーミッション設定

Webサーバにデプロイする前に実行します。

```bash
bash chmodScript.sh
```

### データ収集スクリプトの起動

端末のログイン状況は `python/careerscript` が定期的に収集し、`seat_output.txt` と `weekly_login_time.txt` を更新します。サーバ上でデーモンとして常時起動させてください。

```bash
python3 python/careerscript
```

## 技術スタック

- **フロントエンド**: HTML / CSS / JavaScript、Bootstrap 5
- **バックエンド**: PHP
- **データ収集**: Python 3

