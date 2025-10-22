<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$urls = [
    'https://api.mrn.cityway.fr/dataflow/vehicle-tc-tr/download?provider=TCAR&dataFormat=gtfs-rt',
    'https://api.mrn.cityway.fr/dataflow/vehicule-tc-tr/download?provider=TNI&dataFormat=gtfs-rt',

];

$mergedData = [];

foreach ($urls as $url) {
    try {
        $data = @file_get_contents($url);
        
        if ($data === false) {
            error_log("Erreur lors de la récupération de : $url");
            continue;
        }
        
        $decoded = json_decode($data, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Erreur JSON pour $url : " . json_last_error_msg());
            continue;
        }
        
        if (isset($decoded['entity'])) {
            if (!isset($mergedData['entity'])) {
                $mergedData = $decoded;
            } else {
                $mergedData['entity'] = array_merge(
                    $mergedData['entity'],
                    $decoded['entity']
                );
            }
        } else {
            $mergedData = array_merge_recursive($mergedData, $decoded);
        }
        
    } catch (Exception $e) {
        error_log("Exception pour $url : " . $e->getMessage());
    }
}

if (isset($mergedData['header'])) {
    $mergedData['header']['timestamp'] = time();
}

echo json_encode($mergedData, JSON_PRETTY_PRINT);
?>
