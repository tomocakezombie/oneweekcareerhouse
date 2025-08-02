<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

date_default_timezone_set('Asia/Tokyo');

// ファイルから読み込み
$filename = '../seat_output.txt';
$lines = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$now = new DateTime();  // 現在時刻
$users = [];

$pc_dictionary = [];
foreach ($lines as $line) {
    $parts = explode(',', $line);

    // サーバ更新時刻行
    if (count($parts) == 1) {
        $first_parts = explode(":", $line, 2);
        if (count($first_parts) == 2) {
            $update_time_str = trim($first_parts[1]);
            $update_time = DateTime::createFromFormat('Y-m-d H:i:s.u', $update_time_str);
    
            if ($update_time) {
                $diff_seconds = abs($now->getTimestamp() - $update_time->getTimestamp());
                $users[] = '{"diff_seconds": '.strval($diff_seconds).'}';
                
                $is_new_time = $diff_seconds < 10;
    
                $users[] = '{"is_new_time": ' . ($is_new_time ? 'true' : 'false') . '}';
                $users[] = '{"update_time": "' . $update_time->format('Y-m-d\TH:i:s.uP') . '"}';
                $users[] = '{"now_time": "' . $now->format('Y-m-d\TH:i:s.uP') . '"}';
            }
        }
    }
    
    // 通常のユーザー行
    if (count($parts) >= 5) {

        $pc_name = $parts[1];
        $endtime_or_logged = $parts[4];
        
        $pc_dictionary[$pc_name] = true;

        if ($endtime_or_logged === "logged") {
            $users[] = '{"' . $pc_name . '": true}';
        } else {
            $end_time = DateTime::createFromFormat(DateTime::ATOM, $endtime_or_logged);
            if ($end_time && $now < $end_time) {
                $users[] = '{"' . $pc_name . '": true}';
            }
        }
    }
}

// true以外の端末はfalseの値に設定
foreach ($pc_dictionary as $pc_name => $value) {
    if (!in_array('{"' . $pc_name . '": true}', $users)) {
        $users[] = '{"' . $pc_name . '": false}';
    }
}


echo "[" . implode(",", $users) . "]";
?>
