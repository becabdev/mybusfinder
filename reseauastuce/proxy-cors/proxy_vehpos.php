<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://gtfs.bus-tracker.fr/gtfs-rt/tcar/vehicle-positions';
$data = file_get_contents($url);
echo $data;
?>




