---
title: "C++ useful design pattern"
date: "2026-03-17"
tags: ["C++23 standard"]
description: "learn design pattern"
---


# todo
builder pattern
fluent registration DSL

like in DragonflyDB 
```cpp
*registry
    << CI{handler1}
    << CI{handler2}
    << CI{handler3}
    << done;
```

```cpp
builder 

class CarBuilder {
    Car car;

public:
    CarBuilder& engine(std::string e) {
        car.engine = e;
        return *this;
    }

    CarBuilder& wheels(int w) {
        car.wheels = w;
        return *this;
    }

    Car build() {
        return car;
    }
};
// safe mode

template<bool EngineSet, bool WheelsSet>
class CarBuilder;

using Builder = CarBuilder<false, false>;

template<bool WheelsSet>
class CarBuilder<false, WheelsSet> {
public:
    auto engine(std::string e) {
        CarBuilder<true, WheelsSet> next;
        next.car.engine = e;
        return next;
    }
};

template<>
class CarBuilder<true, true> {
public:
    Car build() {
        return car;
    }
};

Builder().build();   // compile error
```