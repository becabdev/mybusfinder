<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$url = 'https://eur.mecatran.com/utw/ws/gtfsfeed/static/perpignan?apiKey=612f606b5e3b0a3e6e1f441a2c4a050f6a345b55';
$data = file_get_contents($url);
echo $data;
?>
