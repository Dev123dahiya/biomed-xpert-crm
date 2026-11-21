import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";

interface Props { value: number; format?: (n: number) => string; duration?: number; className?: string; style?: React.CSSProperties }

// Counts from the previous value to the new one. Text is written straight to the
// node so React re-renders never interrupt the tween.
export const AnimatedNumber = ({ value, format = (n) => String(Math.round(n)), duration = 0.9, className, style }: Props): JSX.Element => {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();
  const fmt = useRef(format);
  fmt.current = format;

  useLayoutEffect(() => {
    if (ref.current && !ref.current.textContent) ref.current.textContent = fmt.current(reduce ? value : 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = fmt.current(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { node.textContent = fmt.current(v); },
      onComplete: () => { node.textContent = fmt.current(value); },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, reduce, duration]);

  return <span ref={ref} className={className} style={style} aria-label={format(value)} />;
};
