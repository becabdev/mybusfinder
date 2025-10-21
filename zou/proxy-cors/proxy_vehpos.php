<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://mybusfinder.fr/zou-vehpos/vehicle_positions.pb';
$data = file_get_contents($url);
echo $data;
?>
