import React from 'react'
import BeamingIcon from './BeamingIcon'
import { AuroraText } from './ui/aurora-text';

function BuildSoftware() {
  return (
    <div className="container max-w-4xl mx-auto py-20">
      <BeamingIcon />
      <div className="text-5xl font-semibold">
        <h2>
            <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
            All Your Tools{" "}
            </span>
            <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
              <span>One Search</span>
            </AuroraText>
        </h2>
      </div>
    </div>
  );
}

export default BuildSoftware