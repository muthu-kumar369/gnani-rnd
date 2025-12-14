import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full overflow-hidden transition-all duration-300 hover:bg-glass-shimmer group"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
            <div className="relative z-10 text-gnani-primary group-hover:text-gnani-secondary transition-colors">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gnani-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
    );
};

export default ThemeToggle;
