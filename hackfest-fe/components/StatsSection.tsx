import React from 'react'
import { AuroraText } from './ui/aurora-text'

function StatsSection() {
    const stats = [
        {
            number: "10M+",
            label: "Documents Indexed",
            description: "Across all major platforms"
        },
        {
            number: "99.9%",
            label: "Uptime",
            description: "Reliable search when you need it"
        },
        {
            number: "50%",
            label: "Time Saved",
            description: "Average productivity increase"
        },
        {
            number: "1000+",
            label: "Teams",
            description: "Already using SEAM"
        }
    ]

    return (
        <div className="container max-w-6xl mx-auto py-20 px-4">
            <div className="text-center mb-16">
                <h2 className="text-5xl font-semibold mb-6">
                    <AuroraText colors={["#b37cfc", "#ff8db3", "#ffc27d", "#ffe0b0"]}>
                        Trusted by Teams
                    </AuroraText>
                    <span className="bg-gradient-to-b bg-clip-text text-transparent from-gray-300 to-white">
                        {" "}Worldwide
                    </span>
                </h2>
                <p className="text-[#acb1c8] text-xl max-w-3xl mx-auto">
                    Join thousands of teams who've transformed their productivity with intelligent search
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 hover:border-purple-500/50 transition-all duration-300"
                    >
                        <div className="text-4xl font-bold bg-gradient-to-b bg-clip-text text-transparent from-purple-400 to-pink-400 mb-2">
                            {stat.number}
                        </div>
                        <div className="text-xl font-semibold text-white mb-2">{stat.label}</div>
                        <div className="text-[#acb1c8] text-sm">{stat.description}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default StatsSection
