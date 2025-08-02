<?php
$directory = './../../../../../edu/misc';// ディレクトリのパス
$files = scandir($directory);// ディレクトリ内のファイルを取得
sort($files);// 名前でソート

if ($files === false) {
    echo 'ディレクトリが読み取れませんでした';
    exit();
}

sort($files);

foreach ($files as $entry) {
    echo htmlspecialchars($entry) . "<br>";
}
/*
$classFiles = preg_grep('/class.*\.html/i', array_diff($files, preg_grep('/old/i', $files)));// class がついているファイルのみを抽出


if (!empty($classFiles)) {// もし class がついているファイルが1つ以上あれば
    sort($classFiles);// class がついているファイルを名前順にソート
    $lastClassFile = end($classFiles);// 最も下にある class がついているファイルを選択
    // $redirectTo = $directory . '/' . $lastClassFile;// リダイレクトセット
    echo $lastClassFile;
    exit();
} else {
    echo 'エラーが発生しました';
    sleep(1);
    // header("Location: ../../");// エラーが起きたら，トップに戻る
}
    */
    
?>