// ==================== WORKER OPTIMISÉ ====================
let tripUpdatesCache = {};
let lastProcessTime = 0;

self.onmessage = function(e) {
    const startTime = performance.now();
    const data = e.data;
    
    try {
        const tripUpdates = {};
        const entities = data.entity || [];
        
        // Traitement par batch
        const BATCH_SIZE = 50;
        let processedCount = 0;
        
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
            const batch = entities.slice(i, i + BATCH_SIZE);
            
            batch.forEach(entity => {
                if (!entity.tripUpdate) return;
                
                const tripUpdate = entity.tripUpdate;
                const tripId = tripUpdate.trip?.tripId;
                
                if (!tripId) return;
                
                const stopUpdates = [];
                const nextStops = [];
                
                if (tripUpdate.stopTimeUpdate) {
                    tripUpdate.stopTimeUpdate.forEach(update => {
                        const stopId = update.stopId;
                        const arrival = update.arrival || {};
                        const departure = update.departure || {};
                        
                        stopUpdates.push({
                            stopId: stopId,
                            arrivalDelay: arrival.delay || 0,
                            departureDelay: departure.delay || 0,
                            scheduledArrival: arrival.time || null,
                            scheduledDeparture: departure.time || null
                        });
                        
                        const delay = departure.delay || arrival.delay || 0;
                        const arrivalTime = arrival.time;
                        const departureTime = departure.time;
                        
                        nextStops.push({
                            stopId: stopId,
                            delay: delay,
                            arrivalTime: arrivalTime ? formatTime(arrivalTime) : 'Inconnu',
                            departureTime: departureTime ? formatTime(departureTime) : 'Inconnu'
                        });
                    });
                }
                
                const lastStopId = nextStops.length > 0 
                    ? nextStops[nextStops.length - 1].stopId 
                    : 'Inconnu';
                
                tripUpdates[tripId] = {
                    stopUpdates: stopUpdates,
                    nextStops: nextStops,
                    lastStopId: lastStopId
                };
                
                processedCount++;
            });
            
            // Yield pour ne pas bloquer
            if (i % (BATCH_SIZE * 10) === 0) {
                self.postMessage({
                    type: 'progress',
                    processed: processedCount,
                    total: entities.length
                });
            }
        }
        
        const processTime = performance.now() - startTime;
        lastProcessTime = processTime;
        
        // Comparer avec le cache pour détecter les changements
        const hasChanges = !deepEqual(tripUpdates, tripUpdatesCache);
        
        if (hasChanges) {
            tripUpdatesCache = tripUpdates;
            
            self.postMessage({
                type: 'complete',
                tripUpdates: tripUpdates,
                processTime: processTime,
                entityCount: entities.length,
                hasChanges: true
            });
        } else {
            self.postMessage({
                type: 'complete',
                tripUpdates: tripUpdates,
                processTime: processTime,
                entityCount: entities.length,
                hasChanges: false
            });
        }
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error.message,
            stack: error.stack
        });
    }
};

function formatTime(timestamp) {
    if (!timestamp) return 'Inconnu';
    
    try {
        const date = new Date(timestamp * 1000);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return 'Inconnu';
    }
}

function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || 
        obj1 === null || obj2 === null) {
        return false;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    // Comparaison rapide sur un échantillon
    const sampleSize = Math.min(10, keys1.length);
    for (let i = 0; i < sampleSize; i++) {
        const key = keys1[i];
        if (!keys2.includes(key)) return false;
        
        const val1 = obj1[key];
        const val2 = obj2[key];
        
        if (typeof val1 !== typeof val2) return false;
        
        if (typeof val1 === 'object') {
            if (JSON.stringify(val1) !== JSON.stringify(val2)) return false;
        } else if (val1 !== val2) {
            return false;
        }
    }
    
    return true;
}
// ==================== FIN WORKER OPTIMISÉ ====================
