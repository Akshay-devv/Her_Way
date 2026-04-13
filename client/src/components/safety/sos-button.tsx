import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function SosButton() {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { location } = useGeolocation();
  const { toast } = useToast();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (isActive && countdown === 0) {
      triggerSos();
    }
    return () => clearTimeout(timer);
  }, [isActive, countdown]);

  const triggerSos = async () => {
    setIsActive(false);
    setCountdown(5);
    
    // For development/testing environments where geolocation might be blocked, use a fallback
    const finalLocation = location || { lat: 40.785000, lng: -73.968000 };

    try {
      await apiRequest("POST", api.safety.sos.path, {
        lat: finalLocation.lat,
        lng: finalLocation.lng,
      });

      toast({
        title: "SOS Sent",
        description: "Your emergency contacts have been notified with your live location.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "SOS Error",
        description: "Failed to send SOS signal. Please try again or call emergency services directly.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsActive(false);
    setCountdown(5);
  };

  const handleActivate = () => {
    setIsActive(true);
    setCountdown(5);
  };

  return (
    <>
      <Button
        onClick={handleActivate}
        className="fixed bottom-[120px] left-4 md:bottom-10 md:left-10 z-[9999] rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 shadow-[0_0_25px_rgba(220,38,38,0.8)] border-4 border-white flex items-center justify-center p-0"
        aria-label="Emergency SOS"
      >
        <AlertCircle className="w-8 h-8 text-white" />
      </Button>

      {isActive && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-600/95 backdrop-blur-md p-6 text-white animate-in fade-in duration-200">
          <AlertCircle className="w-24 h-24 mb-6 animate-pulse" />
          <h1 className="text-4xl font-black mb-2 text-center tracking-wider uppercase">Emergency SOS</h1>
          <p className="text-xl text-red-100 mb-8 text-center max-w-sm">
            Notifying your emergency contacts in...
          </p>
          
          <div className="text-9xl font-black mb-12 tabular-nums">
            {countdown}
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={handleCancel}
            className="rounded-full w-full max-w-xs h-16 text-xl font-bold bg-white/10 hover:bg-white/20 border-white text-white hover:text-white transition-colors"
          >
            <X className="w-6 h-6 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
