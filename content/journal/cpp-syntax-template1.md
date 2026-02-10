---
title: "C++ syntax revision (from cppquiz)"
date: "2026-01-29"
tags: ["C++23 standard"]
description: "Just learn the wired syntax (no body write code like that )"
---

# Question from cppquiz

Have you ever looked at a snippet of C++ and thought you knew exactly which function would be called, only to have the output prove you wrong? Today, we are dissecting a classic puzzle that reveals how the C++ compiler prioritizes regular functions over templates and how the linker handles the resulting symbols.

## The Challenge

Consider the following code. What does it print, and more importantly, **why**?

```cpp
#include <iostream>

// 1. Base Template
template<typename T>
void f(T) {
    std::cout << 1;
}

// 2. Template Specialization
template<>
void f(int) {
    std::cout << 2;
}

// 3. Regular Function (Non-template)
void f(int) {
    std::cout << 3;
}

int main() {
    f(0.0);  // Call A
    f(0);    // Call B
    f<>(0);  // Call C
}
```

#### answer: 
One of the most interesting parts of this behavior is how the linker sees these functions. Because C++ supports overloading, it uses Name Mangling to create unique IDs for the symbol table.

regular function is consider the strong symbol. and template is weak symbol.
Templates are often defined in headers and included in multiple .cpp files. If 10 files call ```f<double>```, you get 10 copies of that code. The linker sees these "Weak" symbols and deduplicates them, keeping only one to prevent "Multiple Definition" errors.

regular > template. if you specifies <> then complier skip the regular function. when found the template, it somehow mark ```f<T>``` means the tmeplate won over the regular one, now it search for specialzation.


## Challenge2

```cpp
#include <iostream>
#include <utility>

struct A
{
    A() { std::cout << "1"; }
    A(const A&) { std::cout << "2"; }
    A(A&&) { std::cout << "3"; }
};

struct B
{
    A a;
    B() { std::cout << "4"; }
    B(const B& b) : a(b.a) { std::cout << "5"; }
    B(B&& b) : a(b.a) { std::cout << "6"; }
};

int main()
{
    B b1;
    B b2 = std::move(b1);
}
```

answer:

```B b1;``` because B has a trivial constructor, the complier help to call member default constructor, and A is trivial constructor as well. so 1 printed. and B(), 4 is printed. and move this trigger copy constructor with xvalue becasue move cast it to &&, and B(B&& b) being called, now a(b.a) as &&b b has name it is lvalue, so A's copy constructor of const A& being called. so 2 and 6 is printed. 

## Challenge 3

```cpp
    
#include <iostream>

void f(float &&) { std::cout << "f"; }
void f(int &&) { std::cout << "i"; }

template <typename... T>
void g(T &&... v)
{
    (f(v), ...);
}

int main()
{
    g(1.0f, 2);
}
```

ans : 
```
g reduce to g<float, int>(float && v1, int&& v2);
but because v1 and v2 is lvalue now, so only valid choice is to
cast it to int to make it prvalue. 
so answer is if not fi.
```


## Challenge 4

```cpp
const size_t maxThreads = 10;
void fill_texture_mt(int thread_id, std::mutex *pm) {
  std::lock_guard<std::mutex> lk(*pm);
  // Access data protected by the lock.
}
void prepare_texture() {
  std::thread threads[maxThreads];
  std::mutex m;
  for (size_t i = 0; i < maxThreads; ++i) {
    threads[i] = std::thread(fill_texture_mt, i, &m);
  }
}
```

ans : 

it is undefine behavior, using thread, and pass local variable address to a thread, you see when prepare_texture()after the for loop, it calls the mutex destructor and threads destructor, and accessing m is ub, and also, thread is destoried but still joinable, it will call std::terminate(). possible fix is use jthread, it will call the join when complete, and make sure mutex is always outlive the thread.