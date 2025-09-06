"use client"
import { SignedIn, SignedOut, SignIn, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

const DimensionLogoIcon = () => (
  <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600 rounded-lg" />
);

const NotificationBadge = ({ count }: { count: number }) => (
  <div className="absolute z-20 top-2 -right-1 w-4 h-4 text-xs flex items-center justify-center bg-white/20 text-white/80 rounded-full">
    {count}
  </div>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredPillStyle, setHoveredPillStyle] = useState<React.CSSProperties>(
    {
      opacity: 0,
      transform: "scale(0.9)",
    }
  );

  const navLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    const target = e.currentTarget;
    const containerRect = navLinksRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const targetRect = target.getBoundingClientRect();
    const left = targetRect.left - containerRect.left;
    const top = targetRect.top - containerRect.top;

    setHoveredPillStyle({
      opacity: 1,
      width: target.offsetWidth,
      height: target.offsetHeight,
      transform: `translate(${left}px, ${top}px)`,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPillStyle({
      opacity: 0,
      transform: "scale(0.9)",
    });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "pt-2" : "pt-0"
        }`}
    >
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-300 ${isScrolled ? "px-4" : "border-b-white/2 px-0"
          }`}
      >
        <nav
          className={`flex items-center justify-between w-full  transition-all duration-300 ${isScrolled ? " p-2" : "backdrop-blur-xl bg-white/2 p-4  px-20"
            }`}
        >
          <div onClick={() => redirect("/")}
            className={`flex items-center space-x-3 transition-all duration-300 ${isScrolled ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
          >
            <DimensionLogoIcon />
            <span className="text-xl font-bold text-white">SEAM</span>
          </div>

          <div
            ref={navLinksRef}
            onMouseLeave={handleMouseLeave}
            className={`relative flex items-center gap-1 text-base text-gray-300 bg-transparent border border-white/10 backdrop-blur-xs rounded-full px-1 py-1 transition-all duration-300`}
          >

            <div
              style={hoveredPillStyle}
              className="absolute top-0 left-0 bg-white/10 rounded-full transition-all duration-300 ease-in-out"
            />
           
            <Link
              href="/dashboard/ask"
              onMouseEnter={handleMouseEnter}
              className="relative z-10 px-4 py-1 hover:text-white transition-colors duration-200"
            >
              Ask
            </Link>
            <Link
              href="/dashboard"
              onMouseEnter={handleMouseEnter}
              className="relative z-10 px-4 py-1 hover:text-white transition-colors duration-200"
            >
              Connect 
            </Link>

            {isScrolled && <div className="h-5 w-[1px] bg-white/20 mx-1" />}

            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${isScrolled
                ? "opacity-100 max-w-xs translate-x-0 ml-2"
                : "opacity-0 max-w-0 -translate-x-4"
                }`}
            >
              <button
                onClick={() => SignIn}
                className="relative z-10 px-4 py-1 text-sm font-medium text-white rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 hover:from-fuchsia-600 hover:to-orange-500 transition-all duration-200 whitespace-nowrap"
              >
                Login
              </button>
            </div>
          </div>

          {/* join before */}
          <div
            className={`transition-opacity duration-300 ${isScrolled ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
          >
            <div className="px-5 py-2 text-sm font-medium text-white rounded-sm bg-gradient-to-b from-black/10 to-white/10 border border-white/20 backdrop-blur-xl hover:bg-white/20 transition-all duration-300">
              <SignedOut>
                <SignInButton mode="modal">
                  <button>Login</button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
