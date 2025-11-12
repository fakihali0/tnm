import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { canonicalizeHash } from '@/utils/hash';
import { getScrollBehavior } from '@/utils/scroll';

export function ScrollToHash() {
  const location = useLocation();
  const preserveScroll = location.state?.preserveScroll;

  useEffect(() => {
    if (location.hash) {
      // Longer delay to ensure widgets like TradingView have time to load and render
      setTimeout(() => {
        const rawHash = location.hash.slice(1);
        const canonicalHash = canonicalizeHash(rawHash);
        const candidates = [canonicalHash];

        if (!candidates.includes(rawHash)) {
          candidates.push(rawHash);
        }

        try {
          const decodedHash = decodeURIComponent(rawHash);
          if (decodedHash && !candidates.includes(decodedHash)) {
            candidates.push(decodedHash);
          }
        } catch (error) {
          // ignore decoding errors and fall back to canonical/original hashes
        }

        for (const id of candidates) {
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({
              behavior: getScrollBehavior(),
              block: 'start'
            });
            break;
          }
        }
      }, 300);
    } else if (!preserveScroll) {
      // No hash and no scroll preservation request, scroll to top of page
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() });
      }, 100);
    }
  }, [location]);

  return null;
}