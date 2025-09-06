import React from 'react'
import { AuroraText } from './ui/aurora-text'
import BeamingButton from './BeamingButton'

function CTASection() {
  return (
    <div className="container max-w-4xl mx-auto py-20 px-4 text-center">
      <div className="relative">
        <h2 className="text-6xl font-semibold mb-6">
          <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
            Ready to Transform{" "}
          </span>
          <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
            Your Team's Productivity?
          </AuroraText>
        </h2>
        
        <p className="text-[#acb1c8] text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of teams who've already broken down their knowledge silos and unlocked the power of intelligent search.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <BeamingButton />
          <button className="px-8 py-3 rounded-lg border border-gray-600 text-white hover:bg-white/10 transition-all duration-300">
            Watch Demo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30">
            <div className="text-3xl font-bold text-white mb-2">10M+</div>
            <div className="text-[#acb1c8]">Documents Indexed</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30">
            <div className="text-3xl font-bold text-white mb-2">1000+</div>
            <div className="text-[#acb1c8]">Teams Using SEAM</div>
          </div>
          <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30">
            <div className="text-3xl font-bold text-white mb-2">50%</div>
            <div className="text-[#acb1c8]">Time Saved</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CTASection
