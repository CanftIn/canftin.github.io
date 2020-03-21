---
layout: post
title: CharSequence
description: JDK source analysis
permalink: /JDK/java.lang/CharSequence.html
katex: true
---
# CharSequence
---
*interface* **CharSequence**

字符序列接口，封装了对字符序列的一些操作（包括转换为流的操作）

- Java 11新增Compare方法
```Java
// 按字典顺序比较两个字符序列
static int compare(CharSequence cs1, CharSequence cs2) {
    if(Objects.requireNonNull(cs1) == Objects.requireNonNull(cs2)) {
        return 0;
    }
    
    if(cs1.getClass() == cs2.getClass() && cs1 instanceof Comparable) {
        return ((Comparable<Object>) cs1).compareTo(cs2);
    }
    
    for(int i = 0, len = Math.min(cs1.length(), cs2.length()); i<len; i++) {
        char a = cs1.charAt(i);
        char b = cs2.charAt(i);
        if(a != b) {
            return a - b;
        }
    }
    
    return cs1.length() - cs2.length();
}
```

- 返回该字符序列的子序列
```Java
CharSequence subSequence(int start, int end);
```

- 将当前char序列转为流序列，序列中每个元素是char
```Java
public default IntStream chars() {
  class CharIterator implements PrimitiveIterator.OfInt {
      int cur = 0;

      public boolean hasNext() {
          return cur < length();
      }

      public int nextInt() {
          if (hasNext()) {
              return charAt(cur++);
          } else {
              throw new NoSuchElementException();
          }
      }

      @Override
      public void forEachRemaining(IntConsumer block) {
          for (; cur < length(); cur++) {
              block.accept(charAt(cur));
          }
      }
  }

  return StreamSupport.intStream(() ->
          Spliterators.spliterator(
                  new CharIterator(),
                  length(),
                  Spliterator.ORDERED),
          Spliterator.SUBSIZED | Spliterator.SIZED | Spliterator.ORDERED,
          false);
}
```

- 将当前Unicode符号序列转为流序列，序列中每个元素是Unicode符号
```Java
public default IntStream codePoints() {
    class CodePointIterator implements PrimitiveIterator.OfInt {
        int cur = 0;

        @Override
        public void forEachRemaining(IntConsumer block) {
            final int length = length();
            int i = cur;
            try {
                while (i < length) {
                    char c1 = charAt(i++);
                    if (!Character.isHighSurrogate(c1) || i >= length) {
                        block.accept(c1);
                    } else {
                        char c2 = charAt(i);
                        if (Character.isLowSurrogate(c2)) {
                            i++;
                            block.accept(Character.toCodePoint(c1, c2));
                        } else {
                            block.accept(c1);
                        }
                    }
                }
            } finally {
                cur = i;
            }
        }

        public boolean hasNext() {
            return cur < length();
        }

        public int nextInt() {
            final int length = length();

            if (cur >= length) {
                throw new NoSuchElementException();
            }
            char c1 = charAt(cur++);
            if (Character.isHighSurrogate(c1) && cur < length) {
                char c2 = charAt(cur);
                if (Character.isLowSurrogate(c2)) {
                    cur++;
                    return Character.toCodePoint(c1, c2);
                }
            }
            return c1;
        }
    }

    return StreamSupport.intStream(() ->
            Spliterators.spliteratorUnknownSize(
                    new CodePointIterator(),
                    Spliterator.ORDERED),
            Spliterator.ORDERED,
            false);
}
```













