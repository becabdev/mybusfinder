<?php
@ini_set('memory_limit', '512M');
set_time_limit(180);

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

// Fichiers optimisés et compressés
$optimizedCoreFile = $cacheDir . '/gtfs_core_optimized.json.gz';
$optimizedRoutesFile = $cacheDir . '/gtfs_routes_optimized.json.gz';
$optimizedStopsFile = $cacheDir . '/gtfs_stops_optimized.json.gz';

$debug = isset($_GET['debug']);

if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

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

// Parse CSV en streaming pour économiser la RAM
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

// Créer un fichier optimisé pour routes (seulement les champs nécessaires)
function createOptimizedRoutes($extractDir, $outputFile) {
    $routes = [];
    
    parseCSVStream($extractDir . '/routes.txt', function($item) use (&$routes) {
        $routeId = $item['route_id'] ?? '';
        if ($routeId) {
            // Ne garder que les champs essentiels
            $routes[$routeId] = [
                's' => $item['route_short_name'] ?? '',  // short_name
                'l' => $item['route_long_name'] ?? '',    // long_name
                'c' => $item['route_color'] ?? 'FFFFFF', // color
                't' => $item['route_text_color'] ?? '000000' // text_color
            ];
        }
    });
    
    // Compression GZIP
    $json = json_encode($routes);
    $compressed = gzencode($json, 9);
    file_put_contents($outputFile, $compressed);
    
    unset($routes, $json);
    gc_collect_cycles();
    
    return true;
}

// Créer un fichier optimisé pour stops (seulement les champs nécessaires)
function createOptimizedStops($extractDir, $outputFile) {
    $stops = [];
    
    parseCSVStream($extractDir . '/stops.txt', function($item) use (&$stops) {
        $stopId = $item['stop_id'] ?? '';
        if ($stopId) {
            // Ne garder que les champs essentiels
            $stops[$stopId] = [
                'n' => $item['stop_name'] ?? '',     // name
                'lat' => $item['stop_lat'] ?? '',    // latitude
                'lon' => $item['stop_lon'] ?? ''     // longitude
            ];
        }
    });
    
    // Compression GZIP
    $json = json_encode($stops);
    $compressed = gzencode($json, 9);
    file_put_contents($outputFile, $compressed);
    
    unset($stops, $json);
    gc_collect_cycles();
    
    return true;
}

function createOptimizedCore($extractDir, $routesFile, $stopsFile, $outputFile) {
    // Charger les routes optimisées
    $routesCompressed = file_get_contents($routesFile);
    $routesJson = gzdecode($routesCompressed);
    $routes = json_decode($routesJson, true);
    
    // Charger les stops optimisés
    $stopsCompressed = file_get_contents($stopsFile);
    $stopsJson = gzdecode($stopsCompressed);
    $stops = json_decode($stopsJson, true);
    
    // Convertir le format compact en format complet pour le client
    $routesExpanded = [];
    foreach ($routes as $id => $r) {
        $routesExpanded[$id] = [
            's' => $r['s'],
            'l' => $r['l'],
            'c' => $r['c'],
            't' => $r['t']
        ];
    }
    
    $stopsExpanded = [];
    foreach ($stops as $id => $s) {
        $stopsExpanded[$id] = [
            'n' => $s['n'],
            'lat' => $s['lat'],
            'lon' => $s['lon']
        ];
    }
    
    // AJOUTER: Charger calendar et calendar_dates
    $calendar = [];
    $calendarFile = $extractDir . '/calendar.txt';
    if (file_exists($calendarFile)) {
        $fh = fopen($calendarFile, 'r');
        $headers = fgetcsv($fh);
        while (($row = fgetcsv($fh)) !== false) {
            $item = [];
            foreach ($headers as $i => $header) {
                $item[trim($header)] = isset($row[$i]) ? trim($row[$i]) : '';
            }
            if (!empty($item['service_id'])) {
                $calendar[$item['service_id']] = $item;
            }
        }
        fclose($fh);
    }
    
    // Charger calendar_dates
    $calendarDatesByDate = [];
    $calendarDatesFile = $extractDir . '/calendar_dates.txt';
    if (file_exists($calendarDatesFile)) {
        $fh = fopen($calendarDatesFile, 'r');
        $headers = fgetcsv($fh);
        while (($row = fgetcsv($fh)) !== false) {
            $item = [];
            foreach ($headers as $i => $header) {
                $item[trim($header)] = isset($row[$i]) ? trim($row[$i]) : '';
            }
            
            $date = $item['date'] ?? '';
            if (empty($date)) continue;
            
            if (!isset($calendarDatesByDate[$date])) {
                $calendarDatesByDate[$date] = ['added' => [], 'removed' => []];
            }
            
            if (($item['exception_type'] ?? '') === '1') {
                $calendarDatesByDate[$date]['added'][] = $item['service_id'] ?? '';
            } else {
                $calendarDatesByDate[$date]['removed'][] = $item['service_id'] ?? '';
            }
        }
        fclose($fh);
    }
    
    $core = [
        'routes' => $routesExpanded,
        'stops' => $stopsExpanded,
        'calendar' => $calendar,
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

function extractAndOptimizeGTFS($zipCacheFile, $extractDir, $coreCacheFile, $optimizedCoreFile, $optimizedRoutesFile, $optimizedStopsFile, $tripIndexFile) {
    $zip = new ZipArchive();
    if ($zip->open($zipCacheFile) !== TRUE) {
        throw new Exception('Impossible ouvrir ZIP');
    }
    
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
    $action = $_GET['action'];
    
    // Log pour debug
    error_log("Action demandée: " . $action);
    
    try {
        // Vérifier si les fichiers optimisés existent
        $needsOptimization = !file_exists($optimizedCoreFile) || 
                            !file_exists($optimizedRoutesFile) || 
                            !file_exists($optimizedStopsFile);
        
        error_log("Needs optimization: " . ($needsOptimization ? 'OUI' : 'NON'));
        
        if ($needsOptimization || $debug) {
            error_log("Début de l'optimisation...");
            
            // Télécharger le ZIP si nécessaire
            if (!file_exists($zipCacheFile) || (time() - filemtime($zipCacheFile) > $cacheTTL)) {
                error_log("Téléchargement du ZIP...");
                $zipData = @file_get_contents($url);
                if ($zipData === false) throw new Exception('Impossible telecharger ZIP');
                file_put_contents($zipCacheFile, $zipData);
                unset($zipData);
                error_log("ZIP téléchargé: " . filesize($zipCacheFile) . " bytes");
            }
            
            // Extraction et optimisation
            error_log("Extraction et optimisation...");
            extractAndProcessGTFS($zipCacheFile, $extractDir, $coreCacheFile, $optimizedCoreFile, $optimizedRoutesFile, $optimizedStopsFile, $tripIndexFile);
            error_log("Optimisation terminée");
        }
        
        switch ($action) {
            case 'core':
                if (!file_exists($optimizedCoreFile)) {
                    throw new Exception("Fichier core non trouvé");
                }
                header("Content-Type: application/json");
                header("Content-Encoding: gzip");
                error_log("Envoi du fichier core: " . filesize($optimizedCoreFile) . " bytes");
                readfile($optimizedCoreFile);
                break;
                
            case 'routes':
                if (!file_exists($optimizedRoutesFile)) {
                    throw new Exception("Fichier routes non trouvé: " . $optimizedRoutesFile);
                }
                header("Content-Type: application/json");
                header("Content-Encoding: gzip");
                error_log("Envoi du fichier routes: " . filesize($optimizedRoutesFile) . " bytes");
                readfile($optimizedRoutesFile);
                break;
                
            case 'stops':
                if (!file_exists($optimizedStopsFile)) {
                    throw new Exception("Fichier stops non trouvé");
                }
                header("Content-Type: application/json");
                header("Content-Encoding: gzip");
                error_log("Envoi du fichier stops: " . filesize($optimizedStopsFile) . " bytes");
                readfile($optimizedStopsFile);
                break;
                
            case 'info':
                header("Content-Type: application/json");
                
                $info = [
                    'core_exists' => file_exists($optimizedCoreFile),
                    'routes_exists' => file_exists($optimizedRoutesFile),
                    'stops_exists' => file_exists($optimizedStopsFile),
                    'core_size' => file_exists($optimizedCoreFile) ? filesize($optimizedCoreFile) : 0,
                    'routes_size' => file_exists($optimizedRoutesFile) ? filesize($optimizedRoutesFile) : 0,
                    'stops_size' => file_exists($optimizedStopsFile) ? filesize($optimizedStopsFile) : 0,
                    'total_size' => 0,
                    'cache_age_hours' => 0,
                    'cache_dir' => $cacheDir,
                    'extract_dir' => $extractDir
                ];
                
                $info['total_size'] = $info['core_size'] + $info['routes_size'] + $info['stops_size'];
                
                if (file_exists($cacheMarkerFile)) {
                    $cacheTime = (int)file_get_contents($cacheMarkerFile);
                    $info['cache_age_hours'] = round((time() - $cacheTime) / 3600, 1);
                }
                
                echo json_encode($info, JSON_PRETTY_PRINT);
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
                        // Extraire les fichiers si nécessaire
                        if (!file_exists($extractDir . '/trips.txt') || !file_exists($extractDir . '/stop_times.txt')) {
                            $zip = new ZipArchive();
                            if ($zip->open($zipCacheFile) !== TRUE) {
                                throw new Exception('Impossible ouvrir ZIP');
                            }
                            
                            $filesToExtract = ['trips.txt', 'stop_times.txt'];
                            foreach ($filesToExtract as $file) {
                                if ($zip->locateName($file) !== false) {
                                    $zip->extractTo($extractDir, $file);
                                }
                            }
                            $zip->close();
                        }
                        
                        // Charger trips pour cette route
                        $trips = [];
                        $tripIds = [];
                        
                        $tripsFile = $extractDir . '/trips.txt';
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
                        
                        // Charger stop_times
                        $stopTimesFile = $extractDir . '/stop_times.txt';
                        $fh = fopen($stopTimesFile, 'r');
                        $headers = fgetcsv($fh);
                        $tripIdIdx = array_search('trip_id', $headers);
                        $stopIdIdx = array_search('stop_id', $headers);
                        $arrivalIdx = array_search('arrival_time', $headers);
                        $sequenceIdx = array_search('stop_sequence', $headers);
                        
                        $stopTimesByTrip = [];
                        
                        while (($row = fgetcsv($fh)) !== false) {
                            $tripId = $row[$tripIdIdx] ?? '';
                            
                            if (!isset($tripIds[$tripId])) continue;
                            
                            if (!isset($stopTimesByTrip[$tripId])) {
                                $stopTimesByTrip[$tripId] = [];
                            }
                            
                            $arrivalTime = $row[$arrivalIdx] ?? '';
                            $stopTimesByTrip[$tripId][] = [
                                'stop_id' => $row[$stopIdIdx] ?? '',
                                'arrival_time' => $arrivalTime,
                                'departure_time' => $arrivalTime,
                                'stop_sequence' => (int)($row[$sequenceIdx] ?? 0)
                            ];
                        }
                        fclose($fh);
                        
                        // Trier par séquence
                        foreach ($stopTimesByTrip as $tid => &$times) {
                            usort($times, function($a, $b) {
                                return $a['stop_sequence'] - $b['stop_sequence'];
                            });
                        }
                        
                        $routeData = [
                            'trips' => $trips,
                            'stopTimes' => $stopTimesByTrip
                        ];
                        
                        $json = json_encode($routeData);
                        file_put_contents($routeCacheFile, $json);
                        echo $json;
                    }
                    break;
                
            default:
                error_log("Action invalide: " . $action);
                header("Content-Type: application/json");
                http_response_code(400);
                echo json_encode([
                    'error' => 'Action invalide',
                    'action_received' => $action,
                    'valid_actions' => ['core', 'routes', 'stops', 'info']
                ]);
        }
        
    } catch (Exception $e) {
        error_log("ERREUR: " . $e->getMessage());
        header("Content-Type: application/json");
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
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
