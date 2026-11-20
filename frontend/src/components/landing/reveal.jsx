import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
/**
 * Scroll reveal wrapper. Content is revealed as it enters the viewport and
 * immediately revealed when IntersectionObserver is unavailable.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const threshold = 0.15;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < threshold) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      data-revealed={revealed}
      style={{ "--landing-reveal-delay": `${delay}ms` }}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
