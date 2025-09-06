import React from 'react'
import { AuroraText } from './ui/aurora-text'

function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gradient-to-b from-gray-900/50 to-black">
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
                SEAM
              </AuroraText>
            </h3>
            <p className="text-[#acb1c8] mb-4 max-w-md">
              The intelligent search platform that connects all your tools and breaks down knowledge silos.
            </p>
            <div className="text-[#acb1c8] text-sm">
              © 2024 SEAM. All rights reserved.
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-[#acb1c8]">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-[#acb1c8]">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-[#acb1c8] text-sm mb-4 md:mb-0">
            Built with ❤️ for teams who value productivity
          </div>
          <div className="flex space-x-6 text-[#acb1c8] text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
