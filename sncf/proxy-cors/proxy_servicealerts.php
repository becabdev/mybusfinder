<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-service-alerts?token=BBOTIEO7q6bWqPdMQPAFKyUgZ8IfuwDQTx8rQHyPHqY';
$data = file_get_contents($url);
echo $data;
?>
