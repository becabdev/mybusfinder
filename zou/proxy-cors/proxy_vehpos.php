<?php


$url = 'https://mybusfinder.fr/zou-vehpos/vehicle_positions.pb';
$data = file_get_contents($url);
echo $data;
?>
