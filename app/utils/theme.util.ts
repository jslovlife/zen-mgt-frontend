/* ==========================================================================
   THEME UTILITY - Manage client themes and design tokens
   ========================================================================== */

export type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  cssFile: string;
  preview: {
    primary: string;
    secondary: string;
    background: string;
  };
};

export const AVAILABLE_THEMES: Record<string, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default Theme',
    description: 'Clean and modern purple theme',
    cssFile: '', // No additional CSS file needed
    preview: {
      primary: '#9333ea',
      secondary: '#0284c7',
      background: '#f9fafb',
    },
  },
  'client-a': {
    id: 'client-a',
    name: 'Client A - Creative',
    description: 'Purple and orange creative theme',
    cssFile: '/styles/themes/client-a.css',
    preview: {
      primary: '#d946ef',
      secondary: '#f97316',
      background: '#fef7ff',
    },
  },
  'client-b': {
    id: 'client-b',
    name: 'Client B - Corporate',
    description: 'Professional blue and gray theme',
    cssFile: '/styles/themes/client-b.css',
    preview: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      background: '#f8fafc',
    },
  },
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'default';
  private themeStyleElement: HTMLStyleElement | null = null;

  private constructor() {
    // Initialize with saved theme or default
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme && AVAILABLE_THEMES[savedTheme]) {
        this.currentTheme = savedTheme;
      }
    }
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Get the current active theme
   */
  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * Get theme configuration by ID
   */
  public getThemeConfig(themeId: string): ThemeConfig | null {
    return AVAILABLE_THEMES[themeId] || null;
  }

  /**
   * Get all available themes
   */
  public getAllThemes(): ThemeConfig[] {
    return Object.values(AVAILABLE_THEMES);
  }

  /**
   * Switch to a different theme
   */
  public async switchTheme(themeId: string): Promise<boolean> {
    if (!AVAILABLE_THEMES[themeId]) {
      console.error(`Theme "${themeId}" not found`);
      return false;
    }

    try {
      // Remove existing theme CSS
      this.removeThemeCSS();

      // Load new theme CSS if needed
      if (themeId !== 'default') {
        await this.loadThemeCSS(AVAILABLE_THEMES[themeId].cssFile);
      }

      // Update current theme
      this.currentTheme = themeId;

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-theme', themeId);
      }

      // Dispatch theme change event
      this.dispatchThemeChangeEvent(themeId);

      console.log(`Theme switched to: ${AVAILABLE_THEMES[themeId].name}`);
      return true;
    } catch (error) {
      console.error('Failed to switch theme:', error);
      return false;
    }
  }

  /**
   * Load theme CSS file
   */
  private async loadThemeCSS(cssFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      // Create link element for theme CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssFile;
      link.id = 'theme-css';
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load theme CSS: ${cssFile}`));
      
      // Add to head
      document.head.appendChild(link);
      this.themeStyleElement = link;
    });
  }

  /**
   * Remove current theme CSS
   */
  private removeThemeCSS(): void {
    if (typeof window === 'undefined') return;

    const existingThemeCSS = document.getElementById('theme-css');
    if (existingThemeCSS) {
      existingThemeCSS.remove();
    }
    this.themeStyleElement = null;
  }

  /**
   * Dispatch theme change event for components to listen to
   */
  private dispatchThemeChangeEvent(themeId: string): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('themeChanged', {
      detail: { themeId, themeConfig: AVAILABLE_THEMES[themeId] }
    });
    window.dispatchEvent(event);
  }

  /**
   * Initialize theme on app startup
   */
  public async initializeTheme(): Promise<void> {
    if (this.currentTheme !== 'default') {
      await this.switchTheme(this.currentTheme);
    }
  }

  /**
   * Get CSS custom property value
   */
  public getCSSVariable(variableName: string): string {
    if (typeof window === 'undefined') return '';
    
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }

  /**
   * Set CSS custom property value
   */
  public setCSSVariable(variableName: string, value: string): void {
    if (typeof window === 'undefined') return;
    
    document.documentElement.style.setProperty(variableName, value);
  }

  /**
   * Reset all custom CSS variables
   */
  public resetCSSVariables(): void {
    if (typeof window === 'undefined') return;
    
    document.documentElement.removeAttribute('style');
  }
}

/**
 * Hook for React components to use theme manager
 */
export function useTheme() {
  const themeManager = ThemeManager.getInstance();
  
  return {
    currentTheme: themeManager.getCurrentTheme(),
    availableThemes: themeManager.getAllThemes(),
    switchTheme: (themeId: string) => themeManager.switchTheme(themeId),
    getThemeConfig: (themeId: string) => themeManager.getThemeConfig(themeId),
    getCSSVariable: (variableName: string) => themeManager.getCSSVariable(variableName),
    setCSSVariable: (variableName: string, value: string) => themeManager.setCSSVariable(variableName, value),
  };
}

/**
 * Environment-based theme selection
 */
export function getThemeForEnvironment(): string {
  if (typeof window === 'undefined') return 'default';
  
  // You can implement logic to determine theme based on:
  // - URL subdomain (client-a.yourapp.com)
  // - Environment variables
  // - User preferences
  // - Database configuration
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('client-a') || hostname.includes('creative')) {
    return 'client-a';
  }
  
  if (hostname.includes('client-b') || hostname.includes('corporate')) {
    return 'client-b';
  }
  
  return 'default';
}

/**
 * Generate theme preview component data
 */
export function generateThemePreview(themeId: string) {
  const theme = AVAILABLE_THEMES[themeId];
  if (!theme) return null;
  
  return {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    colors: theme.preview,
    isActive: ThemeManager.getInstance().getCurrentTheme() === themeId,
  };
} 