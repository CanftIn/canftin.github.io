---
layout: post
title: Quick Clojure Review
category: PL
tags: lisp, Clojure
keywords: lisp, Clojure
description: Quick Clojure Review
---
# What Is Clojure?
[Clojure](https://clojure.org/) is a functional, symbiotic, and homoiconic programming language.
-  Functional: where functions are first-class citizens and mutating
state is frowned upon
-  Symbiotic: the language is intended to be run atop a host.
environment
-  Homoiconic: “code is data” — this helps facilitate a macro system for rewriting the language.

# Data Structures
Clojure provides a language API based upon a select set of data structures. 
-  List: (1 2 3)
-  Vector: [1 2 3]
-  Map: {:foo "bar"}
-  Set: #{1 2 3}

## List
A list uses parentheses as its surrounding delimiters, and so an empty list would look like (), whereas a list with three elements could look like ("a" "b" "c").

Clojure will happily hide those details away from you and provide abstractions that make dealing with data structures in the most appropriate and performant manner very easy.

By using the `cons` function, which will insert your value at the beginning of the list.
```lisp
(cons 4 '(1 2 3))
;; (4 1 2 3)
```
Or, `conj` function instead, which will pick the correct method for inserting the new value at the start of the list.
```lisp
(conj '(1 2 3) 4)
;; (4 1 2 3)
```
But, if your data structure were a vector collection instead, then the conj function would know to insert the value at the end of the collection.
```lisp
(conj [1 2 3] 4)
;; [1 2 3 4]
```
There are other abstraction functions:
```lisp
(peek [1 2 3]) ;; 3
(peek '(1 2 3)) ;; 1
(pop [1 2 3]) ;; [1 2]
(pop '(1 2 3)) ;; (2 3)
```
## Vector
Vectors allow you to have index access to any element within the data structure.
```lisp
(get [1 2 3 4 5] 3)
;; 4
```
You can modify the vector by using the assoc function (which is an abbreviation of “associate”). The way it works is that you provide the index of the vector you want to modify and then provide the value.
```lisp
(assoc [1 2 3 4 5] 5 6)
;; [1 2 3 4 5 6]
(assoc [1 2 3 4 5] 0 8)
;; [8 2 3 4 5]
```
but what if you want to remove a value? One way to do this would be to use the pop function, which returns a copy of the vector but with the last element removed. 
```lisp
(pop [1 2 3 4 5])
;; [1 2 3 4]
```
## Map
The map data structure goes by many different names—hash, hash map, dictionary—and what distinguishes it from other data structures is the underlying implementation, which is a key part of ensuring the algorithmic performance of this particular data structure.
```lisp
{:my-key "this is my value"}
(get {:my-key "this is my value"} :my-key)
;; "this is my value"

;; If you want the entire entry
(find {:a 1 :b 2} :a)
;; [:a 1]

(assoc {:foo "bar"} :baz "qux")
;; {:foo "bar", :baz "qux"}

(dissoc {:foo "bar" :baz "qux"} :baz)
;; {:foo "bar"}

(select-keys {:name "Mark" :age 33 :location "London"} [:name :location])
;; {:name "Mark", :location "London"}
```
### Keywords
Some readers may be wondering what the colon prefixing the key is supposed to mean. The colon indicates that the key is actually a keyword. 
```lisp
;; Keyword as a Function
(get {:foo "bar" :baz "qux"} :baz)
;; "qux"
(:baz {:foo "bar" :baz "qux"})
;; "qux"

;; Demonstrate the contains? Function
(contains? {:foo "bar" :baz "qux"} :foo)
;; true
```
### Keys, Values, and Replacement
```lisp
;; Demonstrate the keys and vals Functions

(keys {:foo "bar" :baz "qux"})
;; (:baz :foo)
(vals {:foo "bar" :baz "qux"})
;; ("qux" "bar")
```
The replace function allows you to create a new vector consisting of values extracted from a map data structure. 
```lisp
;; Demonstrate the replace Function

(replace {:a 1 :b 2 :c 3} [:c :b :a])
;; [3 2 1]
(replace [:a :b :c] [2 1 0])
;; [:c :b :a].
```
## Set
A set is a data structure made up of unique values. Much like Clojure’s map and vector data structures, it provides Clojure with a very lightweight data model. 
```lisp
;; Simple Set Data Structure Example

#{1 2 3 :a :b :c}
;; #{1 :c 3 2 :b :a}

;; Filter Out Duplicates
(set [1 1 2 2 3 3 4 5 6 6])
;; #{1 4 6 3 2 5}
(apply sorted-set [1 1 2 2 3 3 4 5 6 6])
;; #{1 2 3 4 5 6}

;; Using conj to Add New Value to a Set
(conj #{1 2 3} 4)
;; #{1 4 3 2}
(conj #{1 2 3} 3)
;; #{1 3 2}

;; Remove Items from a Set with disj
(disj #{1 2 3} 3)
;; #{1 2}
```
# Functional Programming
-  Immutability
-  Referential transparency
-  First-class functions
-  Partial application
-  Recursive iteration
-  Composability

## Immutability
If you have state and it can change, then once your application becomes distributed and concurrent, you’ll end up in a world of hurt, as many different threads can start manipulating your data at non-deterministic times. This can cause your application to fail at any given moment and become very hard to debug and to reason about. By offering immutability, Clojure can help to side-step this problem. In Clojure, every time you manipulate a data structure you are returned not a mutated version of the original, but rather a whole new copy with your change(s) applied.
## Referential transparency
Referential transparency is when an expression can be replaced by its value without changing the behavior of a program. 
```lisp
;; Example of a Referentially Transparent Function
(defn sum [x y]
 (+ x y))
(sum 1 1)
;; 2
```
The function sum (shown in Listing 3-1) is referentially transparent. No matter what happens, if I provide the same set of arguments (in this case 1 and 1), I’ll always get back the same result.
## First-class Functions
For a language to offer “first-class functions,” it needs to be able to both store functions and pass functions around as if they were values. We’ve already seen the former being achieved using variables, and the latter (passing functions around as values) is also possible within Clojure.
-  complement
-  apply
-  map
-  reduce
-  filter
-  comp

### complement
```lisp
;; Example of the complement function returning the opposite truth value
((complement empty?) "")
;; false
```
### apply
```lisp
(apply str ["a" "b" "c"])
;; "abc"
```
### map
```lisp
;; Example of map
(map inc [1 2 3])
;; (2 3 4)

;; The map Return Value Type Is a List
(map
  (fn [[k v]] (inc v))
  {:a 1 :b 2 :c 3}) ;; => (4 3 2)
;; (2 3 4)

;; Ensure map Returns Key/Value-like Data Structure
(map
  (fn [[k v]] [k (inc v)])
  {:a 1 :b 2 :c 3})
;; ([:c 4] [:b 3] [:a 2])
```
### reduce
```lisp
;; Example of the reduce Function
(reduce + [1 2 3 4])
;; 10
```
### filter
```lisp
;; Example of the filter Function
(filter even? (range 10))
;; (0 2 4 6 8)
```
### comp
```lisp
;; Example of the comp Function
((comp clojure.string/upper-case (partial apply str) reverse) "hello")
;; "OLLEH"
```
## Partial application
Partial application helps to promote the creation of functions that can expand their use cases beyond their initial intent. 
The concept of partial application is regularly confused with another functional concept known as currying (which Clojure doesn’t support). When you “curry” a function, the function’s arguments are expanded internally into separate functions.
A curried function won’t execute its body until all arguments have been provided (similar to partial application). So, again, if your function accepted three arguments you could effectively call your curried function in one of the following ways.
```javascript
// Internal Representation of a Curry-Compiled Output
function f(a) {
    function (b) {
        function (c) {
            return a + b + c;
        }
    }
}
foo('x')('y')('z') // 'xyz'
```
So, just to recap, the main differences between currying and partial application are as follows.
1. You only partially apply your values once. So, if your function takes three arguments and you partially apply two of them, then when your resulting function is called you only provide one argument. If you had instead partially applied only one argument, you would still only call the resulting function once (but this time you would have to provide the remaining two arguments).
2. If we consider the “API” scenario from earlier, you are providing the initial values for the partially applied function, whereas with a curried function it is the user who provides the arguments.

## Recursive Iteration
The classic for loop you’re likely familiar with `for (i = 0; i < 10; i++) {}` by design allows mutating local variables to increment the loop. In Clojure, local variables are immutable, and so for us to loop we need to use recursive function calls instead.
Instead of looping, you’ll typically need to use the `loop/recur` special form, although a lot of the time other iterator-style functions such as map, reduce, and filter will be better fitted to solving the problem at hand. 
The main benefit of the `loop/recur` special form is that it allows you to safely apply recursive function calls without exhausting your memory stack. For example, if you’ve ever written any JavaScript code in your life you’ll likely have hit a problem at least once where you’ve exhausted the stack and caused a “stack overflow” error.
```lisp
;; Example of Stack Exhaustion
(defn count-down [x]
  (if (= x 0)
    (prn "finished")
    (count-down (do (prn x) (dec x)))))
(count-down 10) ;; works exactly as previous example BUT it's not safe!
(count-down 100000) ;; will cause a "StackOverflowError"
```
Resolving the problem with the code will require a  process that the else statement need to be modified so that instead of returning a function call to count-down you return a function. 
```lisp
;; Example of trampoline Function
(defn count-down [x]
  (if (= x 0)
    (prn "finished")
    #(count-down (do (prn x) (dec x)))))
(trampoline count-down 10) ; works fine still
(trampoline count-down 100000) ; no longer triggers an error
```
Remember: #(...) is a shorthand syntax for an anonymous function.
## Composability
The main reason this is such a key aspect of functional programming is that your units of functionality should be generic enough to be reused within many different contexts, rather than being overly specific to one environment and ultimately not being reusable.
# Sequences
In Clojure we have many types of collections: lists, vectors, maps, and sets. Each of these collections is also a sequence. 
```lisp
;; Example of Triggering Side-effect Only (No Modifications)
(doseq [element '(:a :b :c)]
  (prn (str (name element) "!")))
;; "a!"
;; "b!"
;; "c!"
;; nil

;; Example of for Loop
(for [element '(:a :b :c)]
  (prn (str (name element) "!")))
;; (nil nil nil)
```
In the preceding example, the code loops over the given collection with the intention of creating a new list based upon the result of each iteration. But because we’ve not returned anything from the body for each iteration, we end up with (nil nil nil) being returned.
## List Comprehension
```lisp
;; Use of map to Mimic for Example
(map
  (fn [element]
    (prn (str (name element) "!")))
   '(:a :b :c))
```

# Functions
The Clojure programming language is built on the foundation of functional programming, which itself suggests a language rich in functions.
## Anonymous Function Shorthand
```lisp
;; Accessing Function Arguments Within Shorthand Syntax
(map #(+ (+ 2 %1) 2) [1 2 3])
;; (5 6 7)
```
## Pre and Post Conditions
One really powerful feature available in Clojure is the ability to execute code just *before* and just *after* the function body itself. This allows us, for example, to validate the function arguments as they come in as well as validate the result of the function is as expected.
```lisp
;; Syntax Structure for Pre/Post Conditions
(defn <fn-name> [<args>]
    {:pre [<fn1>, <fn2>, ...]
     :post [<fn1>, <fn2>, ...]}
    (<fn-body>))

;; Example of Pre/Post Conditions
(defn my-sum [f, g]
    {:pre [(integer? f), (integer? g)]
     :post [(integer? %)]}
    (+ f g))

;; (my-sum "2" 2))  -->   Exception:
AssertionError Assert failed: (integer? f) user/my-sum
(form-init611908878853766826.clj:1)

;; Modified Pre/Post Condition Logic
(defn my-sum [f, g]
    {:pre [(integer? f), (integer? g)]
     :post [(integer? %)]}
    (str "Result: " (+ f g)))

;; (my-sum "2" 2))  -->   Exception:
AssertionError Assert failed: (integer? %) user/my-sum
(form-init611908878853766826.clj:1)

;; Modified Pre/Post Condition Logic to Fix Post Error
(defn my-sum [f, g]
    {:pre [(integer? f), (integer? g)]
     :post [(string? %)]}
    (str "Result: " (+ f g)))
;; (my-sum "2" 2))  -->  "Result: 4"
```
## clojure.core
The *clojure.core* namespace contains functions and macros for dealing with all sorts of requirements. 


















