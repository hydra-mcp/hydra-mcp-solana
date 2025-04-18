import { useState, useEffect } from 'react';

// Define wallpaper URL constants for easy management
export const WALLPAPERS = {
    DARK: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1170&auto=format&fit=crop",
    LIGHT: "https://images.unsplash.com/photo-1502472584811-0a2f2feb8968?q=80&w=2070&auto=format&fit=crop"
};

// Tool function to directly update wallpaper (for non-React environments)
export function updateWallpaper(isDark: boolean) {
    const wallpaperUrl = isDark ? WALLPAPERS.DARK : WALLPAPERS.LIGHT;

    // Update wallpaper element
    const wallpaperElement = document.querySelector('.bg-cover.bg-center');
    if (wallpaperElement) {
        (wallpaperElement as HTMLElement).style.backgroundImage = `url(${wallpaperUrl})`;
    }

    // Update dark overlay on wallpaper
    const overlayElement = document.querySelector('.bg-cover.bg-center + div');
    if (overlayElement) {
        if (isDark) {
            overlayElement.classList.remove('bg-black/5');
            overlayElement.classList.add('bg-black/40');
        } else {
            overlayElement.classList.remove('bg-black/40');
            // overlayElement.classList.add('bg-black/5');
        }
    }
}

// Tool function to directly toggle theme (for non-React environments)
export function toggleThemeDirectly() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');

    // Toggle theme
    if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }

    // Update wallpaper
    updateWallpaper(!isDark);

    return !isDark; // Return new theme state
}

export function useTheme() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Check system preference and localStorage on mount
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        setIsDarkMode((prevMode) => {
            const newMode = !prevMode;
            if (newMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newMode;
        });
    };

    // Current wallpaper URL
    const wallpaperUrl = isDarkMode ? WALLPAPERS.DARK : WALLPAPERS.LIGHT;

    return { isDarkMode, toggleTheme, wallpaperUrl };
} 