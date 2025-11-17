"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NavigationProps {
  className?: string;
}

export const Navigation = ({ className }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHowItWorks, setIsPastHowItWorks] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Check if scrolled past "how-it-works" section
      const howItWorksSection = document.getElementById("how-it-works");
      if (howItWorksSection) {
        const rect = howItWorksSection.getBoundingClientRect();
        setIsPastHowItWorks(rect.top < 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] w-full px-4 py-4 pointer-events-none">
      <nav
        className={cn(
          "mx-auto max-w-7xl w-full pointer-events-auto",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-white/10 rounded-full shadow-2xl",
          "transition-all duration-300",
          isPastHowItWorks 
            ? "bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.8)]" 
            : isScrolled 
              ? "bg-[#1a1a1a]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" 
              : "bg-[#1a1a1a]/90",
          className
        )}
        style={{
          isolation: "isolate",
          position: "relative",
        }}
      >
      <div className="px-8 py-5">
        <div className="grid grid-cols-3 items-center w-full">

          {/* LEFT — LOGO */}
          <div className="flex justify-start">
            <img
              src="/images/logo.png"
              alt="Synkora Logo"
              className="w-10 h-10"
            />
          </div>

          {/* CENTER — NAV LINKS */}
          <div className="hidden md:flex justify-center items-center space-x-8">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-all duration-200 hover:drop-shadow-[0_0_10px_white] pointer-events-auto"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="text-white/60 hover:text-white transition-all duration-200 hover:drop-shadow-[0_0_10px_white] pointer-events-auto"
            >
              About
            </Link>

            <Link
              href="/#how-it-works"
              className="text-white/60 hover:text-white transition-all duration-200 hover:drop-shadow-[0_0_10px_white] pointer-events-auto"
            >
              How it works
            </Link>

            <Link
              href="/#faq"
              className="text-white/60 hover:text-white transition-all duration-200 hover:drop-shadow-[0_0_10px_white] pointer-events-auto"
            >
              FAQs
            </Link>

            <Link
              href="/blog"
              className="text-white/60 hover:text-white transition-all duration-200 hover:drop-shadow-[0_0_10px_white] pointer-events-auto"
            >
              Blogs
            </Link>
          </div>

          {/* RIGHT — CTA BUTTONS */}
          <div className="flex justify-end items-center space-x-4">

            {/* LOGIN */}
            <Button
              variant="ghost"
              className="hidden sm:inline-flex text-white/80 hover:text-white hover:scale-105 transition-all duration-200 hover:drop-shadow-[0_0_8px_white] pointer-events-auto"
            >
              <Link href="/login" className="pointer-events-auto">LOGIN</Link>
            </Button>

            {/* NOTIFY BUTTON */}
            <Button
              variant="outline"
              className="border-white/20 text-white/90 rounded-full px-6 py-2 
              hover:border-white hover:text-white hover:scale-105 
              hover:drop-shadow-[0_0_12px_white] transition-all duration-200 pointer-events-auto"
            >
              Notify me
            </Button>
          </div>
        </div>
      </div>
    </nav>
    </div>
  );
};
