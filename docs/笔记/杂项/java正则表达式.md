# Java 正则表达式

## 1. 正则表达式包 java.util.regex

- Pattern类：

  pattern 对象是一个正则表达式的编译表示。Pattern 类没有公共构造方法。要创建一个 Pattern 对象，你必须首先调用其公共静态编译方法，它返回一个 Pattern 对象。该方法接受一个正则表达式作为它的第一个参数。

- Mather类：

  Matcher 对象是对输入字符串进行解释和匹配操作的引擎。与Pattern 类一样，Matcher 也没有公共构造方法。你需要调用 Pattern 对象的 matcher 方法来获得一个 Matcher 对象。

- PatternSyntaxException类：

  一个非强制异常类，它表示一个正则表达式模式中的语法错误。

Q:为什么java工具类很多都不提供公共构造方法？

A:因为没有必要。`单例设计模式`：保证在整个生命周期里使用的都是同一个实例。

## 2. 正则表达式语法

- `\\` 的含义

  在其他语言中，这表示在正则表达式中插入一个普通的反斜杠。在java中，这表示插入一个正则表达式的反斜线，其后面的字符有特殊意义。

## 正则表达式使用举例

```java
//一个很标准的正则表达式用法
import java.util.regex.Matcher;
import java.util.regex.Pattern;
 
public class RegexMatches
{
    private static final String REGEX = "\\bcat\\b";
    private static final String INPUT =
                                    "cat cat cat cattie cat";
 
    public static void main( String[] args )
    {
       Pattern p = Pattern.compile(REGEX);
       Matcher m = p.matcher(INPUT); // 获取 matcher 对象
       int count = 0;
 
       while(m.find()) {
         count++;
         System.out.println("Match number "+count);
         System.out.println("start(): "+m.start());
         System.out.println("end(): "+m.end());
      }
    }
}
```

## matches，find，lookingAt方法

他们都用来尝试匹配一个序列模式。不同点：

- matches是整个序列匹配；
- find是寻找子串；
- lookingAt虽然不需要整句匹配，但是需要从第一个字符开始匹配。

## replaceFirst()、replaceAll()和appendReplacement()、appendTail()方法

- ```java
  String replaceFirst(String replacement);
  String replaceAll(String replacement);
  void appendReplacement(StringBuffer sb, String replacement);
  void appendTail(StringBuffer sb);
  ```

- replaceFirst 和 replaceAll 方法用来替换匹配正则表达式的文本。不同的是，replaceFirst 替换首次匹配，replaceAll 替换所有匹配。

- 将当前匹配子串替换为指定字符串，并且`上次匹配子串之后的字符串段+替换后的子串`添加到一个StringBuffer对象里，而appendTail(StringBuffer sb) 方法则将最后一次匹配工作后剩余的字符串添加到一个StringBuffer对象里。

```java
import java.util.regex.Matcher;
import java.util.regex.Pattern;
 
public class RegexMatches
{
   private static String REGEX = "a*b";
   private static String INPUT = "aabfooaabfooabfoobkkk";
   private static String REPLACE = "-";
   public static void main(String[] args) {
      Pattern p = Pattern.compile(REGEX);
      // 获取 matcher 对象
      Matcher m = p.matcher(INPUT);
      StringBuffer sb = new StringBuffer();
      while(m.find()){
         m.appendReplacement(sb,REPLACE);
      }
      m.appendTail(sb);
      System.out.println(sb.toString());
   }
}
```
