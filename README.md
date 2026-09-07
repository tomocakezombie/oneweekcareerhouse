# KKI 端末確認サイト

山梨大学キャリアハウス(KKI)の端末利用状況をリアルタイムで確認できるWebサービスです。

## 機能

- **端末状況のリアルタイム表示** — 5秒ごとに自動更新、使用中/空きを色分けで表示
- **週間利用ランキング** — 直近1週間の利用時間上位10名を表示（収集スクリプトが常時更新）
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
├── seat_log.txt            # 収集スクリプトのログ（スクリプトが生成）
├── cronlog.txt             # cron 起動時の標準出力・標準エラー（cron が生成）
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
| bw01〜bw12 / cw〜dw / fw〜jw | 各12台 |
| ew01〜ew08 | 8台 |
| kw01〜kw10 | 10台 |
| lw01〜lw12 / nw01〜nw12 | 各12台 |
| mw01〜mw06 | 6台 |
| zw01, zw03 | 2台（zw02はWindows端末のため除外） |

## システム構成

### 全体の流れ

```
zw03（収集側）
  cron ─ sh ─ flock ─ careerscript -rank（収集側プロセス）
                        ├─ ssh aw01 ──> aw01: sshd ─ careerscript -thread（端末側プロセス）
                        ├─ ssh aw02 ──> aw02: sshd ─ careerscript -thread
                        │   ...（端末 1 台につき ssh 1 本）
                        └─ ssh zw03 ──> zw03: sshd ─ careerscript -thread
                        │
                        └─ 4 秒ごとに seat_output.txt / weekly_login_time.txt を書き出す

Web サーバ
  ブラウザ ─ js/script.js ─ 5 秒ごとに php/data.php（seat_output.txt を解析）
                          └ 5 秒ごとに weekly_login_time.txt
```

`careerscript` は 1 本のスクリプトですが、引数によって 2 つの役割で動きます。

1. **収集側**（`careerscript -rank`、zw03 で 1 本だけ動く）
   端末 1 台につき 1 本のスレッドを作り、各端末へ `ssh` して端末側プロセスを起動し、その標準出力を読み続けます。
   4 秒ごとに全端末の最新データをまとめて `seat_output.txt` に書き、`-rank` が付いていれば `weekly_login_time.txt` も書きます。
2. **端末側**（`careerscript -thread`、収集側が ssh 経由で各端末に起動する）
   `LC_ALL=C last -w --time-format=iso -s -7days` で直近 1 週間のログイン履歴を取得し、CSV 形式の行にして標準出力へ流します。
   4 秒ごとに全件を送り直し、末尾に `Snapshot End` 行を付けます。収集側はこの区切りを受けて、その端末のデータを丸ごと最新の内容に置き換えます。

スクリプトの実体は NFS 上のホーム（`/kkihome/home/assist/local_html/seat/python/careerscript`）にあり、
全端末が同じファイルを実行するので、差し替えは 1 か所で済みます。

### データ形式

`seat_output.txt`（収集側が生成。PHP が読む）

```
Update Time : 2025-11-21 12:33:07.996165
送信時刻,端末名,tty,ログイン時刻,ログアウト時刻または logged,利用秒数,ユーザ名
2025-11-21 12:33:05.628183,aw01,:1,2025-11-21T10:40:41+09:00,logged,6513,t2500005
2025-11-21 12:33:05.628293,aw01,:1,2025-11-17T14:50:23+09:00,2025-11-17T16:21:57+09:00,5494,t2400268
2025-11-21 12:33:05.700000,bw01,-,-,-,0,-          # 接続中だが 1 週間セッションがない端末（空きと判定させるためのダミー行）
```

- `php/data.php` は 5 列目が `logged` か未来の時刻なら使用中、それ以外なら空きと判定します。ファイルに現れない端末は判定されません。
- `Update Time` が現在時刻より 10 秒以上古いと、画面に「座席情報が取得できていません」と表示されます。
- 切断中の端末は `seat_output.txt` に現れません。

`weekly_login_time.txt`（`-rank` 付きの収集側が生成。JS が読む）

```
ユーザ名,HH:MM:SS
t22cs001,03:32:03
```

`seat_log.txt`（収集側だけが書く）には、端末の接続・切断、端末側からのエラー、書き込み失敗が記録されます。
端末側プロセスはログファイルに直接書かず、標準出力で収集側に渡します。

### 異常時の責務分担

| 異常 | 誰が対処するか | 挙動 |
|---|---|---|
| 一部の端末が落ちた・端末側が異常終了した | 収集側スクリプト | 該当スレッドがログに記録し、10〜60 秒間隔で再接続を繰り返す。他の端末は影響を受けない |
| 全端末に届かない（ネットワーク断・NFS 停止） | 収集側スクリプト | 上記が全端末で起きるだけ。収集側は生き続け、復旧後に自動で再接続する |
| 収集側プロセスが異常終了した・zw03 が再起動した | cron + flock | 鍵が外れるので、次の cron 実行時に自動で起動する |
| 収集側が生きているが固まった | 手動 | flock の鍵が保持されたままなので自動復帰しない。プロセスを kill すれば cron が再起動する |

端末側プロセスの再起動は収集側の責務、収集側プロセスの再起動は cron の責務です。

## 使い方

### パーミッション設定

Webサーバにデプロイする前に実行します。

```bash
bash chmodScript.sh
```

### データ収集スクリプトの起動（cron + flock）

収集側は zw03 上の assist アカウントの crontab から起動します。手動で `python3 python/careerscript` を常駐させる必要はありません。

```
@reboot    sleep 60; touch /tmp/careerscript.lock; flock -n /tmp/careerscript.lock /kkihome/home/assist/local_html/seat/python/careerscript -rank >> /kkihome/home/assist/local_html/seat/cronlog.txt 2>&1
0 * * * *  touch /tmp/careerscript.lock; flock -n /tmp/careerscript.lock /kkihome/home/assist/local_html/seat/python/careerscript -rank >> /kkihome/home/assist/local_html/seat/cronlog.txt 2>&1
```

- **`flock -n`** はロックファイルの鍵を取れたときだけ後ろのコマンドを実行します。鍵は収集側プロセスが生きている間ずっと保持され、プロセスが消えると OS が自動で外します。
  そのため、収集側が動いていればこの行は何もせず終了し、死んでいれば起動します。プロセス名の照合（`pgrep`）は使いません。
- **1 時間に 1 回**（毎時 0 分）確認します。収集側が異常終了した場合、復帰までの最大待ち時間は 1 時間です。
  待ち時間を短くしたい場合は `0 * * * *` を `* * * * *`（毎分）に変えるだけで済みます。
- **`@reboot` 行**は zw03 の再起動直後に起動するための行です。ネットワークと NFS が上がるのを待つため 60 秒待ってから起動します。
- **`&` を付けない**でください。バックグラウンドにすると flock が鍵を手放し、二重起動になります。
- **`touch`** はロックファイルの更新日時を新しくするためのものです。zw03 の `/tmp` は 30 日間触られていないファイルを削除するので、
  削除されて作り直されると別の鍵になり、二重起動が可能になります。
- **`-rank`** を付けると週間ランキングが直近 1 週間のローリング集計として常時更新されます。付けないと `weekly_login_time.txt` は更新されません。
- `cronlog.txt` には収集側の標準出力・標準エラーが追記されます。正常時は何も出ないので、ここに何か書かれていれば Python の異常終了です。

### 停止・差し替え

収集側を kill しただけだと、次の cron 実行で再起動します。止めておきたいときは次の順で行います。

1. crontab の 2 行をコメントアウトする
2. 収集側プロセスを終了する（SIGTERM で ssh 子プロセスも片付けて終了します）

```bash
pkill -TERM -f "careerscript -rank"
```

3. スクリプトを差し替える（NFS 上の 1 ファイルを置き換えるだけで全端末に反映されます）
4. crontab の行を戻す。次の cron 実行で新版が起動する

旧版の収集側が動いたまま差し替えると、新版の端末側が送る `Snapshot End` 行を旧版が処理できません。必ず止めてから差し替えてください。

### 手動での動作確認

```bash
# 端末側の出力を確認する（その端末の直近 1 週間の履歴が CSV で流れる）
python3 python/careerscript -thread -i 4

# 収集側を前面で動かす（Ctrl+C で終了）
python3 python/careerscript -rank -i 4

# 出力先を変えて試す（本番の seat_output.txt を上書きせずに動作確認できる）
python3 python/careerscript -rank -i 4 -o /path/to/test_dir
```

`-o` を省くと `/kkihome/home/assist/local_html/seat` に書きます。端末側は ssh 経由で自動起動されるので、`-thread` を手で使うのは出力の確認時だけです。

### 事前に確認すること

- assist の `~/.ssh` で全端末に鍵認証で入れること。収集側は `BatchMode=yes` で ssh するので、パスワード入力や未知のホスト鍵の確認で止まることはなく、失敗として `seat_log.txt` に記録されます。
- zw03 に `flock` コマンド（util-linux）があること。

## 技術スタック

- **フロントエンド**: HTML / CSS / JavaScript、Bootstrap 5
- **バックエンド**: PHP
- **データ収集**: Python 3
