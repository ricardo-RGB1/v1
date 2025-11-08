import { useTheme } from "next-themes"; 

/**
 * Custom hook that returns the current active theme.
 * 
 * This hook wraps next-themes' useTheme and provides a simplified interface
 * for getting the currently active theme. It handles the "system" theme case
 * by returning the resolved system theme preference.
 * 
 * @returns {string | undefined} The current theme ("dark", "light") or undefined if not yet resolved
 */
export const useCurrentTheme = () => {
    const { theme, systemTheme } = useTheme();

    if(theme === "dark" || theme === "light") {
        return theme; 
    }

    return systemTheme; 
}