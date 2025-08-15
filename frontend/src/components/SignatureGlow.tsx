import { useEffect, useRef } from "react";

const SignatureGlow = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(300px_300px_at_var(--mx,_50%)_var(--my,_50%),black,transparent)]"
      style={{
        background: "radial-gradient(600px 600px at var(--mx, 50%) var(--my, 50%), hsl(var(--primary) / 0.25), transparent)",
      }}
    />
  );
};

export default SignatureGlow;
