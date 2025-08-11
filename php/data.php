<?php
error_reporting(E_ALL);// 全てのエラーを表示
ini_set('display_errors', 1);// エラーを表示する
header("Content-Type: application/json");// レスポンスのContent-TypeをJSONに設定

date_default_timezone_set('Asia/Tokyo');// タイムゾーンを日本時間に設定

// ファイルから読み込み
$filename = '../seat_output.txt';
$lines = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$now = new DateTime();  // 現在時刻
$users = [];// ユーザー情報を格納する配列

$pc_dictionary = [];// PC名をキーにして、true/falseの値を格納する連想配列
foreach ($lines as $line) {
    $parts = explode(',', $line);// 行をカンマで分割

    // サーバ更新時刻行
    if (count($parts) == 1) {// 行が1つの要素のみの場合
        $first_parts = explode(":", $line, 2);// 最初の部分をコロンで分割
        if (count($first_parts) == 2) {// コロンで分割した結果が2つの要素を持つ場合
            $update_time_str = trim($first_parts[1]);// 更新時刻の文字列を取得
            $update_time = DateTime::createFromFormat('Y-m-d H:i:s.u', $update_time_str);// 更新時刻をDateTimeオブジェクトに変換
    
            if ($update_time) {// 更新時刻が正しくパスできた場合
                $diff_seconds = abs($now->getTimestamp() - $update_time->getTimestamp());// 現在時刻と更新時刻の差を秒単位で計算
                $users[] = '{"diff_seconds": '.strval($diff_seconds).'}';// 差をJSON形式で追加
                
                $is_new_time = $diff_seconds < 10;// 10秒以内なら新しいデータと判断
    
                $users[] = '{"is_new_time": ' . ($is_new_time ? 'true' : 'false') . '}';// 新しいデータかどうかをJSON形式で追加
                $users[] = '{"update_time": "' . $update_time->format('Y-m-d\TH:i:s.uP') . '"}';// 更新時刻をJSON形式で追加
                $users[] = '{"now_time": "' . $now->format('Y-m-d\TH:i:s.uP') . '"}';// 現在時刻をJSON形式で追加
            }
        }
    }
    
    // 通常のユーザー行
    if (count($parts) >= 5) {// 行が5つ以上の要素を持つ場合
        // 端末名、ユーザー名、IPアドレス、ログイン時刻、終了時刻またはログイン状態を取得
        $pc_name = $parts[1];// 端末名
        $endtime_or_logged = $parts[4];// 終了時刻またはログイン状態

        $pc_dictionary[$pc_name] = true;// 端末名をキーにして、trueの値を設定

        if ($endtime_or_logged === "logged") {// ログイン状態が"logged"の場合
            $users[] = '{"' . $pc_name . '": true}';// 端末名をキーにして、trueの値を設定
        } else {
            $end_time = DateTime::createFromFormat(DateTime::ATOM, $endtime_or_logged);// 終了時刻をDateTimeオブジェクトに変換
            if ($end_time && $now < $end_time) {// 終了時刻が正しくパスでき、現在時刻が終了時刻より前の場合
                $users[] = '{"' . $pc_name . '": true}';// 端末名をキーにして、trueの値を設定
            }
        }
    }
}

// true以外の端末はfalseの値に設定
foreach ($pc_dictionary as $pc_name => $value) {
    if (!in_array('{"' . $pc_name . '": true}', $users)) {// 端末名がまだ追加されていない場合
        $users[] = '{"' . $pc_name . '": false}';// 端末名をキーにして、falseの値を設定
    }
}


echo "[" . implode(",", $users) . "]";// JSON形式で出力
?>
