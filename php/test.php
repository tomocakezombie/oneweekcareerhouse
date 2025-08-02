<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

header("Content-Type: text/plain");

echo "Test start\n";

// execできるか試す
$output = [];
$return_var = 0;
exec('whoami', $output, $return_var);

echo "Return code: $return_var\n";
echo "Output:\n";
print_r($output);
?>
