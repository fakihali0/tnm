import React, { useState, useEffect, useMemo } from "react";
import { motion, type Transition } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Navigation, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeatureErrorBoundary } from "@/components/error/FeatureErrorBoundary";
import { ErrorFallback } from "@/components/ui/ErrorFallback";

// Animation
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { 
  createRevealVariants, 
  createStaggerContainer, 
  resolveMotionVariants,
  type RevealDirection 
} from "@/components/animation/variants";

// Components
import { InstrumentHero } from "@/components/instruments/InstrumentHero";
import { StickySubNav } from "@/components/instruments/StickySubNav";
import { FilterSortBar } from "@/components/instruments/FilterSortBar";
import { InstrumentCard } from "@/components/instruments/InstrumentCard";
import { InstrumentTable } from "@/components/instruments/InstrumentTable";
import LiveInstrumentTable from "@/components/instruments/LiveInstrumentTable";
import { InstrumentDetails } from "@/components/instruments/InstrumentDetails";
import { CompareDrawer } from "@/components/instruments/CompareDrawer";
import { CompareTray } from "@/components/instruments/CompareTray";
import { OverviewSection } from "@/components/instruments/OverviewSection";
import { TrustBand } from "@/components/instruments/TrustBand";
import { getScrollBehavior } from "@/utils/scroll";
import { InstrumentCardSkeleton, InstrumentTableSkeleton, LoadingSpinner, LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { LoadingState } from "@/components/ui/loading-states";
import { NoDataEmptyState, NoResultsEmptyState } from "@/components/ui/EmptyState";

// Hooks
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
import { useIsMobile } from "@/hooks/use-mobile";

// Data
import { useRealInstruments, type RealInstrumentData } from "@/hooks/useRealInstruments";

function TradingInstrumentsContent() {
  const { t, i18n } = useTranslation(['common']);

  // Real instruments data
  const { 
    instruments: mockInstruments, 
    isLoading: instrumentsLoading,
    error: instrumentsError,
    refetch,
    getInstrumentsByCategory, 
    searchInstruments, 
    getCategoryCounts 
  } = useRealInstruments();

  // Mobile optimizations
  const { reducedAnimations, adaptivePerformance } = useMobileOptimizations();
  const isMobile = useIsMobile();

  // Animation setup
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation({
    amount: reducedAnimations ? 0.05 : 0.2,
    duration: reducedAnimations ? 0.2 : 0.6,
    delay: reducedAnimations ? 0.05 : 0.1
  });

  // Animation variant factories
  const buildReveal = (direction: RevealDirection = "up", distance = 40, customTransition?: Transition) => 
    resolveMotionVariants(
      createRevealVariants({ direction, distance, transition: customTransition || transition }),
      prefersReducedMotion
    );

  const buildFade = (customTransition?: Transition) =>
    resolveMotionVariants(
      createRevealVariants({ direction: "none", transition: customTransition || transition }),
      prefersReducedMotion
    );

  const buildStagger = (stagger = 0.1, delayChildren = 0.2) =>
    resolveMotionVariants(
      createStaggerContainer({ stagger, delayChildren, enabled: !prefersReducedMotion }),
      prefersReducedMotion
    );

  // Animation variants
  const heroFade = buildFade();
  const heroReveal = buildReveal("up", 30);
  const sectionFade = buildFade({ delay: 0.2, ...transition });
  const cardReveal = buildReveal("up", 20, { delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] });
  const cardStagger = buildStagger(0.08, 0.1);
  const tableReveal = buildReveal("up", 15, { delay: 0.15, duration: 0.5 });
  const controlsSlide = buildReveal("down", 20, { delay: 0.05, duration: 0.4 });

  // Mobile-optimized variants - always provide consistent animation states
  const mobileCardStagger = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0
      }
    }
  };

  const mobileCardReveal = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const mobileTableReveal = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  // State
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedInstrument, setSelectedInstrument] = useState<RealInstrumentData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    assetClasses: [] as string[],
    marketStatus: "all",
    spreadType: "zero" as "zero" | "raw",
    volatility: [] as string[]
  });
  
  const [sortBy, setSortBy] = useState("name-asc");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load saved preferences only after data loads
  useEffect(() => {
    if (!instrumentsLoading && isInitialLoad) {
      const savedFilters = localStorage.getItem("ti-filters");
      const savedViewMode = localStorage.getItem("ti-view-mode");
      const savedFavorites = localStorage.getItem("ti-favorites");
      const savedSort = localStorage.getItem("ti-sort");
      
      if (savedFilters) {
        try {
          setFilters(JSON.parse(savedFilters));
        } catch (e) {
          // Failed to load saved filters, using defaults
        }
      }
      
      if (savedViewMode) {
        setViewMode(savedViewMode as "cards" | "table");
      }
      
      if (savedSort) {
        setSortBy(savedSort);
      }
      
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (e) {
          // Failed to load saved favorites, using defaults
        }
      }
      
      setIsInitialLoad(false);
    }
  }, [instrumentsLoading, isInitialLoad]);

  // Save preferences
  const saveFilters = () => {
    localStorage.setItem("ti-filters", JSON.stringify(filters));
    localStorage.setItem("ti-sort", sortBy);
  };

  const resetFilters = () => {
    setFilters({
      assetClasses: [],
      marketStatus: "all",
      spreadType: "zero",
      volatility: []
    });
    setActiveCategory("all");
    setSearchQuery("");
    setSortBy("name-asc");
  };

  // Filter and sort instruments
  const filteredInstruments = useMemo(() => {
    // Show whatever data we have - don't block on loading state
    if (mockInstruments.length === 0) {
      return [];
    }
    
    let result = [...mockInstruments];

    // Apply search
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      result = result.filter(instrument =>
        instrument.symbol.toLowerCase().includes(lowercaseQuery) ||
        instrument.name.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Apply category filter
    if (activeCategory !== "all") {
      result = result.filter(instrument => instrument.assetClass === activeCategory);
    }

    // Apply asset class filters
    if (filters.assetClasses.length > 0) {
      result = result.filter(instrument => filters.assetClasses.includes(instrument.assetClass));
    }

    // Apply market status filter
    if (filters.marketStatus !== "all") {
      const isOpen = filters.marketStatus === "open";
      result = result.filter(instrument => instrument.isMarketOpen === isOpen);
    }

    // Apply volatility filter
    if (filters.volatility.length > 0) {
      result = result.filter(instrument => 
        instrument.volatility && filters.volatility.includes(instrument.volatility)
      );
    }

    // Add favorites flag while preserving all RealInstrumentData properties
    result = result.map(instrument => ({
      ...instrument,
      isFavorite: favorites.includes(instrument.symbol),
      // Explicitly preserve live data properties to prevent loss during spread
      isLive: instrument.isLive,
      lastUpdate: instrument.lastUpdate,
      currentPrice: instrument.currentPrice
    }));

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.symbol.localeCompare(b.symbol);
        case "name-desc":
          return b.symbol.localeCompare(a.symbol);
        case "spread-asc":
          return a.spread[filters.spreadType] - b.spread[filters.spreadType];
        case "spread-desc":
          return b.spread[filters.spreadType] - a.spread[filters.spreadType];
        case "leverage-desc":
          return b.leverage - a.leverage;
        case "leverage-asc":
          return a.leverage - b.leverage;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, activeCategory, filters, sortBy, favorites, mockInstruments, instrumentsLoading]);

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  // Group instruments by asset class for section display
  const instrumentsByClass = useMemo(() => {
    const groups: { [key: string]: RealInstrumentData[] } = {};
    
    filteredInstruments.forEach(instrument => {
      if (!groups[instrument.assetClass]) {
        groups[instrument.assetClass] = [];
      }
      groups[instrument.assetClass].push(instrument);
    });
    
    return groups;
  }, [filteredInstruments]);

  // Navigation sections
  const navSections = [
    { id: "overview", label: t('instruments.sections.overview') },
    { id: "forex", label: t('instruments.sections.forex') },
    { id: "indices", label: t('instruments.sections.indices') },
    { id: "commodities", label: t('instruments.sections.commodities') },
    { id: "crypto", label: t('instruments.sections.crypto') },
    { id: "favorites", label: t('instruments.sections.favorites') }
  ].filter(section => {
    if (section.id === "overview" || section.id === "favorites") return true;
    return instrumentsByClass[section.id]?.length > 0;
  });

  const scrollToResults = (targetCategory?: string) => {
    const delay = 100; // Brief delay to ensure state updates are applied
    setTimeout(() => {
      let targetSectionId: string | undefined;
      
      if (targetCategory && targetCategory !== 'all') {
        // Find the section for this category
        const categorySection = navSections.find(section => 
          section.id === targetCategory || section.id.includes(targetCategory.toLowerCase())
        );
        if (categorySection) {
          targetSectionId = categorySection.id;
        }
      }
      
      // If no specific target or target not found, use first available section
      if (!targetSectionId) {
        const firstDataSection = navSections.find(section => 
          section.id !== 'overview' && section.id !== 'favorites'
        );
        targetSectionId = firstDataSection?.id;
      }
      
      if (targetSectionId) {
        const element = document.getElementById(targetSectionId);
        if (element) {
          const offsetTop = element.offsetTop - 180; // Account for sticky elements
          window.scrollTo({
            top: offsetTop,
            behavior: getScrollBehavior()
          });
          setActiveSection(targetSectionId);
        }
      }
    }, delay);
  };

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    scrollToResults();
    // Analytics
    if (query.trim()) {
      // trackEvent('ti_search', { query });
    }
  };

  const handleFilterByCategory = (category: string) => {
    setActiveCategory(category);
    scrollToResults(category);
    // Analytics
    // trackEvent('ti_filter_category', { category });
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    localStorage.setItem("ti-filters", JSON.stringify(newFilters));
    // Analytics
    // trackEvent('ti_filter_apply', { filters: newFilters });
  };

  const handleDetails = (instrument: RealInstrumentData) => {
    setSelectedInstrument(instrument);
    setDetailsOpen(true);
    // Analytics
    // trackEvent('ti_details_open', { symbol: instrument.symbol });
  };

  const handleCompare = (instrument: RealInstrumentData) => {
    const isInCompare = compareList.includes(instrument.symbol);
    
    if (isInCompare) {
      setCompareList(prev => prev.filter(symbol => symbol !== instrument.symbol));
    } else if (compareList.length < 4) {
      setCompareList(prev => [...prev, instrument.symbol]);
    }
    
    // Analytics
    // trackEvent('ti_compare_toggle', { 
    //   symbol: instrument.symbol, 
    //   action: isInCompare ? 'remove' : 'add',
    //   totalInCompare: isInCompare ? compareList.length - 1 : compareList.length + 1
    // });
  };

  const handleToggleFavorite = (symbol: string) => {
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter(fav => fav !== symbol)
      : [...favorites, symbol];
    
    setFavorites(newFavorites);
    localStorage.setItem("ti-favorites", JSON.stringify(newFavorites));
    
    // Analytics
    // trackEvent('ti_favorite_toggle', { 
    //   symbol, 
    //   action: favorites.includes(symbol) ? 'remove' : 'add' 
    // });
  };

  const handleOpenCompare = () => {
    setCompareOpen(true);
    // Analytics
    // trackEvent('ti_compare_open', { compareCount: compareList.length });
  };

  const handleClearCompare = () => {
    setCompareList([]);
    // Analytics
    // trackEvent('ti_compare_clear');
  };

  const categoryCounts = getCategoryCounts();
  const compareInstruments = mockInstruments.filter(inst => compareList.includes(inst.symbol));

  return (
    <Layout>
      {/* SEO Breadcrumbs - Hidden but structured for search engines */}
      <script dangerouslySetInnerHTML={{
        __html: `if(window.addStructuredData){window.addStructuredData({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Products",
              "item": "/products"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Trading Instruments",
              "item": "/products/trading-instruments"
            }
          ]
        });}`
      }} />

      {/* Hero Section */}
      <motion.section
        {...motionProps}
        variants={heroFade}
        transition={transition}
      >
        <InstrumentHero
          onSearch={handleSearch}
          onFilterByCategory={handleFilterByCategory}
          activeCategory={activeCategory}
          categoryCounts={categoryCounts}
        />
      </motion.section>

      {/* Sticky Sub Navigation */}
      <motion.div
        {...motionProps}
        variants={controlsSlide}
        transition={transition}
      >
        <StickySubNav
          sections={navSections}
          activeSection={activeSection}
          onNavigate={setActiveSection}
        />
      </motion.div>

      {/* Filter & Sort Bar */}
      <motion.div
        {...motionProps}
        variants={controlsSlide}
        transition={{ ...transition, delay: (transition.delay || 0) + 0.1 }}
      >
        <FilterSortBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={resetFilters}
          onSaveFilters={saveFilters}
          className="mb-8"
        />
      </motion.div>

      {/* View Toggle & Results Count */}
      <motion.div
        className="container px-4 sm:px-6"
        {...motionProps}
        variants={controlsSlide}
        transition={{ ...transition, delay: (transition.delay || 0) + 0.15 }}
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {t('instruments.results.showing')} {filteredInstruments.length} {t('instruments.results.of')} {mockInstruments.length} {t('instruments.results.instruments')}
            </div>
            {!instrumentsLoading && mockInstruments.length > 0 && (
              <Badge variant={mockInstruments.some(i => i.isLive) ? "default" : "secondary"} className="text-xs">
                {mockInstruments.some(i => i.isLive) ? '🟢 Live Prices' : '📊 Cached Data'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={instrumentsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${instrumentsLoading ? 'animate-spin' : ''}`} />
              {instrumentsLoading ? t('common.loading') : 'Refresh'}
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewMode("cards");
                localStorage.setItem("ti-view-mode", "cards");

                // Analytics
                // trackEvent('ti_view_toggle', { viewMode: 'cards' });
              }}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              {t('instruments.viewMode.cards')}
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setViewMode("table");
                localStorage.setItem("ti-view-mode", "table");

                // Analytics
                // trackEvent('ti_view_toggle', { viewMode: 'table' });
              }}
            >
              <List className="h-4 w-4 mr-2" />
              {t('instruments.viewMode.table')}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overview Section */}
      <motion.section
        {...motionProps}
        variants={sectionFade}
        transition={{ ...transition, delay: (transition.delay || 0) + 0.2 }}
      >
        <OverviewSection />
      </motion.section>

      {/* Error Alert Banner */}
      {instrumentsError && (
        <div className="container px-4 sm:px-6 mt-6">
          <Alert variant="destructive">
            <AlertTitle>Live prices unavailable</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{instrumentsError}</span>
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Instruments by Asset Class */}
      <div className="container px-4 sm:px-6 py-16 space-y-16">
        {instrumentsLoading ? (
          // Loading State
          <div className="space-y-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-8">
                <div className="space-y-2">
                  <LoadingSkeleton width={200} height={32} />
                  <LoadingSkeleton width={300} height={16} />
                </div>
                {viewMode === "cards" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {Array.from({ length: 8 }).map((_, cardIndex) => (
                      <InstrumentCardSkeleton key={cardIndex} />
                    ))}
                  </div>
                ) : (
                  <InstrumentTableSkeleton rows={6} />
                )}
              </div>
            ))}
          </div>
        ) : filteredInstruments.length === 0 ? (
          // No Results or No Data State
          mockInstruments.length > 0 ? (
            <div className="text-center py-16">
              <NoResultsEmptyState 
                searchTerm={searchQuery}
                onClearSearch={() => {
                  setSearchQuery("");
                  resetFilters();
                }}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <NoDataEmptyState 
                title="Unable to load instruments"
                description={instrumentsError || "No instruments available at the moment."}
                onRefresh={handleRefresh}
              />
            </div>
          )
        ) : (
          // Data Loaded State
          Object.entries(instrumentsByClass).map(([assetClass, instruments]) => (
            <motion.section 
              key={assetClass} 
              id={assetClass} 
              className="scroll-mt-32"
              {...motionProps}
              variants={sectionFade}
              initial="visible"
              animate="visible"
              transition={{ ...transition, delay: (transition.delay || 0) + 0.3 }}
            >
              <motion.div 
                className="mb-8"
                variants={heroReveal}
                transition={transition}
              >
                <h2 className="font-poppins text-2xl font-bold mb-2 capitalize">
                  {t(`instruments.sections.${assetClass}`)} ({instruments.length})
                </h2>
                <p className="text-muted-foreground">
                  {t(`instruments.descriptions.${assetClass}`)}
                </p>
              </motion.div>

              {viewMode === "cards" ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  variants={mobileCardStagger}
                  initial="visible"
                  animate="visible"
                  transition={{ duration: 0.1 }}
                >
                  {instruments.map((instrument) => (
                    <motion.div
                      key={instrument.symbol}
                      variants={mobileCardReveal}
                      transition={{ duration: 0.2 }}
                    >
                      <InstrumentCard
                        instrument={instrument}
                        spreadType={filters.spreadType}
                        onDetails={handleDetails}
                        onCompare={handleCompare}
                        onToggleFavorite={handleToggleFavorite}
                        isInCompare={compareList.includes(instrument.symbol)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  variants={mobileTableReveal}
                  initial="visible"
                  animate="visible"
                  transition={{ duration: 0.3 }}
                >
                  <LiveInstrumentTable
                    instruments={instruments}
                    spreadType={filters.spreadType}
                    onDetails={handleDetails}
                    onCompare={handleCompare}
                    onToggleFavorite={handleToggleFavorite}
                    compareList={compareList}
                  />
                </motion.div>
              )}
            </motion.section>
          ))
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <motion.section 
            id="favorites" 
            className="scroll-mt-32"
            {...motionProps}
            variants={sectionFade}
            initial={isMobile || reducedAnimations ? "visible" : undefined}
            animate={isMobile || reducedAnimations ? "visible" : undefined}
            whileInView={isMobile || reducedAnimations ? undefined : "visible"}
            transition={{ ...transition, delay: (transition.delay || 0) + 0.4 }}
          >
            <motion.div 
              className="mb-8"
              variants={heroReveal}
              transition={transition}
            >
              <h2 className="font-poppins text-2xl font-bold mb-2">
                {t('instruments.favorites.title')} ({favorites.length})
              </h2>
              <p className="text-muted-foreground">
                {t('instruments.favorites.description')}
              </p>
            </motion.div>

            {viewMode === "cards" ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                variants={isMobile || reducedAnimations ? mobileCardStagger : cardStagger}
                initial={isMobile || reducedAnimations ? "visible" : "hidden"}
                animate={isMobile || reducedAnimations ? "visible" : undefined}
                whileInView={isMobile || reducedAnimations ? undefined : "visible"}
                viewport={isMobile || reducedAnimations ? undefined : { amount: 0.15, once: true }}
                transition={isMobile || reducedAnimations ? { duration: 0.1 } : transition}
              >
                {mockInstruments
                  .filter(inst => favorites.includes(inst.symbol))
                  .map((instrument) => (
                    <motion.div
                      key={instrument.symbol}
                      variants={isMobile || reducedAnimations ? mobileCardReveal : cardReveal}
                      transition={isMobile || reducedAnimations ? { duration: 0.2 } : transition}
                    >
                      <InstrumentCard
                        instrument={{ ...instrument, isFavorite: true }}
                        spreadType={filters.spreadType}
                        onDetails={handleDetails}
                        onCompare={handleCompare}
                        onToggleFavorite={handleToggleFavorite}
                        isInCompare={compareList.includes(instrument.symbol)}
                      />
                    </motion.div>
                  ))}
              </motion.div>
            ) : (
              <motion.div
                variants={isMobile || reducedAnimations ? mobileTableReveal : tableReveal}
                initial={isMobile || reducedAnimations ? "visible" : "hidden"}
                animate={isMobile || reducedAnimations ? "visible" : undefined}
                whileInView={isMobile || reducedAnimations ? undefined : "visible"}
                viewport={isMobile || reducedAnimations ? undefined : { amount: 0.15, once: true }}
                transition={isMobile || reducedAnimations ? { duration: 0.3 } : transition}
              >
                <LiveInstrumentTable
                  instruments={mockInstruments
                    .filter(inst => favorites.includes(inst.symbol))
                    .map(inst => ({ ...inst, isFavorite: true }))}
                  spreadType={filters.spreadType}
                  onDetails={handleDetails}
                  onCompare={handleCompare}
                  onToggleFavorite={handleToggleFavorite}
                  compareList={compareList}
                />
              </motion.div>
            )}
          </motion.section>
        )}
      </div>

      {/* Trust & Compliance Band */}
      <motion.section
        {...motionProps}
        variants={sectionFade}
        transition={{ ...transition, delay: (transition.delay || 0) + 0.5 }}
      >
        <TrustBand />
      </motion.section>

      {/* Compare Tray */}
      <CompareTray
        compareList={compareList}
        onRemove={(symbol) => setCompareList(prev => prev.filter(s => s !== symbol))}
        onCompare={handleOpenCompare}
        onClear={handleClearCompare}
      />

      {/* Details Drawer */}
      <InstrumentDetails
        instrument={selectedInstrument}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        spreadType={filters.spreadType}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Compare Drawer */}
      <CompareDrawer
        instruments={compareInstruments}
        open={compareOpen}
        onOpenChange={setCompareOpen}
        onRemove={(symbol) => setCompareList(prev => prev.filter(s => s !== symbol))}
        spreadType={filters.spreadType}
      />
    </Layout>
  );
}

// Error boundary wrapper
export default function TradingInstruments() {
  return (
    <FeatureErrorBoundary 
      featureName="Trading Instruments"
      fallback={({ error, retry }) => (
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <ErrorFallback 
              error={error} 
              resetError={retry}
              variant="page"
              customMessage="Unable to load trading instruments. This might be due to a connection issue or temporary service unavailability."
            />
          </div>
        </Layout>
      )}
    >
      <TradingInstrumentsContent />
    </FeatureErrorBoundary>
  );
}