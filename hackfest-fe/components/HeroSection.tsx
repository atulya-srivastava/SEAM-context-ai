import React from 'react'
import GlowingArcCircle from './GlowingCircle'
import { FundRaiserButton } from './FundRaiserButton'
import { AuroraText } from './ui/aurora-text'
import { Input } from './ui/input'
import BeamingButton from './BeamingButton'
import Image from 'next/image'
import { BorderBeam } from './ui/border-beam'

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
        <div className="flex justify-between gap-2 mt-4">

          <BeamingButton />
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