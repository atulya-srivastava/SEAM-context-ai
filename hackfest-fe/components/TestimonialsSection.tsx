import React from 'react'
import { AuroraText } from './ui/aurora-text'

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "SEAM has completely transformed how our team finds information. We've cut our search time by 70%.",
      author: "Sarah Chen",
      role: "Engineering Manager",
      company: "TechCorp"
    },
    {
      quote: "Finally, a search tool that understands context. No more digging through multiple platforms.",
      author: "Marcus Johnson",
      role: "Product Manager",
      company: "InnovateLab"
    },
    {
      quote: "The semantic search is incredible. It finds exactly what I need, even when I don't know the exact keywords.",
      author: "Emily Rodriguez",
      role: "Design Lead",
      company: "CreativeStudio"
    }
  ]

  return (
    <div className="container max-w-6xl mx-auto py-20 px-4">
      <div className="text-center mb-16">
        <h2 className="text-5xl font-semibold mb-6">
          <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
            What Teams Are{" "}
          </span>
          <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
            Saying
          </AuroraText>
        </h2>
        <p className="text-[#acb1c8] text-xl max-w-3xl mx-auto">
          Join thousands of teams who've revolutionized their productivity with SEAM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <div 
            key={index}
            className="group p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="flex flex-col h-full">
              <div className="text-[#acb1c8] text-lg leading-relaxed mb-6 flex-grow">
                "{testimonial.quote}"
              </div>
              <div className="border-t border-gray-700/50 pt-4">
                <div className="text-white font-semibold">{testimonial.author}</div>
                <div className="text-[#acb1c8] text-sm">{testimonial.role}</div>
                <div className="text-purple-400 text-sm">{testimonial.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimonialsSection
