---
title: "JDS Cloud 網路層的死鎖陷阱與重生"
date: "2026-01-11"
tags: ["C++23", "Distributed Systems", "Concurrency", "Networking"]
description: "研究爲什麽會有deadlock，生命周期的影響。解析如何透過 std::stop_token 與 ScopeGuard 解決複雜的併發死鎖問題。"
---

資源的生命週期管理是最大的挑戰。本文將詳細記錄我在開發 TcpTransport 時遇到的兩次重大死鎖問題，以及我們如何利用現代 C++ 特性優雅地瓦解它們。


## 1. 第一種死鎖：自毀死結 (Self-Join Deadlock)

這是我們最初遇到的問題，當時我們嘗試將執行緒（靈魂）封裝在物件（肉體）內部。

### 初始設計（有缺陷）：
```cpp
struct PeerState {
    int fd;
    std::thread reader; 

    ~PeerState() {
        if (reader.joinable()) reader.join(); // 問題根源：析構時 Join
        ::close(fd);
    }
};
```

### 死鎖具體原因：

1. **觸發銷毀**：Reader 執行緒在 `recv()` 回傳 0（對端關閉）後，主動發起清理邏輯，將自己從全局 Map 中移除。

2. **觸發析構**：當 `peer_fds_.erase(id)` 被調用時，`PeerState` 的析構函數被觸發。

3. **自毀衝突**：`PeerState` 的析構函數嘗試執行 `reader.join()`。但此時執行 `join()` 的正是 Reader 執行緒自己。

4. **結果**：執行緒在等待自己結束，進入無限等待狀態。


## 2. 第二種死鎖：同步資源競爭 (Mutex Contention Deadlock)

當我們將執行緒移出 `PeerState` 並引入全域註冊表後，遇到了更隱蔽的死鎖。

### 問題代碼：
```cpp
void TcpTransport::stop() {
    std::lock_guard lk(mu_); // 持有全域鎖
    // ...
    reader_threads_.clear(); // 觸發 jthread 析構，執行 Join
}
```

### 死鎖具體原因：

1. **主執行緒**：進入 `stop()`，獲取了全域鎖 `mu_`。隨後調用 `reader_threads_.clear()`，開始等待所有 Reader 執行緒匯合（Join）。

2. **Reader 執行緒**：收到停止信號，準備結束。但在結束前，它必須執行清理工作（如 `finalize_peer_lifecycle_`）。

3. **競爭點**：清理工作需要獲取全域鎖 `mu_` 來把自己從名單移除。

4. **結果**：主執行緒拿著鎖等執行緒結束；執行緒等主執行緒放開鎖好讓自己結束。雙方死結。

### 1. 調用方（Caller Side）的完整處理邏輯

在我們的事件驅動架構中，`main` 函數（或協議處理層）不需要處理任何 Socket 細節。它只需像「處理郵件」一樣處理 `TransportEvent`。

#### 實作範例：高併發事件處理迴圈

```cpp
int main() {
    jds::net::TcpTransport transport;
    transport.start_listen({"127.0.0.1", 5000});

    while (g_running.load()) {
        // 1. 輪詢事件：此處內部會自動進行「執行緒收割 (Reaping)」
        auto ev_res = transport.poll_event();
        
        if (!ev_res || !ev_res->has_value()) {
            std::this_thread::sleep_for(std::chrono::milliseconds(5));
            continue;
        }

        const auto& event = **ev_res;

        // 2. 根據事件類型進行商務邏輯分發
        switch (event.kind) {
            case TransportEventKind::MessageReceived:
                // 此處得到的 bytes 是已經「去框架化」的完整 Message
                handle_business_logic(event.peer_id, event.bytes);
                break;

            case TransportEventKind::PeerDisconnected:
                // 當 Reader 執行緒退出時，我們會收到此通知
                std::cout << "Peer " << event.peer_id.value << " left\n";
                break;

            default: break;
        }
    }

    // 3. 優雅停機：呼叫 stop() 會強制喚醒所有阻塞在 recv 的執行緒並匯合
    transport.stop(); 
    return 0;
}
```

### 2. 關鍵特性 A：std::stop_token (C++20/23)
```std::stop_token``` 是現代 C++ 引入的一種執行緒安全的非同步請求機制。

- 非同步喚醒：當我們調用 jthread 的析構函數或 request_stop() 時，token 會被標記。

- 優雅整合：它與 std::jthread 深度集成，自動發送停止請求並執行 join()，防止執行緒遺失。

- 協作式終止：執行緒可以隨時通過 stoken.stop_requested() 檢查自己是否該退出，避免了「暴力殺掉 (Kill)」導致的資源損壞。

### 3. 關鍵特性 B：ScopeGuard (模擬 std::scope_exit)
```scope_exit``` 的核心目標是實現 「確保清理 (Guaranteed Cleanup)」。無論函數是正常結束、透過 break 跳出、或是因為異常拋出，預設的清理代碼都一定會執行。

#### 為什麼我們用自定義 Struct 而不是 std::scope_exit？
細節解析：

1. 命名與提案爭議：scope_exit 原本屬於 C++20 提案，但最終被放入了 Library Fundamentals TS (Technical Specification)。

2. 標準化的猶豫：委員會在標準化過程中對其功能有爭論：

    - 應不應該有 scope_fail（僅在異常時執行）？
    - 應不應該有 scope_success（僅在成功時執行）？

3. 現狀：雖然它在 std::experimental 中，但大多數開發者偏好寫一個 5 行的 ScopeGuard 結構體。這樣既能獲得相同的 RAII 保證，又不需要依賴實驗性標頭檔。

#### 其中「無 goto」實作：
```C++
template<typename F>
struct ScopeGuard {
    F func;
    ~ScopeGuard() { func(); } 
};

void reader_loop(std::stop_token stoken, PeerId pid) {
    // 註冊清理邏輯
    ScopeGuard guard{[this, pid] {
        this->finalize_peer_lifecycle_(pid); // 解決死鎖的關鍵邏輯分離處
    }};

    while (!stoken.stop_requested()) {
        // ... 如果此處 break，guard 會自動執行 ...
    }
}
```

# 3. 終極解決方案：靈肉分離 + 右值轉移

我們透過「先解除阻塞，再鎖外匯合」的策略徹底解決了問題。

## 修復後的 `stop()` 實作：
```cpp
void TcpTransport::stop() {
    running_.store(false);

    // 1. 強制喚醒：解除所有核心態阻塞 (::recv)
    {
        std::lock_guard lk(mu_);
        for (auto& [id, ps] : peer_fds_) {
            ::shutdown(ps->fd, SHUT_RDWR); // 關鍵：讓 recv 報錯返回
        }
    }

    // 2. 右值轉移：將執行緒控制權移出鎖外
    std::unordered_map<u64, std::jthread> dying_threads;
    {
        std::lock_guard lk(mu_);
        dying_threads.swap(reader_threads_); // 快速交換，不執行 Join
    } // 釋放 mu_

    // 3. 鎖外析構：此時執行 Join 不會與 Reader 執行緒搶鎖
    dying_threads.clear(); 
}
```

## 4. 關鍵技術深度解析

### A. `std::stop_token` (C++20)

* **用途**：實現協作式停止。主執行緒發出停止請求，背景執行緒透過 `stoken.stop_requested()` 感知。
* **優點**：它是執行緒安全的，且與 `std::jthread` 完美集成，不需要手動管理額外的原子變量。

### B. `ScopeGuard` 與 `std::scope_exit`

為了保證「無論如何退出函數，都要執行清理」，我們使用了 `ScopeGuard`。

#### 為什麼 `std::scope_exit` 不在 `std` 裡？

* `scope_exit` 最初在 Library Fundamentals TS (Technical Specification) 中定義，尚未正式併入 C++ 標準庫主名空間（如 `std::`）。
* 委員會對其設計（如是否應處理異常）仍有討論，因此目前多數工程實踐是自定義一個簡單的 RAII Struct。

#### 我們的實作：
```cpp
template<typename F>
struct ScopeGuard {
    F func;
    ~ScopeGuard() { func(); } 
};

// 使用範例：
void reader_loop(...) {
    ScopeGuard guard{[this, pid] {
        this->finalize_peer_lifecycle_(pid); // 確保 ID 必被回收
    }};
    // ... 迴圈邏輯 ...
}
```

## 5. 調用方 (Caller Side) 的使用體驗

重構後，調用方不再需要擔心複雜的執行緒同步，只需要關注事件處理。
```cpp
// Caller Side: main.cpp
while (g_running.load()) {
    auto ev_res = transport.poll_event(); // 內部自動執行執行緒收割
    
    if (ev_res && ev_res->has_value()) {
        const auto& e = **ev_res;
        if (e.kind == TransportEventKind::MessageReceived) {
            // 處理完整的、Framed 的訊息
            process_data(e.bytes);
        }
    }
}
```