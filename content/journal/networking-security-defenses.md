---
title: "開發日誌：網路層安全隱患與節點身份識別（Node Identity）的引入"
date: "2026-01-13"
tags: ["Development", "Networking", "Security", "C++23", "JDS Cloud"]
description: "記錄 JDS Cloud 網路層的最新開發進展，重點分析當前面對的 6 大安全隱患，以及目前正在優先實作的 Node Identity 識別機制。"
---

在完成基礎的 TCP 傳輸架構後，系統目前的開發重心已全面轉向**安全性（Security）**與**魯棒性（Robustness）**。這幾天我們正在針對網路層可能遭受的攻擊進行深度加固，其中最重要的擴展功能便是「節點身份識別（Node Identity）」。

### 🚧 目前開發進展：優先解決 Node Identity

在分佈式系統中，任何一個能連接上 Port 的節點都不應被默認信任。我目前的開發首要目標是確保只有經過授權的節點能加入集群。

**目前的實作進度：**
1. **Handshake 協議擴展**：連線建立後的第一個動作不再是數據傳輸，而是強制性的身份交換。
2. **NodeID 驗證**：每個節點擁有唯一的 `NodeID`。
3. **共享金鑰（Shared Secret）**：引入預定義的密鑰校驗，防止偽造節點（Identity Spoofing）接入。這是我們解決「身份冒充」風險的第一道防線。

---

### 🔍 網路層面臨的 6 大安全隱患（開發計畫中）

除了正在進行的身份識別，以下是我們這幾天同步在解決的核心安全問題：

#### 1. 內存爆破 (OOM via Large Frame)
* **隱患**：若攻擊者發送偽造的高額長度前綴（如 2GB），系統會因 `vector.resize()` 導致 OOM。
* **對策**：實作 `MAX_FRAME_SIZE`（預計 16MB）硬性限制，超限即斷開。

#### 2. 慢速攻擊 (Slowloris)
* **隱患**：攻擊者建立連線後極慢速發送數據，佔用執行緒資源。
* **對策**：引入 `SO_RCVTIMEO` 設置 Read Timeout。

#### 3. 文件描述符耗盡 (FD Exhaustion)
* **隱患**：大量惡意連線耗盡作業系統 FD 資源。
* **對策**：在 `TcpTransport` 設置 `max_connections_` 上限，達標後直接拒絕新連線。

#### 4. 身份冒充 (Identity Spoofing)
* **隱患**：非集群節點發送惡意指令。
* **對策**：**正在實作中（Node Identity）**，結合 NodeID 與金鑰驗證。

#### 5. 明文傳輸風險
* **隱患**：TCP 數據在公網易被監聽（MITM）。
* **對策**：中期計畫引入 TLS/mTLS 加密傳輸層。

#### 6. 幽靈連線 (Half-Open)
* **隱患**：網路異常導致連線死掛，資源無法釋放。
* **對策**：開啟 TCP Keepalive 探測機制。

---