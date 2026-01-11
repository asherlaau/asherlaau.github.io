import { Server, Network, Zap, Shield } from 'lucide-react';

export default function JDSCloudPage() {
  return (
    <div className="space-y-16">
      <header>
        <div className="text-sm font-mono uppercase text-accent mb-4">Featured Project</div>
        <h1 className="text-5xl font-mono font-bold">JDS Cloud</h1>
        <p className="text-xl text-foreground/80 max-w-3xl mt-6">
          A high-performance, 5,000-node distributed cloud platform built from the ground up in modern C++.
        </p>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'P99 Latency', value: '<500ns', color: 'text-accent' },
          { label: 'Ops/Second', value: '10M+', color: 'text-primary' },
          { label: 'Uptime', value: '99.999%', color: 'text-accent' },
          { label: 'Active Nodes', value: '5,000', color: 'text-primary' },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border p-6 rounded-lg text-center">
            <div className={`text-3xl font-mono font-bold ${m.color}`}>{m.value}</div>
            <div className="text-sm text-muted-foreground mt-2">{m.label}</div>
          </div>
        ))}
      </section>

      {/* Code Section */}
      <section className="space-y-6 font-mono">
        <h2 className="text-2xl font-bold">Code Highlights</h2>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">src/core/thread_pool.hpp</div>
          <pre>
            {`// Lock-free thread pool with work-stealing
template<typename Task>
class ThreadPool {
  void submit(Task task) noexcept {
    auto i = index.fetch_add(1, std::memory_order_relaxed);
    queues[i % queues.size()].push(std::move(task));
  }`}
          </pre>
        </div>
      </section>
    </div>
  );
}