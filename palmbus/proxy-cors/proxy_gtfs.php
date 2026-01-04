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

// Création dossier cache si inexistant
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Endpoint pour données pré-processées JSON
if (isset($_GET['action'])) {
    $action = $_GET['action'];
    
    // Vérif cache JSON existant et valide
    $cacheValid = file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTTL);
    
    if (!$cacheValid) {
        // Téléchargement ZIP si nécessaire
        if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
            $zipData = file_get_contents($url);
            file_put_contents($zipCacheFile, $zipData);
        }
        
        // Extraction et parsing ZIP
        $zip = new ZipArchive();
        if ($zip->open($zipCacheFile) !== TRUE) {
            http_response_code(500);
            echo json_encode(['error' => 'Impossible ouvrir ZIP']);
            exit;
        }
        
        // Parse fichiers GTFS essentiels
        $routes = parseCSV($zip->getFromName('routes.txt'));
        $stops = parseCSV($zip->getFromName('stops.txt'));
        $calendar = parseCSV($zip->getFromName('calendar.txt'));
        $calendarDates = parseCSV($zip->getFromName('calendar_dates.txt'));
        $trips = parseCSV($zip->getFromName('trips.txt'));
        $stopTimes = parseCSV($zip->getFromName('stop_times.txt'));
        
        $zip->close();
        
        // Construction index optimisé
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
        
        // Tri stop_times par séquence
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
        
        file_put_contents($cacheFile, json_encode($cacheData));
    } else {
        $cacheData = json_decode(file_get_contents($cacheFile), true);
    }
    
    // Réponse selon action demandée
    header("Content-Type: application/json");
    
    switch ($action) {
        case 'core':
            // Données initiales légères
            echo json_encode([
                'routes' => $cacheData['routes'],
                'stops' => $cacheData['stops'],
                'calendar' => $cacheData['calendar'],
                'calendarDates' => $cacheData['calendarDates']
            ]);
            break;
            
        case 'route':
            // Données pour ligne spécifique
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
            // Toutes données (backup)
            echo json_encode($cacheData);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action invalide']);
    }
    
    exit;
}

// Fallback: proxy ZIP original pour compatibilité
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
