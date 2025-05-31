import { ThemeSelector, ThemePreviewCard } from "~/components/ui/ThemeSelector";
import { useTheme } from "~/utils/theme.util";

export default function ThemeDemo() {
  const { availableThemes } = useTheme();

  return (
    <div className="theme-demo-container">
      <div className="theme-demo-header">
        <h1 className="demo-title">Design System & Theme Demo</h1>
        <p className="demo-subtitle">
          Explore our comprehensive design system with multiple client themes
        </p>
        
        {/* Theme Selector */}
        <div className="theme-selector-container">
          <ThemeSelector />
        </div>
      </div>

      {/* Theme Preview Cards */}
      <section className="theme-previews">
        <h2 className="section-title">Available Themes</h2>
        <div className="theme-grid">
          {availableThemes.map((theme) => (
            <ThemePreviewCard key={theme.id} themeId={theme.id} />
          ))}
        </div>
      </section>

      {/* Design Token Examples */}
      <section className="design-tokens-demo">
        <h2 className="section-title">Design Tokens in Action</h2>
        
        {/* Color Palette */}
        <div className="demo-section">
          <h3 className="subsection-title">Color Palette</h3>
          <div className="color-grid">
            <div className="color-swatch primary">
              <div className="color-box"></div>
              <span>Primary</span>
            </div>
            <div className="color-swatch secondary">
              <div className="color-box"></div>
              <span>Secondary</span>
            </div>
            <div className="color-swatch success">
              <div className="color-box"></div>
              <span>Success</span>
            </div>
            <div className="color-swatch warning">
              <div className="color-box"></div>
              <span>Warning</span>
            </div>
            <div className="color-swatch error">
              <div className="color-box"></div>
              <span>Error</span>
            </div>
            <div className="color-swatch info">
              <div className="color-box"></div>
              <span>Info</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="demo-section">
          <h3 className="subsection-title">Typography</h3>
          <div className="typography-demo">
            <h1 className="text-6xl">Heading 1 - 6xl</h1>
            <h2 className="text-4xl">Heading 2 - 4xl</h2>
            <h3 className="text-2xl">Heading 3 - 2xl</h3>
            <p className="text-lg">Large text - lg</p>
            <p className="text-base">Body text - base</p>
            <p className="text-sm">Small text - sm</p>
            <p className="text-xs">Extra small text - xs</p>
          </div>
        </div>

        {/* Spacing */}
        <div className="demo-section">
          <h3 className="subsection-title">Spacing Scale</h3>
          <div className="spacing-demo">
            <div className="spacing-item spacing-2">2 (8px)</div>
            <div className="spacing-item spacing-4">4 (16px)</div>
            <div className="spacing-item spacing-6">6 (24px)</div>
            <div className="spacing-item spacing-8">8 (32px)</div>
            <div className="spacing-item spacing-12">12 (48px)</div>
          </div>
        </div>

        {/* Shadows */}
        <div className="demo-section">
          <h3 className="subsection-title">Shadow System</h3>
          <div className="shadow-demo">
            <div className="shadow-card shadow-sm">Small</div>
            <div className="shadow-card shadow-md">Medium</div>
            <div className="shadow-card shadow-lg">Large</div>
            <div className="shadow-card shadow-xl">Extra Large</div>
            <div className="shadow-card shadow-2xl">2X Large</div>
          </div>
        </div>

        {/* Border Radius */}
        <div className="demo-section">
          <h3 className="subsection-title">Border Radius</h3>
          <div className="radius-demo">
            <div className="radius-card rounded-sm">Small</div>
            <div className="radius-card rounded">Base</div>
            <div className="radius-card rounded-lg">Large</div>
            <div className="radius-card rounded-xl">Extra Large</div>
            <div className="radius-card rounded-2xl">2X Large</div>
            <div className="radius-card rounded-full">Full</div>
          </div>
        </div>

        {/* Components */}
        <div className="demo-section">
          <h3 className="subsection-title">Component Examples</h3>
          <div className="component-demo">
            <button className="demo-button primary">Primary Button</button>
            <button className="demo-button secondary">Secondary Button</button>
            <button className="demo-button success">Success Button</button>
            <button className="demo-button warning">Warning Button</button>
            <button className="demo-button error">Error Button</button>
          </div>
        </div>
      </section>
    </div>
  );
} 