"use client";
import Navbar from "@/components/NavBar";
import React from "react";
import { Spotlight } from "@/components/ui/spotlight-new";
import HeroSection from "@/components/HeroSection";
import JoinSection from "@/components/JoinSection";
import BuildSoftware from "@/components/BuildSoftware";
import FeaturesSection from "@/components/FeaturesSection";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

function LandingPage() {
  return (
    <div className="min-h-screen h-full w-fullrelative">
      <Spotlight xOffset={1200} duration={0} />
      <Spotlight />
      <HeroSection />
      <JoinSection />
      <BuildSoftware />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default LandingPage;
