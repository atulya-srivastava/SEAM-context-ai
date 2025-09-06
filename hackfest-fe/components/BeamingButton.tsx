"use client"
import React from 'react'
import { BorderBeam } from './ui/border-beam';
import { Button } from './ui/button';
import { redirect } from 'next/navigation';

function BeamingButton() {
  return (
    <div className="relative inline-block">
      <div className="p-[3px] rounded-md border-white/10 border-[0.5px] low-hidden">
        <BorderBeam
          size={32}
          initialOffset={2}
          className="from-white via-white/2 to-transparent"
        />

        <div className="p-[3px] rounded-md border-white/10 border-[0.5px] relative overflow-hidden">
          <BorderBeam
            size={30}
            initialOffset={4}
            className="from-white via-white/2 to-transparent"
          />

          <div className="p-[3px] rounded-md border-white/8 border-[0.5px]  relative overflow-hidden">
            <BorderBeam
              size={28}
              initialOffset={5}
              className="from-white to-transparent"
            />

            <Button onClick={()=>redirect("/dashboard")}
              className="bg-gradient-to-br from-purple-500 via-pink-400 to-orange-300 text-white border-transparent rounded-md"
              variant="outline"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeamingButton