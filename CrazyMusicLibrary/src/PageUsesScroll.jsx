import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollToggle(routesWithScroll = []) {
  const location = useLocation();

  useEffect(() => {
    const shouldEnable = routesWithScroll.includes(location.pathname);

    if (shouldEnable) {
      document.documentElement.classList.add("scroll-enabled");
      document.body.classList.add("scroll-enabled");
    } else {
      document.documentElement.classList.remove("scroll-enabled");
      document.body.classList.remove("scroll-enabled");
    }
  }, [location, routesWithScroll]);
}