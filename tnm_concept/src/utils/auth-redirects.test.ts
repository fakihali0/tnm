import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { trackButtonClick, __analyticsTestUtils } from './auth-redirects';

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

const setMockLocalStorage = (mock: Partial<Storage>) => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: mock
  });
};

describe('trackButtonClick', () => {
  beforeEach(() => {
    __analyticsTestUtils.resetInMemoryClicks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    } else {
      delete (window as unknown as Record<string, unknown>).localStorage;
    }
  });

  it('persists analytics data when localStorage is available', () => {
    const getItem = vi.fn().mockReturnValue('[]');
    const setItem = vi.fn();
    setMockLocalStorage({ 
      getItem, 
      setItem,
      length: 0,
      clear: vi.fn(),
      key: vi.fn(),
      removeItem: vi.fn()
    } as Storage);

    trackButtonClick({ buttonType: 'primary-cta', buttonLocation: 'hero' });

    expect(getItem).toHaveBeenCalledWith('buttonClicks');
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(__analyticsTestUtils.getInMemoryClicks()).toHaveLength(0);
  });

  it('falls back to in-memory storage when localStorage is blocked', () => {
    const getItem = vi.fn(() => {
      throw new Error('Access denied');
    });
    const setItem = vi.fn();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setMockLocalStorage({ 
      getItem, 
      setItem,
      length: 0,
      clear: vi.fn(),
      key: vi.fn(),
      removeItem: vi.fn()
    } as Storage);

    expect(() =>
      trackButtonClick({ buttonType: 'fallback-cta', buttonLocation: 'blocked-storage' })
    ).not.toThrow();

    expect(getItem).toHaveBeenCalledWith('buttonClicks');
    expect(setItem).not.toHaveBeenCalled();
    expect(__analyticsTestUtils.getInMemoryClicks()).toHaveLength(1);
    expect(__analyticsTestUtils.getInMemoryClicks()[0]).toMatchObject({
      buttonType: 'fallback-cta',
      buttonLocation: 'blocked-storage'
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});
