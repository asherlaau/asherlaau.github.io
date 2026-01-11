import React from 'react';

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="space-y-6">
          <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Software Engineer
          </div>
          <h1 className="text-6xl font-mono font-semibold leading-[1.2] text-white">
            Asher Lau
          </h1>
          <p className="text-2xl font-mono text-white"> {/* Changed from primary blue to white */}
            Specialized in Distributed Systems
          </p>
          <div className="h-1 w-24 bg-accent rounded" />
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-3xl space-y-4 text-lg leading-relaxed text-foreground/90">
        <h2 className="text-3xl font-mono font-semibold mb-6 text-white">About</h2>
        <div className="space-y-6">
          <p>
            I am a software engineer with a deep passion for building high-concurrency 
            infrastructure and distributed systems. I thrive at the intersection of 
            low-level performance and complex architectural design.
          </p>
          <p>
            My technical foundation is built on a love for <span className="text-white border-b border-white/30">algorithms</span> and 
            the power of <span className="text-white font-medium">Modern C++23</span>. I focus on writing 
            clean, efficient code that scales across thousands of nodes while maintaining sub-microsecond latency.
          </p>
          <p>
            Whether it's implementing lock-free data structures or optimizing network protocols, 
            I am dedicated to pushing the boundaries of what distributed software can achieve.
          </p>
        </div>
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            { value: 'Algorithm', label: 'Problem Solving Focus', color: 'text-accent' },
            { value: 'C++23', label: 'Systems Programming', color: 'text-white' },
            { value: 'Distributed', label: 'Scale & Reliability', color: 'text-accent' }
          ].map(stat => (
            <div key={stat.label} className="p-6 bg-card border border-border rounded-lg hover:border-white/20 transition-all">
              <div className={`text-3xl font-mono font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}