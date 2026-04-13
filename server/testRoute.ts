import "dotenv/config";
import fetch from "node-fetch";

async function testRoute() {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/-73.968285,40.785091;-73.9550,40.7950?overview=full&geometries=geojson&alternatives=true`;
  console.log(`[Test] Fetching: ${osrmUrl}`);
  
  const response = await fetch(osrmUrl);
  if (!response.ok) {
    throw new Error(`OSRM API error: ${response.status}`);
  }

  const data: any = await response.json();
  
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    console.error("[Test] No route found");
    return;
  }

  // Calculate safety score (simulating backend)
  const safetyZones = [
    {
      lat: 40.7829,
      lng: -73.9654,
      radius: 500,
      riskLevel: "low",
      description: "Park Safe Zone"
    },
    {
      lat: 40.7900,
      lng: -73.9600,
      radius: 300,
      riskLevel: "moderate",
      description: "Busy Traffic Area"
    },
    {
      lat: 40.7950,
      lng: -73.9550,
      radius: 200,
      riskLevel: "high",
      description: "Caution Required"
    }
  ];

  // Helper function
  function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateSafetyScore(routeCoordinates: [number, number][], zones: any[]) {
    let score = 0;
    const sampleRate = Math.max(1, Math.floor(routeCoordinates.length / 50));

    for (let i = 0; i < routeCoordinates.length; i += sampleRate) {
      const [lng, lat] = routeCoordinates[i];
      for (const zone of zones) {
        const dist = getDistanceInMeters(lat, lng, Number(zone.lat), Number(zone.lng));
        if (dist <= Number(zone.radius)) {
          if (zone.riskLevel === 'high') score += 10;
          else if (zone.riskLevel === 'moderate') score += 5;
          else if (zone.riskLevel === 'low') score += 1;
        }
      }
    }
    return score;
  }

  // Process mapping
  const processedRoutes = data.routes.map((route: any) => {
    const coordinates = route.geometry.coordinates;
    const riskScore = calculateSafetyScore(coordinates, safetyZones);
    let category = "safe";
    if (riskScore > 0 && riskScore <= 15) category = "moderate";
    else if (riskScore > 15) category = "unsafe";

    return {
      riskScore,
      category,
      distance: (route.distance / 1000).toFixed(1) + " km",
    };
  });

  processedRoutes.sort((a: any, b: any) => a.riskScore - b.riskScore);

  console.log(`[Test] Total Routes Processed: ${processedRoutes.length}`);
  console.log(JSON.stringify(processedRoutes, null, 2));
}

testRoute().catch(console.error);
