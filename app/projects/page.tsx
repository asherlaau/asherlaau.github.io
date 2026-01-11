import Link from 'next/link';
import { ArrowRight, Server, Network, Zap } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-12">
      <header>
        <div className="text-sm font-mono uppercase text-accent mb-4">Portfolio</div>
        <h1 className="text-5xl font-mono font-bold">Projects</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mt-4">
          A collection of high-performance distributed systems and infrastructure projects built with modern C++.
        </p>
      </header>

      <div className="grid gap-6">
        {/* JDS Cloud Project Card */}
        <Link href="/projects/jds-cloud" className="group block bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-all">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-mono font-bold">JDS Cloud</h2>
                  <span className="px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded text-xs font-mono">Featured</span>
                </div>
                <p className="text-muted-foreground">5,000-node distributed cloud platform</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          
          <p className="text-foreground/80 leading-relaxed mb-6">
            Features custom TCP/IP stack, lock-free thread pools, and sophisticated consensus algorithms for extreme reliability at scale.
          </p>

          <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
            {['C++23', 'Linux', 'TCP/IP', 'Lock-Free'].map(tech => (
              <span key={tech} className="px-3 py-1 bg-muted/50 border border-border rounded-md text-sm text-muted-foreground font-mono">
                {tech}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}