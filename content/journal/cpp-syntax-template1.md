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

## Challenge 5

```cpp
#include <iostream>

int main() {
  void * p = &p;
  std::cout << bool(p);
}
```
ans: 1 

in c++ 

type | declarator | initializer 

the declarator is registered, and the type is void *, when the initilizer try to name look up, it check the p, p exist and it check the type it is valid type and semantic correct, so when the initilizer try to &p, it is valid, and p has storage duration, so it can do it. 

more if the type is auto 


auto p = &p;

when the name look up for p, it found, but the type is auto which needs to be comfirmed when the initializer is completed, and the type of p is placehold type, type is not yet deduced, so it cannot be odr-used in the initializer.

ODR-used is a technical term from the C++ standard.
It means an object or function is used in a way that requires its definition and its actual type/value to exist.

in the lambda it is same: 

```cpp
auto f = [](){
    f()
};
```
like it cannot compile, the type is auto, the declarator is f, and the initilizer is lambda, the compiler can construct the closure type but when construct the operator (), it name look up f, the f has type auto which is not yet deduced, you cannot ODR-used it. 

the solution is give it a type
function<void()> f, 
or 
y combinator, 
auto f = [](this auto&&self){
    self.f()
};

the opreator () becomes a template function, 

template<T>
operator()(this T&&self){
    self();
};

the recursive dependency is moved from the variable being declared to a function template parameter that can be deduced later.

```
auto f = [](auto self, int n) -> void {
    if (n == 0) return;
    self(self, n - 1);
};

f(f, 3);

struct __lambda {
    template<class Self>
    void operator()(Self self, int n) const {
        if (n == 0) return;
        self(self, n - 1);
    }
};
the lambda would look like this,
void operator()<__lambda>(__lambda self, int n) const
```

if dont want to use this, pass the 
f to it, so the auto in the lambda becomes __lambda

"""this""" is a keyword that tells the compiler that the parameter is the object parameter (the object on which the member function is invoked).

it has to be in the first parameter and the this keyword has to put at the left most place. 

```cpp
const this ... is not valid
and f(int x, this ...) is not valid. 
```

and also when you use this 

- it cannot be virtual
- it cannot override a virtual function

## Challenge 6

```cpp
#include <iostream>

class A
{
public:
    A() { std::cout << "A"; }
    A(const A &) { std::cout << "a"; }
};

class B: public virtual A
{
public:
    B() { std::cout << "B"; }
    B(const B &) { std::cout << "b"; }
};

class C: public virtual A
{
public:
    C() { std::cout << "C"; }
    C(const C &) { std::cout << "c"; }
};

class D: B, C
{
public:
    D() { std::cout << "D"; }
    D(const D &) { std::cout << "d"; }
};

int main()
{
    D d1;
    D d2(d1);
}

```

answer :  ABCDABCd

D d1 would become like 
```
class D: B, C
{
public:
    D() :A(), B(), C() { std::cout << "D"; }
    D(const D &):A(), B(), C() { std::cout << "d"; }
};
```

virtual base classes are initialized in the order they appear on a depth-first left-to-right traversal of the directed acyclic graph of base classes, where “left-to-right” is the order of appearance of the base classes in the derived class base-specifier-list.

if you want to call the copy constructor

```
class D: B, C
{
public:
    D() :A(), B(), C() { std::cout << "D"; }
    D(const D & other):A(other), B(other), C(other) { std::cout << "d"; }
};
```