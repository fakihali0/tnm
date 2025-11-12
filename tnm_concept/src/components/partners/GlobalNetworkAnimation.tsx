import { motion } from "framer-motion";
import { Users, Building2, Globe, DollarSign, TrendingUp, Zap } from "lucide-react";
import { useMobileOptimizations, useMobileAnimationConfig } from "@/hooks/useMobileOptimizations";
import { useIsMobile } from "@/hooks/use-mobile";

export type GlobalNetworkAnimationProps = {
  disabled?: boolean;
};

// Partner types with different characteristics
const partnerTypes = {
  affiliate: { color: "hsl(258, 73%, 51%)", size: 2, icon: Users },
  ib: { color: "hsl(258, 100%, 72%)", size: 3, icon: Building2 },
  regional: { color: "hsl(258, 100%, 58%)", size: 4, icon: Globe }
};

// Generate affiliate network nodes with geographic distribution
const generatePartnerNetwork = () => {
  const partners = [];
  
  // Major financial centers and high-density regions
  const financialHubs = [
    { name: "New York", lat: 40.7, lng: -74, region: "americas", type: "regional" },
    { name: "London", lat: 51.5, lng: -0.1, region: "europe", type: "regional" },
    { name: "Singapore", lat: 1.3, lng: 103.8, region: "asia", type: "regional" },
    { name: "Dubai", lat: 25.2, lng: 55.3, region: "mena", type: "ib" },
    { name: "Sydney", lat: -33.9, lng: 151.2, region: "oceania", type: "ib" },
    { name: "Frankfurt", lat: 50.1, lng: 8.7, region: "europe", type: "ib" },
    { name: "Hong Kong", lat: 22.3, lng: 114.2, region: "asia", type: "ib" },
    { name: "Toronto", lat: 43.7, lng: -79.4, region: "americas", type: "ib" }
  ];

  // Add major hubs
  financialHubs.forEach((hub, index) => {
    const theta = (90 - hub.lat) * (Math.PI / 180);
    const phi = (hub.lng + 180) * (Math.PI / 180);
    
    partners.push({
      id: `hub-${index}`,
      x: 50 + 35 * Math.sin(theta) * Math.cos(phi),
      y: 50 + 35 * Math.sin(theta) * Math.sin(phi),
      z: 35 * Math.cos(theta),
      type: hub.type,
      isHub: true,
      region: hub.region,
      performance: Math.random() * 0.5 + 0.7, // High performance for hubs
      commissionFlow: Math.random() * 1000 + 500,
      delay: index * 0.3
    });
  });

  // Generate affiliate network around hubs
  financialHubs.forEach((hub, hubIndex) => {
    const affiliateCount = hub.type === "regional" ? 12 : 8;
    
    for (let i = 0; i < affiliateCount; i++) {
      const angle = (i / affiliateCount) * 2 * Math.PI;
      const distance = 15 + Math.random() * 10; // Vary distance from hub
      
      const theta = (90 - hub.lat) * (Math.PI / 180);
      const phi = (hub.lng + 180) * (Math.PI / 180);
      
      // Add some random offset for natural clustering
      const offsetTheta = theta + (Math.random() - 0.5) * 0.3;
      const offsetPhi = phi + (Math.random() - 0.5) * 0.3;
      
      partners.push({
        id: `affiliate-${hubIndex}-${i}`,
        x: 50 + (35 + Math.cos(angle) * distance) * Math.sin(offsetTheta) * Math.cos(offsetPhi),
        y: 50 + (35 + Math.sin(angle) * distance) * Math.sin(offsetTheta) * Math.sin(offsetPhi),
        z: (35 + Math.sin(angle) * distance * 0.5) * Math.cos(offsetTheta),
        type: "affiliate",
        isHub: false,
        hubId: `hub-${hubIndex}`,
        region: hub.region,
        performance: Math.random() * 0.6 + 0.3,
        commissionFlow: Math.random() * 200 + 50,
        delay: hubIndex * 0.3 + i * 0.1
      });
    }
  });

  return partners;
};

// Generate commission and referral flow connections
const generatePartnerConnections = (partners: any[]) => {
  const connections = [];
  const hubs = partners.filter(p => p.isHub);
  const affiliates = partners.filter(p => !p.isHub);

  // Hub-to-hub connections (major network links)
  for (let i = 0; i < hubs.length; i++) {
    for (let j = i + 1; j < hubs.length; j++) {
      connections.push({
        id: `hub-${i}-${j}`,
        from: hubs[i],
        to: hubs[j],
        type: "major",
        flowType: "commission",
        strength: 0.8 + Math.random() * 0.2,
        delay: Math.random() * 2
      });
    }
  }

  // Affiliate-to-hub connections (referral flows)
  affiliates.forEach(affiliate => {
    const hub = partners.find(p => p.id === affiliate.hubId);
    if (hub) {
      connections.push({
        id: `${affiliate.id}-${hub.id}`,
        from: affiliate,
        to: hub,
        type: "referral",
        flowType: "client",
        strength: affiliate.performance,
        delay: affiliate.delay
      });
    }
  });

  return connections;
};

export const GlobalNetworkAnimation = ({ disabled = false }: GlobalNetworkAnimationProps) => {
  const isMobile = useIsMobile();
  const { reducedAnimations, adaptivePerformance, triggerHapticFeedback, supportsTouch, hapticFeedback } = useMobileOptimizations();
  const { duration, ease, enableComplexAnimations } = useMobileAnimationConfig();
  
  // Mobile-specific configurations
  const mobileConfig = {
    hubTouchTargetSize: 44, // Minimum touch target size
    enhancedStrokeWidth: isMobile ? 3 : 2,
    enhancedGlowRadius: isMobile ? 8 : 5,
    optimizedAnimationDuration: isMobile ? duration * 0.8 : duration
  };
  
  // Auto-disable on very low performance devices
  const shouldDisable = disabled || (isMobile && reducedAnimations);
  
  if (shouldDisable) {
    return (
    <div className="absolute -inset-8 overflow-visible opacity-40 flex items-center justify-center">
        <div className={`relative ${isMobile ? 'w-[100vw] h-[100vw] max-w-[400px] max-h-[400px]' : 'w-[120vw] h-[120vw] max-w-[700px] max-h-[700px] lg:w-[800px] lg:h-[800px]'}`}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            <defs>
              <radialGradient id="staticAffiliateGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(258, 73%, 51%)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(258, 100%, 72%)" stopOpacity="0.3" />
              </radialGradient>
            </defs>
            
            {generatePartnerNetwork().map((partner) => (
              <circle
                key={partner.id}
                cx={`${partner.x}%`}
                cy={`${partner.y}%`}
                r={partnerTypes[partner.type].size}
                fill="url(#staticAffiliateGradient)"
                opacity="0.5"
              />
            ))}
          </svg>
          <div className="absolute -inset-4 rounded-full bg-accent/10 blur-xl" />
        </div>
      </div>
    );
  }

  const partners = generatePartnerNetwork();
  const connections = generatePartnerConnections(partners);
  
  // Reduce complexity on mobile
  const mobilePartners = isMobile ? partners.slice(0, Math.floor(partners.length * 0.6)) : partners;
  const mobileConnections = isMobile ? connections.slice(0, Math.floor(connections.length * 0.5)) : connections;

  return (
    <div className={`absolute overflow-visible flex items-center justify-center ${isMobile ? '-inset-8' : '-inset-16'}`}>
      {/* Background glow effects - simplified on mobile */}
      {enableComplexAnimations && (
        <>
          <motion.div
            className={`absolute top-1/4 left-1/4 rounded-full blur-3xl ${isMobile ? 'w-32 h-32' : 'w-64 h-64'}`}
            style={{
              background: `radial-gradient(circle at center, hsl(var(--accent) / 0.2), transparent)`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: duration * 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className={`absolute bottom-1/4 right-1/4 rounded-full blur-3xl ${isMobile ? 'w-32 h-32' : 'w-64 h-64'}`}
            style={{
              background: `radial-gradient(circle at center, hsl(var(--primary) / 0.15), transparent)`
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: duration * 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </>
      )}

      {/* Main Partner Network Container */}
      <div className="relative">
        <motion.div
          className={`relative ${isMobile ? 'w-[100vw] h-[100vw] max-w-[400px] max-h-[400px]' : 'w-[120vw] h-[120vw] max-w-[700px] max-h-[700px] lg:w-[800px] lg:h-[800px]'}`}
          animate={enableComplexAnimations ? { rotate: 360 } : {}}
          transition={{
            duration: isMobile ? 240 : 180,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Partner Network SVG */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
            <defs>
              {/* Affiliate gradients */}
              <radialGradient id="affiliateGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(258, 73%, 51%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(258, 73%, 61%)" stopOpacity="0.6" />
              </radialGradient>
              <radialGradient id="ibGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(258, 100%, 72%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(258, 100%, 82%)" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id="regionalGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(258, 100%, 58%)" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(258, 100%, 68%)" stopOpacity="0.9" />
              </radialGradient>
              
              {/* Network connection gradients */}
              <linearGradient id="primaryFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="interHubGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="returnFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.3" />
              </linearGradient>
              <radialGradient id="enhancedHubGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
              </radialGradient>
              
              {/* Original flow gradients for existing connections */}
              <linearGradient id="commissionFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="clientFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            
            {/* Organized Network Connections */}
            {/* Layer 1: Primary Hub-to-Hub Backbone (Strongest Visual) */}
            {partners.filter(p => p.type === 'regional').map((hub, index) => {
              const regionalHubs = partners.filter(p => p.type === 'regional');
              const nextIndex = (index + 1) % regionalHubs.length;
              
              // Only show subset on mobile for clarity
              if (isMobile && index >= 3) return null;
              
              return (
                <g key={`backbone-${hub.id}`}>
                  {/* Primary ring connection */}
                  <motion.line
                    x1={`${hub.x}%`}
                    y1={`${hub.y}%`}
                    x2={`${regionalHubs[nextIndex].x}%`}
                    y2={`${regionalHubs[nextIndex].y}%`}
                    stroke="url(#primaryFlow)"
                    strokeWidth={mobileConfig.enhancedStrokeWidth}
                    opacity="0.9"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: [0, 1, 0.3],
                      opacity: [0.5, 0.9, 0.6]
                    }}
                    transition={{
                      duration: 6,
                      delay: index * 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Cross connections (star pattern) */}
                  {!isMobile && index < Math.floor(regionalHubs.length / 2) && (
                    <motion.line
                      x1={`${hub.x}%`}
                      y1={`${hub.y}%`}
                      x2={`${regionalHubs[index + Math.floor(regionalHubs.length / 2)].x}%`}
                      y2={`${regionalHubs[index + Math.floor(regionalHubs.length / 2)].y}%`}
                      stroke="url(#interHubGradient)"
                      strokeWidth="2"
                      opacity="0.6"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: [0, 1],
                        opacity: [0.3, 0.7, 0.4]
                      }}
                      transition={{
                        duration: 8,
                        delay: index * 1.2 + 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Backbone flow particles */}
                  <motion.circle
                    r="3"
                    fill="hsl(var(--primary))"
                    initial={{
                      cx: `${hub.x}%`,
                      cy: `${hub.y}%`,
                      opacity: 0
                    }}
                    animate={{
                      cx: [`${hub.x}%`, `${regionalHubs[nextIndex].x}%`],
                      cy: [`${hub.y}%`, `${regionalHubs[nextIndex].y}%`],
                      opacity: [0, 1, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      delay: index * 0.8 + 1,
                      repeat: Infinity,
                      repeatDelay: 8,
                      ease: "easeOut"
                    }}
                  />
                </g>
              );
            })}
            
            {/* Layer 2: Regional Affiliate Connections (Secondary Visual) */}
            {partners.filter(p => p.type === 'regional').map((hub, hubIndex) => {
              const affiliatesInSector = partners
                .filter(p => p.type === 'affiliate')
                .filter((_, index) => index % partners.filter(p => p.type === 'regional').length === hubIndex)
                .slice(0, isMobile ? 2 : 3); // Limit for clarity
              
              return affiliatesInSector.map((affiliate, affIndex) => (
                <g key={`sector-${hub.id}-${affiliate.id}`}>
                  <motion.line
                    x1={`${affiliate.x}%`}
                    y1={`${affiliate.y}%`}
                    x2={`${hub.x}%`}
                    y2={`${hub.y}%`}
                    stroke="url(#clientFlow)"
                    strokeWidth="1"
                    opacity="0.4"
                    strokeLinecap="round"
                    strokeDasharray="2,2"
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: [0, 1],
                      opacity: [0.2, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 5,
                      delay: hubIndex * 2 + affIndex * 0.5 + 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Subtle flow particles */}
                  <motion.circle
                    r="1.5"
                    fill="hsl(var(--accent))"
                    initial={{
                      cx: `${affiliate.x}%`,
                      cy: `${affiliate.y}%`,
                      opacity: 0
                    }}
                    animate={{
                      cx: [`${affiliate.x}%`, `${hub.x}%`],
                      cy: [`${affiliate.y}%`, `${hub.y}%`],
                      opacity: [0, 0.7, 0]
                    }}
                    transition={{
                      duration: 3,
                      delay: hubIndex * 2 + affIndex * 0.5 + 6,
                      repeat: Infinity,
                      repeatDelay: 12,
                      ease: "easeInOut"
                    }}
                  />
                </g>
              ));
            })}
            
            {/* Partner nodes */}
            {mobilePartners.map((partner) => {
              const gradientId = partner.type === "affiliate" ? "affiliateGradient" 
                              : partner.type === "ib" ? "ibGradient" 
                              : "regionalGradient";
              
              return (
                <g key={partner.id}>
                  {/* Main partner node */}
                  <motion.circle
                    cx={`${partner.x}%`}
                    cy={`${partner.y}%`}
                    r={partnerTypes[partner.type].size}
                    fill={`url(#${gradientId})`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 3,
                      delay: partner.delay,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      filter: `drop-shadow(0 0 6px ${partnerTypes[partner.type].color})`
                    }}
                  />
                  
                  {/* Success bursts for high performers */}
                  {partner.performance > 0.7 && (
                    <motion.circle
                      cx={`${partner.x}%`}
                      cy={`${partner.y}%`}
                      r={partnerTypes[partner.type].size}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="1.5"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{
                        scale: [1, 2.5, 1],
                        opacity: [0.8, 0, 0.8]
                      }}
                      transition={{
                        duration: 4,
                        delay: partner.delay + Math.random() * 2,
                        repeat: Infinity,
                        repeatDelay: 8,
                        ease: "easeOut"
                      }}
                    />
                  )}
                  
                  {/* Hub pulse effects */}
                  {partner.isHub && (
                    <motion.circle
                      cx={`${partner.x}%`}
                      cy={`${partner.y}%`}
                      r={partnerTypes[partner.type].size + 2}
                      fill="none"
                      stroke={partnerTypes[partner.type].color}
                      strokeWidth="2"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{
                        scale: [1, 3, 1],
                        opacity: [0.6, 0, 0.6]
                      }}
                      transition={{
                        duration: 3,
                        delay: partner.delay,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Atmospheric effects */}
          <motion.div
            className="absolute -inset-8 rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle at center, hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), transparent)`
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Orbital partnership indicators - reduced on mobile */}
        {(isMobile ? [60] : [45, 60, 75]).map((radius, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 rounded-full border border-primary/30"
            style={{
              width: `${radius}%`,
              height: `${radius}%`,
              left: `${50 - (radius / 2)}%`,
              top: `${50 - (radius / 2)}%`,
            }}
            animate={{ 
              rotate: index % 2 === 0 ? 360 : -360,
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              rotate: {
                duration: 90 + index * 20,
                repeat: Infinity,
                ease: "linear",
              },
              opacity: {
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          />
        ))}

        {/* Enhanced Regional Network Hub System */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <linearGradient id="hubConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="interRegionalFlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="returnFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.5" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          {/* Regional hub network connections */}
          {(isMobile 
            ? [
                { region: "Americas", angle: 0, icon: TrendingUp },
                { region: "Europe", angle: 120, icon: Building2 },
                { region: "Asia", angle: 240, icon: Globe }
              ]
            : [
                { region: "Americas", angle: 0, icon: TrendingUp },
                { region: "Europe", angle: 72, icon: Building2 },
                { region: "Asia", angle: 144, icon: Globe },
                { region: "MENA", angle: 216, icon: DollarSign },
                { region: "Oceania", angle: 288, icon: Zap }
              ]
          ).map((hub, index) => {
            const angle = hub.angle * (Math.PI / 180);
            const hubRadius = isMobile ? 35 : 42;
            const x = 50 + hubRadius * Math.cos(angle);
            const y = 50 + hubRadius * Math.sin(angle);
            
            const regionalHubs = isMobile 
              ? [
                  { region: "Americas", angle: 0, icon: TrendingUp },
                  { region: "Europe", angle: 120, icon: Building2 },
                  { region: "Asia", angle: 240, icon: Globe }
                ]
              : [
                  { region: "Americas", angle: 0, icon: TrendingUp },
                  { region: "Europe", angle: 72, icon: Building2 },
                  { region: "Asia", angle: 144, icon: Globe },
                  { region: "MENA", angle: 216, icon: DollarSign },
                  { region: "Oceania", angle: 288, icon: Zap }
                ];
            
            return (
              <g key={hub.region}>
                {/* Primary Earth-to-Hub Connection */}
                <motion.line
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke="url(#hubConnectionGradient)"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0.4, 0.9, 0.6]
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Inter-Regional Hub Connections (Geometric Pattern) */}
                {regionalHubs.map((targetHub, targetIndex) => {
                  if (targetIndex === index) return null;
                  
                  const targetAngle = targetHub.angle * (Math.PI / 180);
                  const targetX = 50 + hubRadius * Math.cos(targetAngle);
                  const targetY = 50 + hubRadius * Math.sin(targetAngle);
                  
                  // Only draw each connection once (from lower index to higher)
                  if (targetIndex <= index) return null;
                  
                  return (
                    <motion.line
                      key={`inter-${index}-${targetIndex}`}
                      x1={`${x}%`}
                      y1={`${y}%`}
                      x2={`${targetX}%`}
                      y2={`${targetY}%`}
                      stroke="url(#interRegionalFlow)"
                      strokeWidth="1.5"
                      opacity="0.6"
                      initial={{ pathLength: 0 }}
                      animate={{
                        pathLength: [0, 1, 0],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{
                        duration: 5,
                        delay: (index + targetIndex) * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}
                
                {/* Return Flow Hub-to-Earth */}
                <motion.line
                  x1={`${x}%`}
                  y1={`${y}%`}
                  x2="50%"
                  y2="50%"
                  stroke="url(#returnFlowGradient)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0.2, 0.5, 0.2]
                  }}
                  transition={{
                    duration: 4,
                    delay: index * 0.4 + 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Primary Data Flow Particles (Earth to Hub) */}
                <motion.circle
                  r="3"
                  fill="hsl(var(--primary))"
                  initial={{
                    cx: "50%",
                    cy: "50%",
                    opacity: 0
                  }}
                  animate={{
                    cx: ["50%", `${x}%`],
                    cy: ["50%", `${y}%`],
                    opacity: [0, 1, 0.7]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: index * 0.5,
                    repeat: Infinity,
                    repeatDelay: 6,
                    ease: "easeOut"
                  }}
                />
                
                {/* Inter-Regional Flow Particles */}
                {regionalHubs.map((targetHub, targetIndex) => {
                  if (targetIndex === index || targetIndex <= index) return null;
                  
                  const targetAngle = targetHub.angle * (Math.PI / 180);
                  const targetX = 50 + hubRadius * Math.cos(targetAngle);
                  const targetY = 50 + hubRadius * Math.sin(targetAngle);
                  
                  return (
                    <motion.circle
                      key={`inter-particle-${index}-${targetIndex}`}
                      r="2"
                      fill="hsl(var(--accent))"
                      initial={{
                        cx: `${x}%`,
                        cy: `${y}%`,
                        opacity: 0
                      }}
                      animate={{
                        cx: [`${x}%`, `${targetX}%`],
                        cy: [`${y}%`, `${targetY}%`],
                        opacity: [0, 0.8, 0]
                      }}
                      transition={{
                        duration: 3,
                        delay: (index + targetIndex) * 0.7 + 2,
                        repeat: Infinity,
                        repeatDelay: 10,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}
                
                {/* Return Flow Particles (Hub to Earth) */}
                <motion.circle
                  r="2"
                  fill="hsl(var(--muted-foreground))"
                  initial={{
                    cx: `${x}%`,
                    cy: `${y}%`,
                    opacity: 0
                  }}
                  animate={{
                    cx: [`${x}%`, "50%"],
                    cy: [`${y}%`, "50%"],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{
                    duration: 3.5,
                    delay: index * 0.5 + 3,
                    repeat: Infinity,
                    repeatDelay: 8,
                    ease: "easeIn"
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Regional Hub Icons */}
        {(isMobile 
          ? [
              { region: "Americas", angle: 0, icon: TrendingUp },
              { region: "Europe", angle: 120, icon: Building2 },
              { region: "Asia", angle: 240, icon: Globe }
            ]
          : [
              { region: "Americas", angle: 0, icon: TrendingUp },
              { region: "Europe", angle: 72, icon: Building2 },
              { region: "Asia", angle: 144, icon: Globe },
              { region: "MENA", angle: 216, icon: DollarSign },
              { region: "Oceania", angle: 288, icon: Zap }
            ]
        ).map((hub, index) => {
          const angle = hub.angle * (Math.PI / 180);
          const hubRadius = isMobile ? 35 : 42;
          const x = 50 + hubRadius * Math.cos(angle);
          const y = 50 + hubRadius * Math.sin(angle);
          
          return (
            <div key={hub.region}>

              {/* Regional hub icon with enhanced glow */}
              <motion.div
                className="absolute z-10 flex items-center justify-center rounded-full border-2 border-primary/40 bg-background/80 backdrop-blur-sm shadow-2xl"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: isMobile ? `${mobileConfig.hubTouchTargetSize}px` : "40px",
                  height: isMobile ? `${mobileConfig.hubTouchTargetSize}px` : "40px",
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 ${mobileConfig.enhancedGlowRadius * 2.5}px hsl(var(--primary) / 0.4), 0 0 ${mobileConfig.enhancedGlowRadius * 5}px hsl(var(--accent) / 0.2)`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 4,
                  delay: index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.2 }}
                onTap={() => {
                  if (hapticFeedback && supportsTouch) {
                    triggerHapticFeedback('light');
                  }
                }}
              >
                {/* Hub pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/60"
                  animate={{
                    scale: [1, 2.5, 1],
                    opacity: [0.8, 0, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 0.3,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                
                <hub.icon 
                  className="text-primary" 
                  size={isMobile ? 16 : 20} 
                />
              </motion.div>

              {/* Hub label */}
              <motion.div
                className="absolute z-20 text-xs font-medium text-primary/80 whitespace-nowrap"
                style={{
                  left: `${x}%`,
                  top: `${y + (isMobile ? 6 : 8)}%`,
                  transform: "translate(-50%, 0)"
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0.7, 1, 0.7], y: 0 }}
                transition={{
                  duration: 3,
                  delay: index * 0.3 + 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {hub.region}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};