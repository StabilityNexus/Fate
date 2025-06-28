"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import styles from "./style.module.scss";

export default function StickyCursor({
  stickyRef,
}: {
  stickyRef: React.RefObject<HTMLElement | null>;
}) {
  const { resolvedTheme } = useTheme();
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cursorSize = isHovered ? 60 : 15;
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };

  const scale = {
    x: useMotionValue(1),
    y: useMotionValue(1),
  };

  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions),
  };

  const manageMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    mouse.x.set(clientX - cursorSize / 2);
    mouse.y.set(clientY - cursorSize / 2);
  };

  useEffect(() => {
    const element = stickyRef.current;

    const enter = () => setIsHovered(true);
    const leave = () => {
      setIsHovered(false);
      animate(cursorRef.current!, { scaleX: 1, scaleY: 1 }, { duration: 0.1 });
    };

    element?.addEventListener("mouseenter", enter);
    element?.addEventListener("mouseleave", leave);
    window.addEventListener("mousemove", manageMouseMove);

    return () => {
      element?.removeEventListener("mouseenter", enter);
      element?.removeEventListener("mouseleave", leave);
      window.removeEventListener("mousemove", manageMouseMove);
    };
  }, [stickyRef]);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice) {
    return null; // Don't render custom cursor on touch devices
  }
  return (
    <div
      className={styles.cursorContainer}
      role="presentation"
      aria-hidden="true"
    >
      <motion.div
        ref={cursorRef}
        className={styles.cursor}
        style={{
          left: smoothMouse.x,
          top: smoothMouse.y,
          width: cursorSize,
          height: cursorSize,
          backgroundColor: resolvedTheme === "dark" ? "#fff" : "#000",
          scaleX: scale.x,
          scaleY: scale.y,
        }}
      />
    </div>
  );
}
