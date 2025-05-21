import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeType = 'light' | 'dark' | 'ocean';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    // Check if user has previously selected theme
    const storedTheme = localStorage.getItem('aliud-theme') as ThemeType;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme changes to document
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-ocean');
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Save current theme preference
    localStorage.setItem('aliud-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};