#!/bin/bash
# 公開用の権限を設定するスクリプト
#
# Web サーバ (lww) は assist とは別のユーザで動くので，ブラウザや PHP が読むファイルは「他人が読める (o+r)」，
# その途中のディレクトリは「他人が通過できる (o+x)」必要がある．
# git は実行ビットしか記録しないため，git pull で新しく作られたり書き換えられたファイルは
# 実行したユーザの umask (assist は 077) に従って 600 になり，サイトが 403 になる．
# そのため git pull の後は必ずこのスクリプトを実行する (githooks/post-merge から自動で呼ばれる)．
#
# 手で実行する場合:  bash chmodScript.sh

cd "$(dirname "$0")" || exit 1

# --- ディレクトリ: 通過 (x) だけ許す．一覧 (r) は不要 ---
chmod 711 . css js php

# --- ブラウザ・PHP が読む公開ファイル ---
chmod 644 ./*.html ./*.json ./*.css css/*.css js/*.js php/*.php
# 収集スクリプトが生成するファイル (無ければ飛ばす)．careerscript は既存の権限を引き継いで書き直すので一度直せば維持される
chmod 644 seat_output.txt weekly_login_time.txt 2>/dev/null

# --- 公開しないファイル ---
chmod 600 README.md .gitignore 2>/dev/null
chmod 600 seat_log.txt cronlog.txt whouse4_output.txt for_get_seat_data 2>/dev/null
chmod 700 python chmodScript.sh githooks 公開しないやつ 2>/dev/null
chmod 700 python/* githooks/* 2>/dev/null
chmod 600 公開しないやつ/* 2>/dev/null

exit 0
