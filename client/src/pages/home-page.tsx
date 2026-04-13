import { MapView } from "@/components/map/map-view";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useGeolocation } from "@/hooks/use-geolocation";
import { SafetyBadge } from "@/components/safety/safety-badge";
import { Loader2, Navigation, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useReportSafetyZone } from "@/hooks/use-safety";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { location, loading, error } = useGeolocation();
  const reportMutation = useReportSafetyZone();
  const { toast } = useToast();

  const handleReport = () => {
    if (!location) return;
    reportMutation.mutate({
      lat: location.lat,
      lng: location.lng,
      radius: 200,
      riskLevel: "high",
      description: "Community Reported Danger Zone"
    }, {
      onSuccess: () => {
        toast({
          title: "Area Reported",
          description: "Thank you for keeping the community safe. This area has been marked as high risk.",
          variant: "destructive",
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Locating you...</p>
        </div>
      </div>
    );
  }

  // Default to a known safe location if error or denied (e.g., London center for demo)
  const center = location || { lat: 51.505, lng: -0.09 };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Top Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-white/90 via-white/50 to-transparent pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-display font-bold text-foreground">Nearby</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Current Status:</span>
              <SafetyBadge level="low" className="h-6" />
            </div>
          </div>
          <Link href="/route">
            <Button size="icon" className="rounded-full shadow-lg h-12 w-12 bg-primary hover:bg-primary/90">
              <Navigation className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Map Layer */}
      <MapView
        center={center}
        zoom={16}
        className="h-full w-full absolute inset-0 z-0"
      />

      {/* Alert if location denied */}
      {error && !location && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur p-6 rounded-2xl shadow-xl max-w-xs text-center border border-destructive/20">
          <h3 className="text-lg font-bold text-destructive mb-2">Location Required</h3>
          <p className="text-sm text-muted-foreground mb-4">Please enable location services to see safety zones around you.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* Report Button */}
      {location && (
        <>
          <Button 
            variant="destructive" 
            className="absolute bottom-24 right-4 z-20 shadow-xl rounded-full px-6 shadow-destructive/20 hidden md:flex"
            onClick={handleReport}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            Report Unsafe Area
          </Button>
          <Button 
            variant="destructive" 
            size="icon"
            className="absolute bottom-24 right-4 z-20 shadow-xl rounded-full h-14 w-14 shadow-destructive/20 md:hidden"
            onClick={handleReport}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <AlertTriangle className="w-6 h-6" />}
          </Button>
        </>
      )}

      <BottomNav />
    </div>
  );
}
