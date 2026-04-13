import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import twilio from "twilio";

let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Passport Auth
  setupAuth(app);

  // Safety Data Endpoints
  app.get(api.safety.zones.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const zones = await storage.getSafetyZones();
    res.json(zones);
  });

  app.post(api.safety.reportZone.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const data = req.body;
      const parsedData = {
        lat: Number(data.lat),
        lng: Number(data.lng),
        radius: Number(data.radius),
        riskLevel: data.riskLevel,
        description: data.description || "Community Reported Area",
        reporterId: (req.user as any)?.id || null,
        createdAt: new Date().toISOString(),
      };
      const newZone = await storage.createSafetyZone(parsedData);
      res.status(201).json(newZone);
    } catch (e) {
      console.error("[Create Zone Error]", e);
      res.status(500).json({ message: "Failed to report zone" });
    }
  });

  app.get(api.safety.stops.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // Default to the central park mockup if no lat/lng provided to keep backward compatibility
    const lat = Number(req.query.lat) || 40.785;
    const lng = Number(req.query.lng) || -73.968;
    const radius = Number(req.query.radius) || 5000;
    
    try {
      // Fetch dynamic safe stops using Overpass API
      // searching for amenity=police and amenity=hospital within radius
      const overpassQuery = `[out:json][timeout:15];(node["amenity"="police"](around:${radius},${lat},${lng});way["amenity"="police"](around:${radius},${lat},${lng});node["amenity"="hospital"](around:${radius},${lat},${lng});way["amenity"="hospital"](around:${radius},${lat},${lng}););out center;`;
      
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "HerWay-SafetyApp/1.0 (Node.js Fetch)"
        },
        body: overpassQuery
      });
      
      if (!response.ok) throw new Error("Overpass API failed");
      
      const data: any = await response.json();
      
      const dynamicStops = data.elements.map((el: any) => {
        const elementType = el.tags?.amenity || "police";
        const coords = el.type === "node" ? { lat: el.lat, lng: el.lon } : { lat: el.center?.lat, lng: el.center?.lon };
        return {
          id: el.id,
          type: elementType,
          name: el.tags?.name || (elementType === "police" ? "Police Station" : "Hospital"),
          lat: coords.lat,
          lng: coords.lng,
          address: el.tags?.["addr:street"] ? `${el.tags["addr:housenumber"] || ""} ${el.tags["addr:street"]}`.trim() : "Local Emergency Stop",
          phone: el.tags?.phone || null,
        };
      });
      
      // If overpass returns results, serve them. Otherwise fallback to database seeds.
      if (dynamicStops.length > 0) {
        return res.json(dynamicStops);
      }
    } catch (e) {
      console.error("[Overpass Error]", e);
    }

    // Fallback
    const stops = await storage.getSafeStops();
    res.json(stops);
  });

  app.post(api.safety.sos.path, async (req, res) => {
    try {
      const { lat, lng } = req.body;
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      
      console.log("\n=======================================================");
      console.log("🚨 [EMERGENCY SOS TRIGGERED] 🚨");
      
      if (req.isAuthenticated()) {
        const user = req.user as any;
        const contacts = [user.emergencyContact1, user.emergencyContact2].filter(Boolean);
        
        console.log(`User: ${user.fullName} (${user.phone})`);
        console.log(`Action: Dispatching SMS to Emergency Contacts`);
        console.log(`Contacts: ${contacts.join(", ") || "None registered"}`);
        
        const messageBody = `EMERGENCY: I need help! My current location is: ${mapsLink}`;
        console.log(`Message: "${messageBody}"`);

        if (twilioClient && contacts.length > 0) {
          console.log(`\n📡 Sending real SMS via Twilio to ${contacts.length} contact(s)...`);
          for (const contact of contacts) {
             try {
                // Ensure proper E.164 formatting if needed; Twilio requires country code, e.g., +1...
                await twilioClient.messages.create({
                  body: messageBody,
                  from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
                  to: contact
                });
                console.log(`✅ SMS successfully handed off to Twilio for ${contact}`);
             } catch(err: any) {
                console.error(`❌ Failed to send SMS to ${contact}: ${err.message}`);
             }
          }
          console.log(""); // Empty line for log cleanliness
        }
      } else {
        console.log(`User: UNREGISTERED / LOGGED OUT GUEST`);
        console.log(`Action: Notifying nearby community sensors (Simulated)`);
        console.log(`Message: "EMERGENCY: Unregistered user needs help! Location: ${mapsLink}"`);
      }
      console.log("=======================================================\n");

      res.status(200).json({ message: "SOS signal sent successfully" });
    } catch (e) {
      console.error("[SOS Error]", e);
      res.status(500).json({ message: "Failed to send SOS" });
    }
  });

// Helper function to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate safety score for a route (Lower is better)
function calculateSafetyScore(routeCoordinates: [number, number][], safetyZones: any[]) {
  let score = 0;
  
  if (!safetyZones || safetyZones.length === 0) return score;

  // We sample coordinates to avoid checking every single point (efficiency)
  const sampleRate = Math.max(1, Math.floor(routeCoordinates.length / 50));

  for (let i = 0; i < routeCoordinates.length; i += sampleRate) {
    const [lng, lat] = routeCoordinates[i];
    
    for (const zone of safetyZones) {
      const dist = getDistanceInMeters(lat, lng, Number(zone.lat), Number(zone.lng));
      
      if (dist <= Number(zone.radius)) {
        if (zone.riskLevel === 'high') score += 10;
        else if (zone.riskLevel === 'moderate') score += 5;
        else if (zone.riskLevel === 'low') score += 1; // Even low risk zones add slight weight to prefer zero-risk
      }
    }
  }
  
  return score;
}

  // Navigation / Route with OSRM
  app.post(api.navigation.route.path, async (req, res) => {
    // if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { startLat, startLng, endLat, endLng } = req.body;
    console.log(`[Routing] Start: ${startLat}, ${startLng} | End: ${endLat}, ${endLng}`);

    try {
      // Use public OSRM API for routing (driving profile) with alternatives and steps
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
      console.log(`[Routing] Fetching: ${osrmUrl}`);
      
      const response = await fetch(osrmUrl);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data: any = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        return res.status(400).json({ message: "No route found" });
      }

      // Fetch safety zones from database
      const safetyZones = await storage.getSafetyZones();

      // Process and score all alternative routes
      const processedRoutes = data.routes.map((route: any) => {
        const coordinates = route.geometry.coordinates;
        const riskScore = calculateSafetyScore(coordinates, safetyZones);
        
        let category = "safe";
        if (riskScore > 0 && riskScore <= 15) category = "moderate";
        else if (riskScore > 15) category = "unsafe";

        const path = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        return {
          path,
          riskScore,
          category,
          distance: `${distanceKm} km`,
          duration: `${durationMin} min`,
          geometry: route.geometry,
          steps: route.legs?.[0]?.steps || []
        };
      });

      // Sort routes by safety (lowest risk score first)
      processedRoutes.sort((a: any, b: any) => a.riskScore - b.riskScore);

      console.log(`[Routing] Found ${processedRoutes.length} route(s). Best Risk Score: ${processedRoutes[0].riskScore} (${processedRoutes[0].category})`);

      // Return array of structured routes
      res.json({
        routes: processedRoutes
      });

    } catch (error: any) {
      console.error("[Routing] Error details:", error.message);
      res.status(500).json({ message: "Failed to calculate route" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const zones = await storage.getSafetyZones();
  if (zones.length === 0) {
    // Seed some zones around a default location (e.g., Central Park NY for demo)
    // 40.785091, -73.968285
    
    // Low risk (Green) - Park interior
    await storage.createSafetyZone({
      lat: 40.7829,
      lng: -73.9654,
      radius: 500,
      riskLevel: "low",
      description: "Park Safe Zone",
      reporterId: null,
      createdAt: new Date().toISOString()
    });

    // Moderate risk (Yellow) - Some busy intersection
    await storage.createSafetyZone({
      lat: 40.7900,
      lng: -73.9600,
      radius: 300,
      riskLevel: "moderate",
      description: "Busy Traffic Area",
      reporterId: null,
      createdAt: new Date().toISOString()
    });

    // High risk (Red) - Imaginary unsafe alley
    await storage.createSafetyZone({
      lat: 40.7950,
      lng: -73.9550,
      radius: 200,
      riskLevel: "high",
      description: "Caution Required",
      reporterId: null,
      createdAt: new Date().toISOString()
    });
  }

  const stops = await storage.getSafeStops();
  if (stops.length === 0) {
    await storage.createSafeStop({
      type: "police",
      name: "Precinct 22",
      lat: 40.7800,
      lng: -73.9700,
      address: "123 Park Ave",
      phone: "911"
    });

    await storage.createSafeStop({
      type: "hospital",
      name: "City General",
      lat: 40.7880,
      lng: -73.9750,
      address: "456 Med Blvd",
      phone: "555-0123"
    });
  }
}
