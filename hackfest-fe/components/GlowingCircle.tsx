"use client";
import React from "react";

const GlowingArcCircle: React.FC = () => {
  return (
    <div className="relative w-280 h-280 flex items-center justify-center">

      <div className="absolute w-full h-full animate-spin-slow">
        <div
          className="absolute left-1/2 top-0 w-[30%] h-[30%] -translate-x-1/2 origin-bottom 
          rounded-full bg-gradient-to-tr from-pink-500 via-yellow-500 to-blue-500 
          blur-2xl opacity-80 z-10"
        />
      </div>
      <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-900 via-black to-transparent z-0"></div>


      <div className="absolute top-[90px] left-1/2 transform -translate-x-1/2 w-200 h-200 flex items-center justify-center">
        <div className="absolute w-full h-full animate-spin-slow-reverse-delay">
          <div
            className="absolute left-1/2 bottom-0 w-[30%] h-[30%] -translate-x-1/2 origin-bottom 
            rounded-full bg-gradient-to-tr from-pink-500 via-yellow-500 to-blue-500 
            blur-2xl opacity-80 z-20"
          />
        </div>
        <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-900 via-black to-black z-0" />
      </div>
    </div>
  );
};

export default GlowingArcCircle;
