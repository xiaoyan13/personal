---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "xiaoyan13's personal Library"
  text: "hello 👏 \nwelcome here!"
  tagline: 你好，这里是一个记录笔记、琐碎 markdown 的地方。
  actions:
    - theme: brand
      text: 开始阅读
      link: /笔记/
    - theme: alt
      text: 📂 查看源码 
      link: https://github.com/xiaoyan13/personal

features:
  - title: 原生 Markdown
    details: 使用原生 Markdown 和 HTML 语法编写和记录笔记，每一个页面都是 Markdown 文件。
    icon: 📃

  - title: github actions 自动部署
    details: "基于 Vite 的 SSG, 通过 <a href='https://docs.github.com/zh/actions/learn-github-actions/understanding-github-actions'>github actions</a> 自动化部署到 <a href='https://www.netlify.com/'>netlify</a> 上。"
    icon: ⛵
---
