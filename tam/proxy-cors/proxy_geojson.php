<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://data.montpellier3m.fr/TAM_MMM_GTFSRT/GTFS.zip';
$data = file_get_contents($url);
echo $data;
?>
