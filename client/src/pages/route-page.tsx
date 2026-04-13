import { useState } from "react";
import { useRouteCalculation } from "@/hooks/use-navigation";
import { useGeolocation } from "@/hooks/use-geolocation";
import { MapView } from "@/components/map/map-view";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Clock, Navigation, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafetyBadge } from "@/components/safety/safety-badge";

export default function RoutePage() {
  const { location } = useGeolocation();
  const { mutate: calculateRoute, data: routeData, isPending } = useRouteCalculation();
  
  // In a real app, you'd use a geocoding API to turn text into lat/lng.
  // For this demo, we'll simulate destination coordinates nearby.
  const [destination, setDestination] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !destination.trim()) return;

    // SIMULATION: In a real app, use a geocoding API to get lat/lng from text.
    // For this demo, we'll parse coordinates if entered as "lat, lng" or use a simulated offset.
    let endLat, endLng;
    const coords = destination.split(",").map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      [endLat, endLng] = coords;
    } else {
      // Default simulated offset if plain text entered
      endLat = location.lat + 0.01;
      endLng = location.lng + 0.01;
    }

    console.log(`[RoutePage] Requesting route to: ${endLat}, ${endLng}`);
    calculateRoute({
      startLat: location.lat,
      startLng: location.lng,
      endLat,
      endLng,
    });
    // Store destination for marker display
    setDestinationLoc({ lat: endLat, lng: endLng });
  };

  const [destinationLoc, setDestinationLoc] = useState<{lat: number, lng: number} | undefined>();

  // New backend response returns an array of routes under `routeData.routes`
  const routesArray = (routeData as any)?.routes || [];
  
  // Show safest route. If the safest is purely "safe" (score 0), we only show that one.
  // Otherwise, if the best is moderate/unsafe, we might show alternatives.
  const displayRoutes = routesArray.length > 0 
    ? (routesArray[0].category === 'safe' ? [routesArray[0]] : routesArray) 
    : undefined;
    
  const bestRoute = routesArray.length > 0 ? routesArray[0] : null;
  const currentStep = bestRoute?.steps?.[currentStepIndex];

  // Helper function to format OSRM maneuvers into English text
  const getStepInstruction = (step: any) => {
    if (!step) return "Calculating step instructions...";
    
    const modifier = step.maneuver?.modifier || "";
    const type = step.maneuver?.type || "head";
    
    // Capitalize type e.g., turn -> Turn
    let action = type.charAt(0).toUpperCase() + type.slice(1);
    
    if (type === 'depart') return `Head ${modifier} on ${step.name || 'current road'}`;
    if (type === 'arrive') return `You will arrive at your destination`;
    
    let text = `${action} ${modifier}`.trim();
    if (step.name) {
      text += ` onto ${step.name}`;
    }
    
    // Cleanup dashes
    return text.replace(/-/g, ' ');
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col relative">
      {/* Search Header OR Navigation Overlay */}
      {!isNavigating ? (
        <div className="z-20 bg-white shadow-sm p-4 pt-safe rounded-b-3xl space-y-4">
          <h1 className="text-xl font-display font-bold">Plan Safe Route</h1>
          <form onSubmit={handleRouteSearch} className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Enter destination (lat, lng)" 
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending || !location} className="bg-primary shadow-md shadow-primary/20">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="z-20 bg-primary text-primary-foreground shadow-lg p-6 pt-safe rounded-b-3xl animate-in slide-in-from-top-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
               {/* Just a generic directional arrow for effect */}
              <Navigation className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium opacity-80 mb-1">
                {currentStep?.distance ? `${currentStep.distance}m` : "Continue"}
              </div>
              <div className="text-xl font-display font-semibold leading-tight">
                {getStepInstruction(currentStep)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative">
         <MapView 
          center={location || { lat: 51.505, lng: -0.09 }} 
          routes={displayRoutes}
          destination={destinationLoc}
          zoom={14} 
          className="h-full w-full"
        />
        
        {/* Route Info Card (Floating) */}
        {bestRoute && (
          <div className="absolute bottom-24 left-4 right-4 z-20 animate-in slide-in-from-bottom-10 fade-in">
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Estimated Time</div>
                    <div className="text-2xl font-bold font-display flex items-baseline gap-1">
                      {bestRoute.duration}
                      <span className="text-sm font-normal text-muted-foreground">({bestRoute.distance})</span>
                    </div>
                  </div>
                  {/* SafetyBadge component mapping might need an update if they use "safe" instead of "low" */}
                  <SafetyBadge level={bestRoute.category === 'safe' ? 'low' : bestRoute.category === 'unsafe' ? 'high' : 'moderate'} />
                </div>
                
                {isNavigating && bestRoute?.steps && currentStepIndex < bestRoute.steps.length - 1 && (
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStepIndex(i => i + 1)}
                    className="w-full h-12 mb-3 text-lg font-semibold rounded-xl"
                  >
                    Next Step <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    setIsNavigating(!isNavigating);
                    if (!isNavigating) setCurrentStepIndex(0);
                  }}
                  className={`w-full h-12 text-lg font-semibold shadow-lg rounded-xl group ${isNavigating ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/25' : 'bg-primary hover:bg-primary/90 shadow-primary/25'}`}
                >
                  {isNavigating ? (
                    <>Stop Navigation</>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                      Start Navigation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!isNavigating && <BottomNav />}
    </div>
  );
}
