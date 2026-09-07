<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

// SSH接続情報
$host = "zw03.kki.yamanashi.ac.jp";  // SSHサーバーのアドレス
$port = 22;
$user = "t23cs014";

// 鍵ファイルのパス（適宜変更）
$publicKey = "/home/assist/.ssh/ty_assist.pub";   // 公開鍵（通常不要）
$privateKey = "/home/assist/.ssh/ty_assist";      // 秘密鍵
$passphrase = "";  // パスフレーズ（設定している場合）

// SSH接続の作成
$connection = ssh2_connect($host, $port);

if (!$connection) {
    echo json_encode(["error" => "SSH接続に失敗しました"]);
    exit();
}

// 鍵認証
if (!ssh2_auth_pubkey_file($connection, $user, $publicKey, $privateKey, $passphrase)) {
    echo json_encode(["error" => "SSH認証に失敗しました"]);
    exit();
}

// 実行するコマンド
# $command = "test_whouse4";
$command = "whouse4";
$stream = ssh2_exec($connection, $command);

if (!$stream) {
    echo json_encode(["error" => "コマンド実行に失敗しました"]);
    exit();
}

// ストリーム処理
stream_set_blocking($stream, true);
$output = stream_get_contents($stream);
fclose($stream);

// コマンド出力を配列化
$lines = explode("\n", trim($output));
$users = [];


foreach ($lines as $line) {
    $parts = preg_split('/\s+/', $line);
    if (count($parts) >= 3) {
        $users[] = [
            $parts[1] => true // zw03 = true
        ];
    }
}


// JSON出力
// echo json_encode(["data" => $users], JSON_PRETTY_PRINT);
echo json_encode($users, JSON_PRETTY_PRINT);