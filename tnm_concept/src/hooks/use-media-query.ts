import * as React from "react";

type MediaQueryChangeEvent = MediaQueryListEvent | MediaQueryList;

const canMatchMedia = (query: string) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia(query).matches;
  } catch (error) {
    console.warn("matchMedia query not supported", error);
    return false;
  }
};

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() => canMatchMedia(query));

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    let mediaQuery: MediaQueryList;

    try {
      mediaQuery = window.matchMedia(query);
    } catch (error) {
      console.warn("matchMedia query not supported", error);
      return;
    }

    const handleChange = (event: MediaQueryChangeEvent) => {
      if ("matches" in event) {
        setMatches(event.matches);
      } else {
        setMatches(mediaQuery.matches);
      }
    };

    handleChange(mediaQuery);

    const supportsModernListener = typeof mediaQuery.addEventListener === "function";
    const supportsLegacyListener = typeof mediaQuery.addListener === "function";

    if (supportsModernListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else if (supportsLegacyListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (supportsModernListener && typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else if (!supportsModernListener && supportsLegacyListener && typeof mediaQuery.removeListener === "function") {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
