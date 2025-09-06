import React from 'react'
import { AuroraText } from './ui/aurora-text'
import { Check } from 'lucide-react'

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 team members",
        "Basic search across 3 platforms",
        "1,000 documents indexed",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Ideal for growing teams",
      features: [
        "Up to 25 team members",
        "Advanced search across all platforms",
        "10,000 documents indexed",
        "Priority support",
        "Custom integrations",
        "Analytics dashboard"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited team members",
        "Unlimited documents",
        "Custom AI models",
        "Dedicated support",
        "SSO integration",
        "Advanced security",
        "Custom deployment"
      ],
      popular: false
    }
  ]

  return (
    <div className="container max-w-6xl mx-auto py-20 px-4">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-semibold mb-6">
          <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
            Simple Pricing
          </AuroraText>
          <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
            {" "}for Every Team
          </span>
        </h2>
        <p className="text-[#acb1c8] text-xl max-w-3xl mx-auto">
          Choose the plan that fits your team's needs. Start free, upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div 
            key={index}
            className={`relative p-8 rounded-2xl border transition-all duration-300 ${
              plan.popular 
                ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 scale-105' 
                : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-purple-500/50'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-white mb-2">
                {plan.price}
                {plan.period && <span className="text-lg text-[#acb1c8]">{plan.period}</span>}
              </div>
              <p className="text-[#acb1c8]">{plan.description}</p>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center">
                  <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-[#acb1c8]">{feature}</span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
              plan.popular
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
                : 'bg-white/10 text-white border border-gray-600 hover:bg-white/20'
            }`}>
              {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PricingSection
