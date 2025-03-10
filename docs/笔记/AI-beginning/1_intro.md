# introduction

> https://github.com/microsoft/AI-For-Beginners/blob/main/lessons/1-Intro/README.md#pre-lecture-quiz

## 为什么是 AI

一直以来，我们使用计算机的统一思想是，让它做一件事，提前设计好应该先做什么、再做什么（这表现为*编程*），然后点击运行按钮，程序就会按照控制流跑下去，完成我们需要让它做的事。

这一直表现的很好，因为发展到今天，绝大部分需求，都能够准确用逻辑程式表达出来。但是，仍然有一部分感性的任务，没有办法（或者很难地）用严谨的程序设计来表达，而是由**概率**决定的。这就是 AI 的用处了。如，给出一个图，判断图中的人几岁？这本身就是很主观的一个问题，不同的人有不同的回答。但是你总能拿到最高概率（置信度）的答案。

## AI 的分类

分为:

- weak AI: 弱人工智能，即针对某一领域的专家型 AI。这种 AI 并没有真正的人类理解能力，而是针对某一知识领域的算法。
- strong AI: Artificial General Intelligence(AGI)，通用人工智能，拥有人类的智力与理解水平的 AI。暂未实现。

### 智能(Intelligence) 的定义

如何定义“智慧”，或者说是“智能”？你家的小猫或者狗子聪明不聪明？什么叫做聪明呢？乌鸦喝水的故事说明它有智慧吗？这个问题本身不同的人会有不同的答案。当我们谈论到 AGI 的时候，我们需要一个方式来判断 AI 是不是达到了“公认的、真的”智能。这就是著名的“图灵测试”。

> https://en.wikipedia.org/wiki/Alan_Turing

## 两种尝试方式

如果希望计算机能够表现出像人类一样的行为，那么我们就需要通过某种方式，让计算机模拟(model)人的大脑。这就需要我们研究研究我们自己的大脑是怎么工作的。

### 通过 Symbolic Reasoning

一个直观的方式就是我们模拟人类的思考。我们思考的时候在想知识，并且能够根据这些知识来推理出合理的答案。我们尝试将这个过程用计算机模拟出来，就是 **Symbolic Reasoning**。

> It involves:
> 1. extracting knowledge from a human being, and representing it in a computer-readable form. 
> 2. Develop a way to model reasoning inside a computer.

这种方式依赖于用计算机来**表达知识**并**推理**。它有一些缺点：

1. 知识表达：将大量的知识录入计算机，同时保证它的准确、高质量，是一项繁重的人力任务。这一点直接导致了 [AI winter](https://en.wikipedia.org/wiki/AI_winter)；
2. 推理：根据知识来推理并不是万能的。比如，让你判断图片中的人几岁？你很难描述自己所想的过程，自己用到了什么知识，又是怎么推理的。这个过程并不好模拟！这不是简单的知识操控。

### 通过 Neural Networks

另一个方式则是通过直接模拟人脑本身的这个实体：本质就是无数个神经元(neuron)，组成了一个 **neural networks(神经网络)**。我们称之为人工神经网络(artificial neural network)。然后让它像婴儿学习一样，观察我们给出的**样例**数据，学习并给出答案。

> This approach models the structure of a human brain, consisting of a huge number of simple units called neurons. 
> Each neuron acts like a weighted average of its inputs, and we can train a network of neurons to solve useful problems by providing training data.

这种方式的特点是，需要大量的数据集进行训练。

## 历史

在一开始，发展是重在符号推理的，因为神经网络需要很大的计算资源，这在20世纪是不可获得的。符号推理发展出了 AI 寒冬，而计算机硬件的迭代反而让神经网络变得可行。

在 2023 年，GPT 大致上经历这样的过程：网络上**大量**的文本数据，能够支撑 GPT 去学习和理解文本结构与含义，然后再将这个已经可以进行文本理解和处理的通用模型，应用在某个特定的领域、更加特定的文本工作。