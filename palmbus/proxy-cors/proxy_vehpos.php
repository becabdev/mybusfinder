<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://www.data.gouv.fr/api/1/datasets/r/f209bfe9-6be2-499c-96b9-eff0c6c7e7ec';
$data = file_get_contents($url);
echo $data;
?>


// fallback https://www.data.gouv.fr/api/1/datasets/r/f209bfe9-6be2-499c-96b9-eff0c6c7e7ec
// on restore https://proxy.transport.data.gouv.fr/resource/palmbus-cannes-gtfs-rt-vehicle-position
