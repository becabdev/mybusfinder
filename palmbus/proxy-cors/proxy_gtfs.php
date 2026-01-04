<?php
// Augmente limite memoire si possible
@ini_set('memory_limit', '512M');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: X-Content-Only-Header");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$url = 'https://www.data.gouv.fr/fr/datasets/r/47bc8088-6c72-43ad-a959-a5bbdd1aa14f';
$cacheDir = __DIR__ . '/cache';
$extractDir = $cacheDir . '/extracted';
$cacheFile = $cacheDir . '/gtfs_data.json';
$zipCacheFile = $cacheDir . '/gtfs.zip';
$cacheTTL = 24 * 60 * 60; // 24h

$debug = isset($_GET['debug']);

// Creation dossiers cache
if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

// Endpoint JSON
if (isset($_GET['action'])) {
    header("Content-Type: application/json");
    $action = $_GET['action'];
    
    try {
        $cacheValid = file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTTL);
        
        if ($debug) $cacheValid = false;
        
        if (!$cacheValid) {
            $debugInfo = ['steps' => []];
            
            // Telechargement ZIP
            if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                $debugInfo['steps'][] = 'Telechargement ZIP...';
                $zipData = @file_get_contents($url);
                if ($zipData === false) throw new Exception('Impossible telecharger ZIP');
                file_put_contents($zipCacheFile, $zipData);
                $debugInfo['zip_size'] = strlen($zipData);
                unset($zipData); // Libere memoire
            }
            
            // Extraction ZIP vers fichiers temporaires
            $debugInfo['steps'][] = 'Extraction ZIP...';
            $zip = new ZipArchive();
            if ($zip->open($zipCacheFile) !== TRUE) throw new Exception('Impossible ouvrir ZIP');
            
            $filesToExtract = ['routes.txt', 'stops.txt', 'calendar.txt', 'calendar_dates.txt', 'trips.txt', 'stop_times.txt'];
            foreach ($filesToExtract as $file) {
                $zip->extractTo($extractDir, $file);
            }
            $zip->close();
            
            // Parse fichiers legers
            $debugInfo['steps'][] = 'Parse routes/stops/calendar...';
            $routes = parseCSVFile($extractDir . '/routes.txt');
            $stops = parseCSVFile($extractDir . '/stops.txt');
            $calendar = file_exists($extractDir . '/calendar.txt') ? parseCSVFile($extractDir . '/calendar.txt') : [];
            $calendarDates = file_exists($extractDir . '/calendar_dates.txt') ? parseCSVFile($extractDir . '/calendar_dates.txt') : [];
            
            $routesById = arrayToObject($routes, 'route_id');
            $stopsById = arrayToObject($stops, 'stop_id');
            $calendarById = arrayToObject($calendar, 'service_id');
            
            // Index calendar_dates
            $calendarDatesByDate = [];
            foreach ($calendarDates as $cd) {
                $date = $cd['date'] ?? '';
                if (empty($date)) continue;
                if (!isset($calendarDatesByDate[$date])) {
                    $calendarDatesByDate[$date] = ['added' => [], 'removed' => []];
                }
                if (($cd['exception_type'] ?? '') === '1') {
                    $calendarDatesByDate[$date]['added'][] = $cd['service_id'] ?? '';
                } else {
                    $calendarDatesByDate[$date]['removed'][] = $cd['service_id'] ?? '';
                }
            }
            
            $debugInfo['routes_count'] = count($routesById);
            $debugInfo['stops_count'] = count($stopsById);
            
            // Parse trips par chunks
            $debugInfo['steps'][] = 'Parse trips par chunks...';
            $tripsByRoute = [];
            $tripsFile = $extractDir . '/trips.txt';
            $handle = fopen($tripsFile, 'r');
            $headers = fgetcsv($handle);
            $tripIdIndex = array_search('trip_id', $headers);
            $routeIdIndex = array_search('route_id', $headers);
            $serviceIdIndex = array_search('service_id', $headers);
            
            while (($row = fgetcsv($handle)) !== false) {
                $routeId = $row[$routeIdIndex] ?? '';
                if (empty($routeId)) continue;
                
                if (!isset($tripsByRoute[$routeId])) {
                    $tripsByRoute[$routeId] = [];
                }
                
                $trip = [
                    'trip_id' => $row[$tripIdIndex] ?? '',
                    'route_id' => $routeId,
                    'service_id' => $row[$serviceIdIndex] ?? ''
                ];
                $tripsByRoute[$routeId][] = $trip;
            }
            fclose($handle);
            
            $debugInfo['trips_by_route_count'] = count($tripsByRoute);
            
            // Parse stop_times par chunks - TRES GROS FICHIER
            $debugInfo['steps'][] = 'Parse stop_times par chunks (peut prendre 30-60s)...';
            $stopTimesByTrip = [];
            $stopTimesFile = $extractDir . '/stop_times.txt';
            $handle = fopen($stopTimesFile, 'r');
            $headers = fgetcsv($handle);
            
            $tripIdIdx = array_search('trip_id', $headers);
            $stopIdIdx = array_search('stop_id', $headers);
            $arrivalIdx = array_search('arrival_time', $headers);
            $departureIdx = array_search('departure_time', $headers);
            $sequenceIdx = array_search('stop_sequence', $headers);
            
            $lineCount = 0;
            while (($row = fgetcsv($handle)) !== false) {
                $tripId = $row[$tripIdIdx] ?? '';
                if (empty($tripId)) continue;
                
                if (!isset($stopTimesByTrip[$tripId])) {
                    $stopTimesByTrip[$tripId] = [];
                }
                
                $stopTimesByTrip[$tripId][] = [
                    'stop_id' => $row[$stopIdIdx] ?? '',
                    'arrival_time' => formatTime($row[$arrivalIdx] ?? ''),
                    'departure_time' => formatTime($row[$departureIdx] ?? $row[$arrivalIdx] ?? ''),
                    'stop_sequence' => (int)($row[$sequenceIdx] ?? 0)
                ];
                
                $lineCount++;
                // Libere memoire tous les 50k lignes
                if ($lineCount % 50000 === 0) {
                    gc_collect_cycles();
                }
            }
            fclose($handle);
            
            $debugInfo['stop_times_parsed'] = $lineCount;
            
            // Tri stop_times
            $debugInfo['steps'][] = 'Tri stop_times...';
            foreach ($stopTimesByTrip as &$times) {
                usort($times, function($a, $b) {
                    return $a['stop_sequence'] - $b['stop_sequence'];
                });
            }
            unset($times);
            
            // Construction cache final
            $cacheData = [
                'routes' => $routesById,
                'stops' => $stopsById,
                'calendar' => $calendarById,
                'calendarDates' => $calendarDatesByDate,
                'tripsByRoute' => $tripsByRoute,
                'stopTimesByTrip' => $stopTimesByTrip,
                'generated' => time()
            ];
            
            if ($debug) $cacheData['_debug'] = $debugInfo;
            
            $debugInfo['steps'][] = 'Encodage JSON...';
            $jsonData = json_encode($cacheData);
            if ($jsonData === false) {
                throw new Exception('Erreur encodage JSON: ' . json_last_error_msg());
            }
            
            file_put_contents($cacheFile, $jsonData);
            $debugInfo['cache_size'] = strlen($jsonData);
            $debugInfo['steps'][] = 'Cache ecrit: ' . number_format(strlen($jsonData)) . ' bytes';
            
        } else {
            $cacheData = json_decode(file_get_contents($cacheFile), true);
        }
        
        // Reponse selon action
        switch ($action) {
            case 'core':
                $response = [
                    'routes' => $cacheData['routes'] ?? [],
                    'stops' => $cacheData['stops'] ?? [],
                    'calendar' => $cacheData['calendar'] ?? [],
                    'calendarDates' => $cacheData['calendarDates'] ?? []
                ];
                if ($debug && isset($cacheData['_debug'])) {
                    $response['_debug'] = $cacheData['_debug'];
                }
                echo json_encode($response);
                break;
                
            case 'route':
                $routeId = $_GET['route_id'] ?? null;
                if (!$routeId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'route_id manquant']);
                    exit;
                }
                
                $trips = $cacheData['tripsByRoute'][$routeId] ?? [];
                $stopTimes = [];
                
                foreach ($trips as $trip) {
                    $tripId = $trip['trip_id'] ?? '';
                    if ($tripId && isset($cacheData['stopTimesByTrip'][$tripId])) {
                        $stopTimes[$tripId] = $cacheData['stopTimesByTrip'][$tripId];
                    }
                }
                
                echo json_encode([
                    'trips' => $trips,
                    'stopTimes' => $stopTimes
                ]);
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

// Fallback ZIP
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
function parseCSVFile($filepath) {
    if (!file_exists($filepath)) return [];
    
    $result = [];
    $handle = fopen($filepath, 'r');
    $headers = fgetcsv($handle);
    
    while (($row = fgetcsv($handle)) !== false) {
        $item = [];
        foreach ($headers as $i => $header) {
            $item[trim($header)] = isset($row[$i]) ? trim($row[$i]) : '';
        }
        $result[] = $item;
    }
    fclose($handle);
    
    return $result;
}

function arrayToObject($array, $keyField) {
    $result = [];
    foreach ($array as $item) {
        $key = $item[$keyField] ?? null;
        if ($key !== null && $key !== '') {
            $result[$key] = $item;
        }
    }
    return $result;
}

function formatTime($time) {
    if (empty($time)) return '00h00';
    $parts = explode(':', $time);
    if (count($parts) < 2) return '00h00';
    $hour = (int)$parts[0];
    $minute = $parts[1] ?? '00';
    if ($hour >= 24) $hour -= 24;
    return "{$hour}h{$minute}";
}
?>
