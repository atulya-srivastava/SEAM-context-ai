import React, { CSSProperties, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps
  extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "0.125rem",     // Tailwind’s `rounded-sm`
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    // split the full duration into thirds
    const delay1 = "0s";
    const delay2 = `calc(${shimmerDuration} / 3)`;
    const delay3 = `calc(${shimmerDuration} * 2 / 3)`;

    return (
      <button
        ref={ref}
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
            "--delay1": delay1,
            "--delay2": delay2,
            "--delay3": delay3,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center",
          "overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3",
          "text-white [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out",
          "active:translate-y-px",
          className
        )}
        {...props}
      >
        {/* Three sparkle wrappers, each staggered */}
        {["1", "2", "3"].map((n) => (
          <div
            key={n}
            className="absolute inset-0 -z-30 overflow-visible blur-[2px]"
          >
            {/* slide container */}
            <div
              className={cn(
                "absolute inset-0 animate-shimmer-slide",
                "[animation-duration:var(--speed)]",
                `[animation-delay:var(--delay${n})]`,
                "[aspect-ratio:1] [border-radius:var(--radius)] [mask:none]"
              )}
            >
              {/* spinning conic gradient */}
              <div
                className={cn(
                  "absolute -inset-full w-[200%] h-[200%] rotate-0 animate-spin-around",
                  "[background:conic-gradient(" +
                    "from_calc(270deg - (var(--spread) * 0.5))," +
                    "transparent 0," +
                    "var(--shimmer-color) var(--spread)," +
                    "transparent var(--spread)" +
                  ")]",
                  "[animation-duration:var(--speed)]",
                  `[animation-delay:var(--delay${n})]`
                )}
              />
            </div>
          </div>
        ))}

        {children}

        {/* highlight overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl px-4 py-1.5 text-sm font-medium",
            "shadow-[inset_0_-8px_10px_#ffffff1f] transform-gpu transition-all",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]"
          )}
        />

        {/* inner backdrop to clip shimmer */}
        <div
          className={cn(
            "absolute inset-[var(--cut)] -z-20",
            "[background:var(--bg)]",
            "[border-radius:var(--radius)]"
          )}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";