---
title: "JDS Cloud peer identity check"
date: "2026-01-29"
tags: ["C++23", "Distributed Systems", "Concurrency", "Networking"]
description: "How to get the peer idenities, verify it and promote it with better design"
---

# Identity-Aware Networking in JDS Cloud: Handshake + Peer Identity Registry

## Motivation

Today, the system identifies connections via **PeerId** (a transient, socket-level identifier). That works for basic point-to-point messaging, but it breaks down as soon as we care about **cluster-level state**:

- TCP reconnects happen (Wi‑Fi drops, NAT timeouts, node restarts).
- A new socket implies a new PeerId.
- Routing/state tied to PeerId becomes fragile and hard to reason about.

For a robust distributed cluster like **JDS Cloud**, peers must be identified by their **logical identity**: **NodeId** (as defined in `NodeConfig`). That identity must remain stable across reconnections so the cluster can:

- maintain membership and health state,
- route messages by identity (not by socket),
- recover cleanly after disconnects.

---

## Goals

1. **Handshake Protocol**  
   Design a lightweight protocol to exchange **NodeId** immediately after a TCP connection is established.

2. **Identity Management**  
   Implement a **Peer Registry / IdentityManager** to map transient **PeerId** ↔ logical **NodeId**.

3. **Identity‑Aware Routing**  
   Refactor routing logic so the system can address nodes by **NodeId**, not socket handles.

---

## Expected Reach Effect

Shift from socket-based communication to identity-aware cluster communication:

```cpp
// Reach effect: Send data directly to a specific Node ID
tcp->send(targetNodeId, PROTO_STORAGE, my_data);
```

This makes the cluster **more resilient** (reconnects no longer break identity) and **easier to manage** (membership and routing are expressed in the same language as the cluster config).

---

## Task Checklist

- [ ] Implement a Handshake frame type in the `FrameHeader` logic.
- [ ] Add logic to `TcpTransport` to trigger a handshake upon `net.peer_connected`.
- [x] Create an `IdentityManager` to track `NodeId <-> PeerId` mappings.
- [ ] Update the `send()` API to support `NodeId` lookup and routing.
- [ ] Add invariants to ensure communication only occurs after successful identification.

> ✅ You already added `IdentityManager` and a `Peer` class with `PeerStatus`.

---

## Design Overview

### Core idea

- **Transport layer** is responsible for:
  - accepting sockets,
  - framing,
  - routing frames by `protocol_id`,
  - peer lifecycle glue (create peer, dispatch bytes, close peer).

- **Protocol handlers** are responsible for:
  - parsing payloads,
  - validating protocol rules,
  - updating identity and promotion state (via `IdentityManager`).

This achieves **clean separation**: *transport routes; handlers interpret*.

---

## Peer Model

Each TCP connection corresponds to a `Peer` object. A peer starts as an untrusted, not-yet-identified connection.

### PeerStatus

```cpp
enum class PeerStatus {
  New = 0,
  Handshaking = 1,
  Verified = 2,
  Closing = 3,
  Error = 4,
};
```

### NodeIdentity attached to Peer

`Peer` holds a `NodeIdentity` struct that represents the remote node's logical identity:

- `node_id`
- `cluster_id`
- `software_version`
- (optionally) handshake timestamp or other metadata

### Why status matters

The same socket may behave differently depending on `PeerStatus`:

- `New`: only handshake frames are valid
- `Handshaking`: awaiting completion/verification
- `Verified`: all application protocols allowed
- `Closing/Error`: ignore or reject traffic

This gives a clear place to enforce **invariants** like:  
> “No Storage frames before identity verification.”

---

## Handshake Protocol

### Requirements

Any peer that wants to connect must send a **Hello Handshake**.

This handshake is shared by all transports (TCP today, potentially QUIC/UDP later): it is a **protocol contract**, not a TCP-only hack.

### HandshakeHello contents

A minimal hello includes:

- **magic number** (to filter garbage / wrong service)
- **version** (protocol compatibility)
- **nodeId** (logical identity)
- **timestamp** (basic replay/clock sanity; optional, but useful)

Conceptually:

```text
HandshakeHello {
  magic: u32,
  version: u16,
  node_id: NodeId,
  timestamp_ms: u64,
}
```

### Routing: protocol_id = 0

- Handshake is assigned `protocol_id = 0`.
- When `TcpTransport` sees a frame with protocol id `0`, it routes the payload to `HandshakeHandler`.
- `HandshakeHandler` validates and promotes the peer.

---

## Handler Architecture

`HandshakeHandler` is derived from `IProtocolHandler`.

Transport does not decode handshake payloads. It only knows:

1. A frame arrived
2. It has `protocol_id = X`
3. It forwards bytes to the registered handler for X

### Registration

```cpp
TcpTransport transport(id_mgr);

auto handshake_h = std::make_shared<jds::protocol::HandshakeHandler>(id_mgr, local_id);
auto storage_h   = std::make_shared<StorageHandler>(sink);

transport.register_handler(ProtocolIds::Handshake, handshake_h);
transport.register_handler(ProtocolIds::Storage, storage_h);

// (Example) send hello handshake
jds::protocol::HandshakeHello hello{.version = 1, .my_id = local_id.id};

transport.send(*res,
               ProtocolIds::Handshake,
               std::span<const u8>(reinterpret_cast<const u8*>(&hello), sizeof(hello)));
```

---

## Promotion Flow

### State machine

```text
[New]
  | (recv HandshakeHello)
  v
[Handshaking]
  | (validated + identity registered)
  v
[Verified]
  | (disconnect / error)
  v
[Closing] -> cleanup -> (removed)
```

### What “promotion” means

A peer is “promoted” when:

- its `NodeIdentity` is known and verified,
- `IdentityManager` stores the mapping `NodeId -> PeerId` (and possibly the reverse),
- the peer status becomes `Verified`.

From that point on, all identity-aware routing becomes possible.

---

## IdentityManager: Source of Truth

`IdentityManager` is the single authority that knows:

- which `PeerId` currently represents which `NodeId`,
- which `NodeId` is currently reachable,
- what to do on reconnect (replace old mapping, close old peer, etc.).

### Suggested invariants

- A `NodeId` can map to **at most one live Verified Peer** at a time.
- If a new Verified peer claims an existing NodeId:
  - either reject it (strict mode), or
  - accept it and evict the old peer (reconnect-friendly mode).
- `send(NodeId, ...)` must fail fast if the node has no Verified peer.

---

## Why this design is good

### 1) Handler decoupled from transport

Transport doesn’t know application protocol content. It stays stable as you add more protocols:

- Handshake
- Storage
- Gossip
- Heartbeat
- RPC
- …

### 2) Peer promotion decoupled

Peer promotion is triggered by protocol logic (HandshakeHandler), not hard-coded into TcpTransport.

That means:
- no transport rewrite when handshake evolves,
- no leaking handshake semantics into low-level networking code.

### 3) Low abstraction cost (for now)

The current hot-path overhead per incoming frame is roughly:

- one lookup to get the handler for `protocol_id`
- one virtual call into `IProtocolHandler`
- (in your current implementation) one `dynamic_cast`
- a lock to access the protocol map

Because the number of protocols is small, and handler lookups are O(1) average (hash map) or O(log n) worst-case (tree map), this overhead is acceptable at early scale.

---

## Performance Notes (Hot Path)

At “5000 nodes connecting + reading bytes”, routing becomes a hot path. Current costs to watch:

1. **Lock contention** on the protocol handler map
2. **dynamic_cast** on every frame dispatch
3. Handler lookup overhead (especially if using `std::map`)
4. Memory copies when slicing payloads / framing

### Easy future optimizations

- Replace `dynamic_cast` with a stable virtual interface (avoid RTTI):
  - `handler->on_frame(peer, header, payload);`
- Make handler table immutable after startup:
  - store handlers in `std::array<std::shared_ptr<IProtocolHandler>, MAX_PROTO>`
  - then lookup is O(1) and lock-free
- Use `shared_mutex` or RCU-like swap for rare updates
- Ensure framing uses `std::span` and avoids extra memcpy

### Likely best next step

If protocol IDs are bounded (e.g., 0..255), a fixed array lookup is the best tradeoff:

```cpp
std::array<std::shared_ptr<IProtocolHandler>, 256> handlers{};
auto& h = handlers[protocol_id]; // lock-free
```

---

## Next Steps

- **Implement handshake frame type in FrameHeader**  
  Make handshake framing consistent with all other protocols.

- **Trigger handshake automatically on connect**  
  On `net.peer_connected`, immediately send `HandshakeHello` to the new peer.

- **Identity-aware send() API**  
  Add:

  - `send(NodeId, proto, payload)`
  - lookup `PeerId` via `IdentityManager`
  - enforce `PeerStatus::Verified`

- **Add strict invariants**  
  Reject all non-handshake frames from unverified peers, and log violations.

---

## Summary

By introducing:

- a shared **Hello Handshake** (protocol 0),
- a `Peer` object with explicit `PeerStatus`,
- an `IdentityManager` as the source of truth,

JDS Cloud moves from “socket-based communication” to **identity-aware cluster networking**.

This is a foundational step for features like:
- membership + health tracking,
- consistent routing,
- reconnect-safe sessions,
- higher-level protocols (storage replication, gossip, RPC).

---

*If you’re reading this later: check the current implementation for how reconnections are handled (replace vs reject), and ensure the handshake includes enough information to prevent accidental cluster cross-wiring (cluster_id and magic are key).*