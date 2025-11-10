import { useState, useEffect } from "react"; 

/**
 * Custom hook to track scroll position and determine if the page has been scrolled past a threshold.
 * 
 * @param threshold - The scroll position in pixels after which isScrolled becomes true (default: 10)
 * @returns An object containing:
 *   - isScrolled: boolean indicating whether the page has been scrolled past the threshold
 * 
 * @example
 * ```tsx
 * const { isScrolled } = useScroll(50);
 * 
 * return (
 *   <header className={isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}>
 *     Navigation
 *   </header>
 * );
 * ```
 */
export const useScroll = (threshold: number = 10) => {
    const [isScrolled, setIsScrolled] = useState(false); 

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > threshold);
        }

        window.addEventListener("scroll", handleScroll);  

         // call the function once to set the initial state 
        handleScroll();

        // clean up the event listener when the component unmounts 
        return () => window.removeEventListener("scroll", handleScroll);

    }, [threshold]);

    return isScrolled; // return the boolean value indicating if the page has been scrolled past the threshold 
}