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

// Fichiers optimisés avec compression GZIP
$optimizedCoreFile = $cacheDir . '/gtfs_core_optimized.json.gz';
$optimizedRoutesFile = $cacheDir . '/gtfs_routes_optimized.json.gz';
$optimizedStopsFile = $cacheDir . '/gtfs_stops_optimized.json.gz';

$debug = isset($_GET['debug']);
$useCompression = isset($_GET['compressed']) || !isset($_GET['legacy']); // Par défaut: compression activée

if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

// Vérification expiration cache global
function checkAndCleanExpiredCache($cacheDir, $cacheMarkerFile, $cacheTTL) {
    if (!file_exists($cacheMarkerFile)) {
        file_put_contents($cacheMarkerFile, time());
        return;
    }
    
    $cacheCreationTime = (int)file_get_contents($cacheMarkerFile);
    $cacheAge = time() - $cacheCreationTime;
    
    if ($cacheAge > $cacheTTL) {
        $files = glob($cacheDir . '/*.{json,gz}', GLOB_BRACE);
        foreach ($files as $file) {
            if (is_file($file)) unlink($file);
        }
        
        $extractDir = $cacheDir . '/extracted';
        if (is_dir($extractDir)) {
            $extractedFiles = glob($extractDir . '/*.txt');
            foreach ($extractedFiles as $file) {
                if (is_file($file)) unlink($file);
            }
        }
        
        file_put_contents($cacheMarkerFile, time());
    }
}

checkAndCleanExpiredCache($cacheDir, $cacheMarkerFile, $cacheTTL);

// Parse CSV en streaming
function parseCSVStream($filepath, $callback, $maxRows = null) {
    if (!file_exists($filepath)) return 0;
    
    $fh = fopen($filepath, 'r');
    if (!$fh) return 0;
    
    $headers = fgetcsv($fh);
    if (!$headers) {
        fclose($fh);
        return 0;
    }
    
    $count = 0;
    while (($row = fgetcsv($fh)) !== false) {
        if ($maxRows && $count >= $maxRows) break;
        
        $item = [];
        foreach ($headers as $i => $header) {
            $item[trim($header)] = isset($row[$i]) ? trim($row[$i]) : '';
        }
        
        $callback($item);
        $count++;
        
        if ($count % 1000 === 0) {
            gc_collect_cycles();
        }
    }
    fclose($fh);
    
    return $count;
}

// Parse CSV complet (ancienne méthode)
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

// Créer fichier routes optimisé (format compact + GZIP)
function createOptimizedRoutes($extractDir, $outputFile) {
    $routes = [];
    
    parseCSVStream($extractDir . '/routes.txt', function($item) use (&$routes) {
        $routeId = $item['route_id'] ?? '';
        if ($routeId) {
            $routes[$routeId] = [
                's' => $item['route_short_name'] ?? '',
                'l' => $item['route_long_name'] ?? '',
                'c' => $item['route_color'] ?? 'FFFFFF',
                't' => $item['route_text_color'] ?? '000000'
            ];
        }
    });
    
    $json = json_encode($routes);
    $compressed = gzencode($json, 9);
    file_put_contents($outputFile, $compressed);
    
    unset($routes, $json);
    gc_collect_cycles();
    
    return true;
}

// Créer fichier stops optimisé (format compact + GZIP)
function createOptimizedStops($extractDir, $outputFile) {
    $stops = [];
    
    parseCSVStream($extractDir . '/stops.txt', function($item) use (&$stops) {
        $stopId = $item['stop_id'] ?? '';
        if ($stopId) {
            $stops[$stopId] = [
                'n' => $item['stop_name'] ?? '',
                'lat' => $item['stop_lat'] ?? '',
                'lon' => $item['stop_lon'] ?? ''
            ];
        }
    });
    
    $json = json_encode($stops);
    $compressed = gzencode($json, 9);
    file_put_contents($outputFile, $compressed);
    
    unset($stops, $json);
    gc_collect_cycles();
    
    return true;
}

// Créer fichier core optimisé (inclut routes + stops au format complet + GZIP)
function createOptimizedCore($extractDir, $routesFile, $stopsFile, $outputFile) {
    // Charger les routes compressées
    $routesCompressed = file_get_contents($routesFile);
    $routesJson = gzdecode($routesCompressed);
    $routes = json_decode($routesJson, true);
    
    // Charger les stops compressés
    $stopsCompressed = file_get_contents($stopsFile);
    $stopsJson = gzdecode($stopsCompressed);
    $stops = json_decode($stopsJson, true);
    
    // Convertir format compact en format complet pour compatibilité client
    $routesExpanded = [];
    foreach ($routes as $id => $r) {
        $routesExpanded[$id] = [
            'route_short_name' => $r['s'],
            'route_long_name' => $r['l'],
            'route_color' => $r['c'],
            'route_text_color' => $r['t']
        ];
    }
    
    $stopsExpanded = [];
    foreach ($stops as $id => $s) {
        $stopsExpanded[$id] = [
            'stop_name' => $s['n'],
            'stop_lat' => $s['lat'],
            'stop_lon' => $s['lon']
        ];
    }
    
    // Parse calendar et calendar_dates (format complet)
    $calendar = file_exists($extractDir . '/calendar.txt') ? parseCSVFileSmall($extractDir . '/calendar.txt') : [];
    $calendarDates = file_exists($extractDir . '/calendar_dates.txt') ? parseCSVFileSmall($extractDir . '/calendar_dates.txt') : [];
    
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
    
    $core = [
        'routes' => $routesExpanded,
        'stops' => $stopsExpanded,
        'calendar' => $calendarById,
        'calendarDates' => $calendarDatesByDate,
        'generated' => time()
    ];
    
    // Compression GZIP
    $json = json_encode($core);
    $compressed = gzencode($json, 9);
    file_put_contents($outputFile, $compressed);
    
    unset($routes, $stops, $routesExpanded, $stopsExpanded, $core, $json);
    gc_collect_cycles();
    
    return true;
}

// Construction index trip->route
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

// Extraction et optimisation avec les deux formats
function extractAndProcessGTFS($zipCacheFile, $extractDir, $coreCacheFile, $optimizedCoreFile, $optimizedRoutesFile, $optimizedStopsFile, $tripIndexFile) {
    $zip = new ZipArchive();
    if ($zip->open($zipCacheFile) !== TRUE) {
        throw new Exception('Impossible ouvrir ZIP');
    }
    
    // Extraction tous les fichiers nécessaires
    $filesToExtract = ['routes.txt', 'stops.txt', 'calendar.txt', 'calendar_dates.txt', 'trips.txt', 'stop_times.txt'];
    foreach ($filesToExtract as $file) {
        if ($zip->locateName($file) !== false) {
            $zip->extractTo($extractDir, $file);
        }
    }
    $zip->close();
    
    // Créer fichiers optimisés compressés
    createOptimizedRoutes($extractDir, $optimizedRoutesFile);
    createOptimizedStops($extractDir, $optimizedStopsFile);
    createOptimizedCore($extractDir, $optimizedRoutesFile, $optimizedStopsFile, $optimizedCoreFile);
    
    // Créer aussi fichier JSON classique pour compatibilité
    $compressed = file_get_contents($optimizedCoreFile);
    $coreData = json_decode(gzdecode($compressed), true);
    file_put_contents($coreCacheFile, json_encode($coreData));
    
    // Créer index trip->route
    buildTripIndex($extractDir, $tripIndexFile);
    
    return true;
}

// Endpoint JSON
if (isset($_GET['action'])) {
    header("Content-Type: application/json");
    $action = $_GET['action'];
    
    try {
        // Vérifier si cache existe et est valide
        $coreValid = file_exists($optimizedCoreFile) && file_exists($coreCacheFile) && file_exists($cacheMarkerFile);
        
        if ($debug) $coreValid = false;
        
        if (!$coreValid) {
            // Téléchargement ZIP si nécessaire
            if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                $zipData = @file_get_contents($url);
                if ($zipData === false) throw new Exception('Impossible telecharger ZIP');
                file_put_contents($zipCacheFile, $zipData);
                unset($zipData);
            }
            
            // Extraction et traitement
            extractAndProcessGTFS($zipCacheFile, $extractDir, $coreCacheFile, $optimizedCoreFile, $optimizedRoutesFile, $optimizedStopsFile, $tripIndexFile);
        }
        
        // Réponse selon action
        switch ($action) {
            case 'core':
                if ($useCompression) {
                    // Version compressée (nouveau client)
                    if (!file_exists($optimizedCoreFile)) {
                        throw new Exception("Fichier core compressé non trouvé");
                    }
                    
                    $compressed = file_get_contents($optimizedCoreFile);
                    $json = gzdecode($compressed);
                    
                    echo $json;
                } else {
                    // Version JSON classique (ancien client / legacy)
                    if (!file_exists($coreCacheFile)) {
                        throw new Exception("Fichier core non trouvé");
                    }
                    
                    echo file_get_contents($coreCacheFile);
                }
                break;
                
            case 'routes':
                if (!file_exists($optimizedRoutesFile)) {
                    throw new Exception("Fichier routes non trouvé");
                }
                
                // Décompresser et convertir en format complet
                $compressed = file_get_contents($optimizedRoutesFile);
                $routesJson = gzdecode($compressed);
                $routes = json_decode($routesJson, true);
                
                $routesExpanded = [];
                foreach ($routes as $id => $r) {
                    $routesExpanded[$id] = [
                        'route_short_name' => $r['s'],
                        'route_long_name' => $r['l'],
                        'route_color' => $r['c'],
                        'route_text_color' => $r['t']
                    ];
                }
                
                echo json_encode($routesExpanded);
                break;
                
            case 'stops':
                if (!file_exists($optimizedStopsFile)) {
                    throw new Exception("Fichier stops non trouvé");
                }
                
                // Décompresser et convertir en format complet
                $compressed = file_get_contents($optimizedStopsFile);
                $stopsJson = gzdecode($compressed);
                $stops = json_decode($stopsJson, true);
                
                $stopsExpanded = [];
                foreach ($stops as $id => $s) {
                    $stopsExpanded[$id] = [
                        'stop_name' => $s['n'],
                        'stop_lat' => $s['lat'],
                        'stop_lon' => $s['lon']
                    ];
                }
                
                echo json_encode($stopsExpanded);
                break;
                
            case 'route':
                $routeId = $_GET['route_id'] ?? null;
                if (!$routeId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'route_id manquant']);
                    exit;
                }
                
                $routeCacheFile = $cacheDir . '/route_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $routeId) . '.json';
                
                // Cache valide si existe
                if (file_exists($routeCacheFile)) {
                    echo file_get_contents($routeCacheFile);
                } else {
                    // Charger index trip->route
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
                    
                    // PASS 2: Stop times avec index optimisé
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
                    
                    // Tri et conversion au format standard
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
                
            case 'info':
                $info = [
                    'core_exists' => file_exists($coreCacheFile),
                    'core_optimized_exists' => file_exists($optimizedCoreFile),
                    'routes_optimized_exists' => file_exists($optimizedRoutesFile),
                    'stops_optimized_exists' => file_exists($optimizedStopsFile),
                    'trip_index_exists' => file_exists($tripIndexFile),
                    'core_size' => file_exists($coreCacheFile) ? filesize($coreCacheFile) : 0,
                    'core_optimized_size' => file_exists($optimizedCoreFile) ? filesize($optimizedCoreFile) : 0,
                    'routes_optimized_size' => file_exists($optimizedRoutesFile) ? filesize($optimizedRoutesFile) : 0,
                    'stops_optimized_size' => file_exists($optimizedStopsFile) ? filesize($optimizedStopsFile) : 0,
                    'cache_age_hours' => 0
                ];
                
                if (file_exists($cacheMarkerFile)) {
                    $cacheTime = (int)file_get_contents($cacheMarkerFile);
                    $info['cache_age_hours'] = round((time() - $cacheTime) / 3600, 1);
                }
                
                echo json_encode($info, JSON_PRETTY_PRINT);
                break;
                
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action invalide']);
        }
        
    } catch (Exception $e) {
        error_log("ERREUR: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
    }
    
    exit;
}

// Fallback ZIP (pour compatibilité)
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
