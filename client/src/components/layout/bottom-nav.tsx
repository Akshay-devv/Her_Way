import { Link, useLocation } from "wouter";
import { Map, Shield, User, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Map, label: "Map" },
    { href: "/route", icon: Navigation, label: "Route" },
    { href: "/settings", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border pb-safe pt-2 px-6 h-[88px] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-start max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-16 transition-colors duration-200 group cursor-pointer",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-2xl transition-all duration-300",
                isActive ? "bg-primary/10 -translate-y-1" : "group-hover:bg-muted"
              )}>
                <item.icon 
                  className={cn(
                    "w-6 h-6 transition-all",
                    isActive && "fill-current"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-opacity",
                isActive ? "font-semibold" : "opacity-80"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
