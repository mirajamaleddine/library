import * as React from "react";

// Define your desired mobile breakpoint
const MOBILE_BREAKPOINT = 768; // e.g., anything less than 768px is considered mobile

/**
 * A custom hook to determine if the user's screen width is within the mobile range.
 * @returns {boolean} True if the screen is mobile, false otherwise.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Check for window existence to handle SSR environments
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Initial check
    onChange();

    // Listen for changes
    mql.addEventListener("change", onChange);

    // Cleanup function
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
