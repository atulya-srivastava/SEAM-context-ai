import React from 'react'
import GlowingArcCircle from './GlowingCircle'
import { FundRaiserButton } from './FundRaiserButton'
import { AuroraText } from './ui/aurora-text'
import { Input } from './ui/input'
import BeamingButton from './BeamingButton'
import Image from 'next/image'
import { BorderBeam } from './ui/border-beam'
import { Github } from 'lucide-react'

function HeroSection() {
  return (
    <div className="relative w-full flex flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <GlowingArcCircle />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 pt-40">
        <FundRaiserButton />
        <h1 className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white text-7xl font-medium">
          SEAM is the new
        </h1>
        <h1 className="text-7xl font-medium">
          <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
            Intelligent Search Across Platforms
          </AuroraText>
        </h1>
        <h3 className="text-[#acb1c8] text-xl font-medium pt-2">
          Knowledge Connected, Productivity Unleashed.
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <BeamingButton />
          <a
            href="https://github.com/atulya-srivastava/SEAM-context-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-200 shadow-sm group"
          >
            <Github className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200" />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <div className="relative z-10 mt-32 flex justify-center">
        <div className="relative rounded-md">
          <Image
            src="/images/banner-home.png"
            alt="My Photo"
            width={1250}
            height={1200}
            className="relative"
          />
          <BorderBeam />
        </div>
      </div>
    </div>
  );
}

export default HeroSection