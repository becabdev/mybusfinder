<?php
@ini_set('memory_limit', '1024M');
set_time_limit(300);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: X-Content-Only-Header");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$url = 'https://www.data.gouv.fr/fr/datasets/r/47bc8088-6c72-43ad-a959-a5bbdd1aa14f';
$cacheDir = __DIR__ . '/cache';
$extractDir = $cacheDir . '/extracted';
$coreCacheFile = $cacheDir . '/gtfs_core.json';
$tripIndexFile = $cacheDir . '/trip_index.json';
$zipCacheFile = $cacheDir . '/gtfs.zip';
$cacheMarkerFile = $cacheDir . '/cache_created.txt';
$cacheTTL = 4 * 24 * 60 * 60; // 4 jours

// Nouveau: fichier JSON contenant tous les fichiers extraits
$extractedJsonFile = $cacheDir . '/gtfs_extracted.json';

$debug = isset($_GET['debug']);

if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

// Verification expiration cache global (4 jours)
function checkAndCleanExpiredCache($cacheDir, $cacheMarkerFile, $cacheTTL) {
    if (!file_exists($cacheMarkerFile)) {
        file_put_contents($cacheMarkerFile, time());
        return;
    }
    
    $cacheCreationTime = (int)file_get_contents($cacheMarkerFile);
    $cacheAge = time() - $cacheCreationTime;
    
    if ($cacheAge > $cacheTTL) {
        // Cache expire: nettoyage complet
        $files = glob($cacheDir . '/*.json');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        
        $extractDir = $cacheDir . '/extracted';
        if (is_dir($extractDir)) {
            $extractedFiles = glob($extractDir . '/*.txt');
            foreach ($extractedFiles as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
        
        file_put_contents($cacheMarkerFile, time());
    }
}

checkAndCleanExpiredCache($cacheDir, $cacheMarkerFile, $cacheTTL);

// Fonctions helper
function parseCSVFileSmall($filepath) {
    if (!file_exists($filepath)) return [];
    
    $result = [];
    $fh = fopen($filepath, 'r');
    if (!$fh) return [];
    
    $headers = fgetcsv($fh);
    if (!$headers) {
        fclose($fh);
        return [];
    }
    
    while (($row = fgetcsv($fh)) !== false) {
        $item = [];
        foreach ($headers as $i => $header) {
            $item[trim($header)] = isset($row[$i]) ? trim($row[$i]) : '';
        }
        $result[] = $item;
    }
    fclose($fh);
    
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

function formatTimeCompact($time) {
    if (empty($time)) return '0:00';
    $parts = explode(':', $time);
    if (count($parts) < 2) return '0:00';
    $hour = (int)$parts[0];
    $minute = $parts[1] ?? '00';
    if ($hour >= 24) $hour -= 24;
    return "{$hour}:{$minute}";
}

function buildTripIndex($extractDir, $tripIndexFile) {
    $tripsFile = $extractDir . '/trips.txt';
    if (!file_exists($tripsFile)) throw new Exception('trips.txt non extrait');
    
    $tripToRoute = [];
    $fh = fopen($tripsFile, 'r');
    $headers = fgetcsv($fh);
    $tripIdIdx = array_search('trip_id', $headers);
    $routeIdIdx = array_search('route_id', $headers);
    
    while (($row = fgetcsv($fh)) !== false) {
        $tripId = $row[$tripIdIdx] ?? '';
        $routeId = $row[$routeIdIdx] ?? '';
        if ($tripId && $routeId) {
            $tripToRoute[$tripId] = $routeId;
        }
    }
    fclose($fh);
    
    file_put_contents($tripIndexFile, json_encode($tripToRoute));
    return $tripToRoute;
}

// NOUVELLE FONCTION: Extraction et création du JSON avec tous les fichiers
function createExtractedJson($zipCacheFile, $extractedJsonFile, $extractDir) {
    $zip = new ZipArchive();
    if ($zip->open($zipCacheFile) !== TRUE) {
        throw new Exception('Impossible ouvrir ZIP');
    }
    
    // Extraction des fichiers
    $filesToExtract = ['routes.txt', 'stops.txt', 'calendar.txt', 'calendar_dates.txt', 'trips.txt', 'stop_times.txt'];
    foreach ($filesToExtract as $file) {
        if ($zip->locateName($file) !== false) {
            $zip->extractTo($extractDir, $file);
        }
    }
    $zip->close();
    
    // Lecture des fichiers et création du JSON
    $extractedData = [];
    foreach ($filesToExtract as $file) {
        $filepath = $extractDir . '/' . $file;
        if (file_exists($filepath)) {
            $extractedData[$file] = file_get_contents($filepath);
        }
    }
    
    // Sauvegarde dans un seul fichier JSON
    file_put_contents($extractedJsonFile, json_encode($extractedData));
    
    return $extractedData;
}

// Endpoint JSON
if (isset($_GET['action'])) {
    header("Content-Type: application/json");
    $action = $_GET['action'];
    
    try {
        $coreValid = file_exists($coreCacheFile) && file_exists($cacheMarkerFile);
        
        if ($debug) $coreValid = false;
        
        if (!$coreValid) {
            $debugInfo = ['steps' => []];
            
            // Telechargement ZIP si nécessaire
            if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                $debugInfo['steps'][] = 'Telechargement ZIP...';
                $zipData = @file_get_contents($url);
                if ($zipData === false) throw new Exception('Impossible telecharger ZIP');
                file_put_contents($zipCacheFile, $zipData);
                unset($zipData);
            }
            
            // Extraction et création du JSON si nécessaire
            if (!file_exists($extractedJsonFile) || (time() - filemtime($extractedJsonFile) > $cacheTTL)) {
                $debugInfo['steps'][] = 'Extraction ZIP et creation JSON...';
                createExtractedJson($zipCacheFile, $extractedJsonFile, $extractDir);
            }
            
            // Parse fichiers legers
            $debugInfo['steps'][] = 'Parse routes/stops/calendar...';
            $routes = parseCSVFileSmall($extractDir . '/routes.txt');
            $stops = parseCSVFileSmall($extractDir . '/stops.txt');
            $calendar = file_exists($extractDir . '/calendar.txt') ? parseCSVFileSmall($extractDir . '/calendar.txt') : [];
            $calendarDates = file_exists($extractDir . '/calendar_dates.txt') ? parseCSVFileSmall($extractDir . '/calendar_dates.txt') : [];
            
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
            
            $debugInfo['steps'][] = 'Construction index trip->route...';
            buildTripIndex($extractDir, $tripIndexFile);
            
            // Cache core
            $coreData = [
                'routes' => $routesById,
                'stops' => $stopsById,
                'calendar' => $calendarById,
                'calendarDates' => $calendarDatesByDate,
                'generated' => time()
            ];
            
            if ($debug) {
                $debugInfo['routes_count'] = count($routesById);
                $debugInfo['stops_count'] = count($stopsById);
                $coreData['_debug'] = $debugInfo;
            }
            
            file_put_contents($coreCacheFile, json_encode($coreData));
        } else {
            $coreData = json_decode(file_get_contents($coreCacheFile), true);
        }
        
        // Reponse selon action
        switch ($action) {
            case 'core':
                $response = [
                    'routes' => $coreData['routes'] ?? [],
                    'stops' => $coreData['stops'] ?? [],
                    'calendar' => $coreData['calendar'] ?? [],
                    'calendarDates' => $coreData['calendarDates'] ?? []
                ];
                if ($debug && isset($coreData['_debug'])) {
                    $response['_debug'] = $coreData['_debug'];
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
                
                $routeCacheFile = $cacheDir . '/route_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $routeId) . '.json';
                
                if (file_exists($routeCacheFile)) {
                    echo file_get_contents($routeCacheFile);
                } else {
                    if (!file_exists($tripIndexFile)) {
                        buildTripIndex($extractDir, $tripIndexFile);
                    }
                    $tripToRoute = json_decode(file_get_contents($tripIndexFile), true);
                    
                    // PASS 1: Collecte trips pour cette route
                    $trips = [];
                    $tripIds = [];
                    
                    $tripsFile = $extractDir . '/trips.txt';
                    if (!file_exists($tripsFile)) throw new Exception('trips.txt non extrait');
                    
                    $fh = fopen($tripsFile, 'r');
                    $headers = fgetcsv($fh);
                    $tripIdIdx = array_search('trip_id', $headers);
                    $routeIdIdx = array_search('route_id', $headers);
                    $serviceIdIdx = array_search('service_id', $headers);
                    
                    while (($row = fgetcsv($fh)) !== false) {
                        if (($row[$routeIdIdx] ?? '') === $routeId) {
                            $tripId = $row[$tripIdIdx] ?? '';
                            $trips[] = [
                                'trip_id' => $tripId,
                                'route_id' => $routeId,
                                'service_id' => $row[$serviceIdIdx] ?? ''
                            ];
                            $tripIds[$tripId] = true;
                        }
                    }
                    fclose($fh);
                    
                    if (empty($trips)) {
                        $empty = json_encode(['trips' => [], 'stopTimes' => []]);
                        file_put_contents($routeCacheFile, $empty);
                        echo $empty;
                        break;
                    }
                    
                    // PASS 2: Stop times
                    $stopTimesFile = $extractDir . '/stop_times.txt';
                    if (!file_exists($stopTimesFile)) throw new Exception('stop_times.txt non extrait');
                    
                    $fh = fopen($stopTimesFile, 'r');
                    $headers = fgetcsv($fh);
                    $tripIdIdx = array_search('trip_id', $headers);
                    $stopIdIdx = array_search('stop_id', $headers);
                    $arrivalIdx = array_search('arrival_time', $headers);
                    $sequenceIdx = array_search('stop_sequence', $headers);
                    
                    $stopTimesByTrip = [];
                    $lineCount = 0;
                    $matchCount = 0;
                    $maxStopTimesPerTrip = 150;
                    
                    while (($row = fgetcsv($fh)) !== false) {
                        $tripId = $row[$tripIdIdx] ?? '';
                        
                        if (!isset($tripIds[$tripId])) continue;
                        
                        if (!isset($stopTimesByTrip[$tripId])) {
                            $stopTimesByTrip[$tripId] = [];
                        }
                        
                        if (count($stopTimesByTrip[$tripId]) >= $maxStopTimesPerTrip) {
                            continue;
                        }
                        
                        $stopTimesByTrip[$tripId][] = [
                            's' => $row[$stopIdIdx] ?? '',
                            'a' => formatTimeCompact($row[$arrivalIdx] ?? ''),
                            'q' => (int)($row[$sequenceIdx] ?? 0)
                        ];
                        
                        $matchCount++;
                        $lineCount++;
                        
                        if ($lineCount % 10000 === 0) {
                            gc_collect_cycles();
                        }
                        
                        if ($matchCount > count($tripIds) * 50) {
                            break;
                        }
                    }
                    fclose($fh);
                    
                    // Tri et conversion
                    $stopTimesStandard = [];
                    foreach ($stopTimesByTrip as $tid => $times) {
                        usort($times, function($a, $b) {
                            return $a['q'] - $b['q'];
                        });
                        
                        $standardTimes = [];
                        foreach ($times as $t) {
                            $standardTimes[] = [
                                'stop_id' => $t['s'],
                                'arrival_time' => $t['a'],
                                'departure_time' => $t['a'],
                                'stop_sequence' => $t['q']
                            ];
                        }
                        $stopTimesStandard[$tid] = $standardTimes;
                    }
                    unset($stopTimesByTrip);
                    
                    $routeData = [
                        'trips' => $trips,
                        'stopTimes' => $stopTimesStandard
                    ];
                    
                    $json = json_encode($routeData);
                    if ($json === false) {
                        throw new Exception('Erreur encodage JSON: ' . json_last_error_msg());
                    }
                    
                    file_put_contents($routeCacheFile, $json);
                    echo $json;
                }
                break;
                
            // NOUVEAU: Endpoint pour récupérer le JSON avec tous les fichiers extraits
            case 'extracted':
                // Vérifier si le JSON existe et est à jour
                if (!file_exists($extractedJsonFile) || (time() - filemtime($extractedJsonFile) > $cacheTTL)) {
                    // Télécharger le ZIP si nécessaire
                    if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                        $zipData = @file_get_contents($url);
                        if ($zipData === false) throw new Exception('Impossible telecharger ZIP');
                        file_put_contents($zipCacheFile, $zipData);
                        unset($zipData);
                    }
                    
                    // Créer le JSON avec les fichiers extraits
                    createExtractedJson($zipCacheFile, $extractedJsonFile, $extractDir);
                }
                
                // Renvoyer le JSON
                echo file_get_contents($extractedJsonFile);
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

// Fallback ZIP (pour compatibilité avec l'ancien code)
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
?>
