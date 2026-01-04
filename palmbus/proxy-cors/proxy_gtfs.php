<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: X-Content-Only-Header");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$url = 'https://www.data.gouv.fr/fr/datasets/r/47bc8088-6c72-43ad-a959-a5bbdd1aa14f';
$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/gtfs_data.json';
$zipCacheFile = $cacheDir . '/gtfs.zip';
$cacheTTL = 24 * 60 * 60; // 24h cache

// Creation dossier cache si inexistant
if (!is_dir($cacheDir)) {
    if (!mkdir($cacheDir, 0755, true)) {
        header("Content-Type: application/json");
        http_response_code(500);
        echo json_encode(['error' => 'Impossible créer dossier cache', 'path' => $cacheDir]);
        exit;
    }
}

// Endpoint pour donnees pre-processees JSON
if (isset($_GET['action'])) {
    header("Content-Type: application/json");
    $action = $_GET['action'];
    
    try {
        // Verif cache JSON existant et valide
        $cacheValid = file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTTL);
        
        if (!$cacheValid) {
            // Telechargement ZIP si necessaire
            if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                $zipData = @file_get_contents($url);
                if ($zipData === false) {
                    throw new Exception('Impossible telecharger ZIP depuis ' . $url);
                }
                if (@file_put_contents($zipCacheFile, $zipData) === false) {
                    throw new Exception('Impossible ecrire fichier ZIP');
                }
            }
            
            // Extraction et parsing ZIP
            if (!class_exists('ZipArchive')) {
                throw new Exception('Extension ZipArchive non disponible sur serveur');
            }
            
            $zip = new ZipArchive();
            $openResult = $zip->open($zipCacheFile);
            if ($openResult !== TRUE) {
                throw new Exception('Impossible ouvrir ZIP (code: ' . $openResult . ')');
            }
            
            // Parse fichiers GTFS essentiels
            $routes = parseCSV($zip->getFromName('routes.txt'));
            $stops = parseCSV($zip->getFromName('stops.txt'));
            $calendar = parseCSV($zip->getFromName('calendar.txt'));
            $calendarDates = parseCSV($zip->getFromName('calendar_dates.txt'));
            $trips = parseCSV($zip->getFromName('trips.txt'));
            $stopTimes = parseCSV($zip->getFromName('stop_times.txt'));
            
            $zip->close();
            
            // Construction index optimise
            $routesById = arrayToObject($routes, 'route_id');
            $stopsById = arrayToObject($stops, 'stop_id');
            $calendarById = arrayToObject($calendar, 'service_id');
            
            // Index calendar_dates par date
            $calendarDatesByDate = [];
            foreach ($calendarDates as $cd) {
                $date = $cd['date'];
                if (!isset($calendarDatesByDate[$date])) {
                    $calendarDatesByDate[$date] = ['added' => [], 'removed' => []];
                }
                if ($cd['exception_type'] === '1') {
                    $calendarDatesByDate[$date]['added'][] = $cd['service_id'];
                } else {
                    $calendarDatesByDate[$date]['removed'][] = $cd['service_id'];
                }
            }
            
            // Index trips par route_id
            $tripsByRoute = [];
            foreach ($trips as $trip) {
                $routeId = $trip['route_id'];
                if (!isset($tripsByRoute[$routeId])) {
                    $tripsByRoute[$routeId] = [];
                }
                $tripsByRoute[$routeId][] = $trip;
            }
            
            // Index stop_times par trip_id
            $stopTimesByTrip = [];
            foreach ($stopTimes as $st) {
                $tripId = $st['trip_id'];
                if (!isset($stopTimesByTrip[$tripId])) {
                    $stopTimesByTrip[$tripId] = [];
                }
                $stopTimesByTrip[$tripId][] = [
                    'stop_id' => $st['stop_id'],
                    'arrival_time' => formatTime($st['arrival_time']),
                    'departure_time' => formatTime($st['departure_time'] ?? $st['arrival_time']),
                    'stop_sequence' => (int)$st['stop_sequence']
                ];
            }
            
            // Tri stop_times par sequence
            foreach ($stopTimesByTrip as &$times) {
                usort($times, fn($a, $b) => $a['stop_sequence'] - $b['stop_sequence']);
            }
            
            // Sauvegarde cache JSON
            $cacheData = [
                'routes' => $routesById,
                'stops' => $stopsById,
                'calendar' => $calendarById,
                'calendarDates' => $calendarDatesByDate,
                'tripsByRoute' => $tripsByRoute,
                'stopTimesByTrip' => $stopTimesByTrip,
                'generated' => time()
            ];
            
            if (@file_put_contents($cacheFile, json_encode($cacheData)) === false) {
                throw new Exception('Impossible ecrire cache JSON');
            }
        } else {
            $jsonContent = @file_get_contents($cacheFile);
            if ($jsonContent === false) {
                throw new Exception('Impossible lire cache JSON');
            }
            $cacheData = json_decode($jsonContent, true);
            if ($cacheData === null) {
                throw new Exception('Cache JSON corrompu');
            }
        }
        
        // Reponse selon action demandee
        switch ($action) {
            case 'core':
                // Donnees initiales legeres
                echo json_encode([
                    'routes' => $cacheData['routes'],
                    'stops' => $cacheData['stops'],
                    'calendar' => $cacheData['calendar'],
                    'calendarDates' => $cacheData['calendarDates']
                ]);
                break;
                
            case 'route':
                // Donnees pour ligne specifique
                $routeId = $_GET['route_id'] ?? null;
                if (!$routeId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'route_id manquant']);
                    exit;
                }
                
                $trips = $cacheData['tripsByRoute'][$routeId] ?? [];
                $stopTimes = [];
                
                foreach ($trips as $trip) {
                    $tripId = $trip['trip_id'];
                    if (isset($cacheData['stopTimesByTrip'][$tripId])) {
                        $stopTimes[$tripId] = $cacheData['stopTimesByTrip'][$tripId];
                    }
                }
                
                echo json_encode([
                    'trips' => $trips,
                    'stopTimes' => $stopTimes
                ]);
                break;
                
            case 'all':
                // Toutes donnees (backup)
                echo json_encode($cacheData);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action invalide']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
    
    exit;
}

// Fallback: proxy ZIP original pour compatibilite
if (isset($_SERVER['HTTP_X_CONTENT_ONLY_HEADER'])) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Range: bytes=0-51200'
        ]
    ]);
    $data = file_get_contents($url, false, $context);
} else {
    $data = file_get_contents($url);
}

header("Content-Type: application/zip");
echo $data;

// Fonctions helper
function parseCSV($content) {
    if (!$content) return [];
    
    $lines = explode("\n", trim($content));
    if (empty($lines)) return [];
    
    $headers = str_getcsv(array_shift($lines));
    $result = [];
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;
        
        $values = str_getcsv($line);
        $row = [];
        foreach ($headers as $i => $header) {
            $row[$header] = $values[$i] ?? '';
        }
        $result[] = $row;
    }
    
    return $result;
}

function arrayToObject($array, $keyField) {
    $result = [];
    foreach ($array as $item) {
        if (isset($item[$keyField])) {
            $result[$item[$keyField]] = $item;
        }
    }
    return $result;
}

function formatTime($time) {
    if (empty($time)) return '00h00';
    $parts = explode(':', $time);
    $hour = (int)$parts[0];
    $minute = $parts[1] ?? '00';
    if ($hour >= 24) $hour -= 24;
    return "{$hour}h{$minute}";
}
?>
