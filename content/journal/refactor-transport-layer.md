---
title: "Refactor on transportation layer"
date: "2026-01-29"
tags: ["C++23", "Distributed Systems", "Concurrency", "Networking"]
description: "bad design that let tranport also handle rounting the protocol handler."
---

# Why We Refactored: From PeerId-Based Transport to Identity-Aware Session Layer
> JDS Cloud Networking Architecture Rationale (2026-01)

This document explains **why the previous design was flawed**, what risks it created, and how the new **Transport + Session (ClusterNet)** architecture improves correctness, scalability, performance isolation, and long-term maintainability.

---

## 1. Previous Design (Problematic)

### 1.1 What We Had

Originally, the system combined multiple responsibilities inside `TcpTransport`:

- TCP socket management
- Frame decoding
- Protocol dispatch
- Handshake + verification logic
- Peer identity promotion
- Application protocol routing

In practice, this meant:

```
TcpTransport = transport + session + protocol + security + identity
```

### 1.2 Core Problems

#### ❌ Layer Violation

Transport layer depended on:

- IdentityManager
- Peer verification state
- Handshake protocol
- Application protocol handlers

This broke the fundamental abstraction:

> Transport should be a **dumb pipe**, not a protocol-aware state machine.

This caused:

- Tight coupling between network IO and business logic
- Impossible to reuse transport for UDP, QUIC, RPC, in-memory, tests
- Protocol changes forced transport rewrites

---

#### ❌ Incorrect Abstraction: PeerId vs NodeId

Previously:

- Application logic used `PeerId`
- Handshake promoted peers inside transport
- Identity was mixed with socket lifecycle

This is wrong in distributed systems:

| Concept | Meaning |
|--------|---------|
| PeerId | Ephemeral transport connection |
| NodeId | Stable cluster identity |

Mixing them caused:

- Reconnect bugs
- Split-brain identity issues
- Impossible to support multiple connections per node
- Hard to implement routing, failover, gossip, etc.

---

#### ❌ Handshake Hardcoded into Transport

Handshake logic lived in `TcpTransport::reader_loop`:

- Transport knew protocol IDs
- Transport rejected messages based on verification
- Transport managed peer promotion

This is architecturally wrong:

Transport should not:

- Know protocol semantics
- Enforce cluster security rules
- Own identity lifecycle

This made transport:

- Hard to reason about
- Hard to test
- Hard to extend

---

#### ❌ Plugin & Protocol Extensibility Blocked

Original design made it difficult to add:

- New protocols
- New handshake versions
- Alternate auth mechanisms
- Session features (routing, load balancing, quorum, etc.)

Every new feature required touching transport internals.

That is a scaling disaster.

---

## 2. New Architecture (Correct)

### 2.1 Clean Layering

We now have:

```
+-------------------+
| Application Logic |
+-------------------+
|  Session Layer    |  <-- ClusterNet
+-------------------+
|  Transport Layer  |  <-- TcpTransport
+-------------------+
|   OS / TCP Stack  |
+-------------------+
```

Responsibilities:

### Transport Layer (`jds::transport`)

Owns ONLY:

- Socket lifecycle
- Accept/connect
- Frame encoding/decoding
- Event stream

Transport does NOT know:

- Handshake
- NodeId
- Identity
- Application protocols

It is a **dumb byte pipe + events**.

---

### Session Layer (`jds::session::ClusterNet`)

Owns:

- Handshake protocol
- Identity verification
- Peer state machine
- NodeId <-> PeerId binding
- Protocol dispatch by identity
- Security policy

ClusterNet is the **brain**.
Transport is the **muscle**.

---

### Identity Layer (`IdentityManager`)

Single source of truth for:

- PeerId -> Peer session
- NodeId -> active PeerId

This enables:

- Reconnect handling
- Last-writer-wins semantics
- Routing by NodeId
- Session lifecycle independent of sockets

---

## 3. Software Design Advantages

### 3.1 Separation of Concerns (SoC)

Before:

- One class did everything

After:

| Layer | Responsibility |
|--------|----------------|
| Transport | Bytes + sockets |
| Session | Identity + handshake |
| App | Business logic |

This makes the system:

- Easier to reason about
- Easier to test
- Easier to extend

---

### 3.2 Correct Distributed Systems Model

The new design matches industry practice (Google, Meta, HFT, etc.):

- Transport != Session
- Connection != Identity
- Socket != Node

This enables:

- Multi-connection per node
- Session migration
- Failover
- Load balancing
- Protocol evolution

---

### 3.3 Protocol Evolution

Now you can:

- Change handshake format
- Add auth
- Add TLS
- Add version negotiation

WITHOUT touching transport.

This is critical for long-term system evolution.

---

## 4. Performance Implications

### 4.1 CPU & Cache Locality

Before:

- Transport thread did:
  - Frame decode
  - Handshake
  - Identity lookup
  - Protocol routing

This caused:

- Larger instruction footprint
- Worse cache locality
- More branch mispredicts

After:

- Transport thread ONLY decodes + queues events
- Session thread handles protocol + identity

Result:

- Smaller hot path
- Better instruction cache
- Lower tail latency

---

### 4.2 Backpressure & Flow Control

With event-based design:

- Transport can drop / throttle
- Session can implement backpressure
- App logic cannot block sockets

This prevents:

- Head-of-line blocking
- Slow handlers stalling network IO

---

### 4.3 Scaling to Multiple Transports

Now you can add:

- UDP
- QUIC
- RDMA
- In-memory loopback

All without touching ClusterNet.

This is huge for performance experimentation.

---

## 5. Security & Correctness

### 5.1 Protocol Violation Handling

Now centralized in ClusterNet:

- App traffic before verification
- Bad handshake
- Identity conflicts

Transport no longer enforces policy.

This avoids:

- Security logic scattered in IO code
- Inconsistent enforcement

---

### 5.2 Identity Consistency

IdentityManager guarantees:

- One NodeId -> active Peer
- Clean replacement on reconnect

This prevents:

- Ghost peers
- Duplicate identities
- Split-brain routing

---

## 6. Why This Matches Industry (Google / HFT / Infra)

Large systems universally use:

- Transport abstraction
- Session abstraction
- Identity abstraction

Examples:

- gRPC: HTTP/2 transport + channel + call/session
- QUIC: Connection + Stream + Session
- HFT: NIC layer + session layer + strategy layer

They NEVER put handshake + identity inside raw socket code.

Your refactor aligns JDS Cloud with **professional-grade distributed system architecture**.

---

## 7. Summary

### Old Design

❌ Tight coupling
❌ Wrong identity model
❌ Hard to extend
❌ Hard to test
❌ Hard to secure

### New Design

✅ Clean layering
✅ Correct NodeId model
✅ Easy to extend
✅ Better performance isolation
✅ Industry-standard architecture

---


