import React from 'react'
import { AuroraText } from './ui/aurora-text'
import { Brain, Zap, Shield, Search, MessageSquare, FileText } from 'lucide-react'

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "Semantic Search",
      description: "Find information by meaning, not just keywords. Understand context and intent across all your platforms."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant results across Slack, Google Docs, GitHub, Notion, and Drive with AI-powered indexing."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays protected with enterprise-grade security and privacy controls."
    },
    {
      icon: Search,
      title: "Unified Interface",
      description: "One search bar to rule them all. No more switching between different tools and interfaces."
    },
    {
      icon: MessageSquare,
      title: "Smart Context",
      description: "Understand conversations, documents, and code in context. Find exactly what you need, when you need it."
    },
    {
      icon: FileText,
      title: "Cross-Platform",
      description: "Seamlessly search across all your favorite tools without leaving your workflow."
    }
  ]

  return (
    <div className="container max-w-6xl mx-auto py-20 px-4">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-semibold mb-6">
          <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
            Why Teams Choose{" "}
          </span>
          <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
            SEAM
          </AuroraText>
        </h2>
        <p className="text-[#acb1c8] text-xl max-w-3xl mx-auto">
          Break down knowledge silos and transform how your team discovers and shares information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-[#acb1c8] leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturesSection
