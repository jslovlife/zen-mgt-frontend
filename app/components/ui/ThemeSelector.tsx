import { useState, useEffect } from "react";
import { useTheme, generateThemePreview } from "~/utils/theme.util";

interface ThemeSelectorProps {
  className?: string;
  showPreview?: boolean;
}

export function ThemeSelector({ className = "", showPreview = true }: ThemeSelectorProps) {
  const { currentTheme, availableThemes, switchTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    if (themeId === currentTheme) return;
    
    setIsLoading(true);
    try {
      await switchTheme(themeId);
    } catch (error) {
      console.error("Failed to switch theme:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const currentThemeConfig = availableThemes.find(theme => theme.id === currentTheme);

  return (
    <div className={`relative ${className}`}>
      {/* Theme Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        disabled={isLoading}
      >
        {/* Current Theme Color Preview */}
        <div className="flex space-x-1">
          <div 
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: currentThemeConfig?.preview.primary }}
          />
          <div 
            className="w-3 h-3 rounded-full border border-gray-300"
            style={{ backgroundColor: currentThemeConfig?.preview.secondary }}
          />
        </div>
        
        <span>{currentThemeConfig?.name || "Theme"}</span>
        
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
        ) : (
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Theme</h3>
            
            <div className="space-y-3">
              {availableThemes.map((theme) => {
                const isActive = theme.id === currentTheme;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {/* Theme Color Preview */}
                          {showPreview && (
                            <div className="flex space-x-1">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: theme.preview.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: theme.preview.secondary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: theme.preview.background }}
                              />
                            </div>
                          )}
                          
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {theme.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {theme.description}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-indigo-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/* Compact Theme Selector for smaller spaces */
export function CompactThemeSelector({ className = "" }: { className?: string }) {
  const { currentTheme, availableThemes, switchTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const themeId = event.target.value;
    if (themeId === currentTheme) return;
    
    setIsLoading(true);
    try {
      await switchTheme(themeId);
    } catch (error) {
      console.error("Failed to switch theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentTheme}
        onChange={handleThemeChange}
        disabled={isLoading}
        className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
      >
        {availableThemes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
        </div>
      )}
    </div>
  );
}

/* Theme Preview Card for settings pages */
export function ThemePreviewCard({ themeId }: { themeId: string }) {
  const { currentTheme, switchTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  const preview = generateThemePreview(themeId);
  if (!preview) return null;

  const handleSelect = async () => {
    if (preview.isActive) return;
    
    setIsLoading(true);
    try {
      await switchTheme(themeId);
    } catch (error) {
      console.error("Failed to switch theme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
        preview.isActive
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-20"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={handleSelect}
    >
      {/* Theme Preview */}
      <div className="mb-3">
        <div className="flex space-x-2 mb-2">
          <div 
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: preview.colors.primary }}
          />
          <div 
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: preview.colors.secondary }}
          />
          <div 
            className="w-8 h-8 rounded border border-gray-300"
            style={{ backgroundColor: preview.colors.background }}
          />
        </div>
      </div>

      {/* Theme Info */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">{preview.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{preview.description}</p>
      </div>

      {/* Status Indicator */}
      <div className="absolute top-2 right-2">
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
        ) : preview.isActive ? (
          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  );
} 