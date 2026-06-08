import { defineConfig } from "vitepress";
import sidebar from "./sideBarData.json";
import mathjax3 from "markdown-it-mathjax3";
import { centerStandaloneImages } from "./rules/centerImages.mjs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "xy's library",
  description: "welcome here.",
  head: [["link", { rel: "icon", href: "/MaterialSymbolsBook4.svg" }]],
  themeConfig: {
    logo: "/MaterialSymbolsBook4.svg",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "笔记", link: "/笔记/" },
    ],

    sidebar,

    socialLinks: [
      { icon: "github", link: "https://github.com/xiaoyan13/personal" },
    ],
  },
  markdown: {
    // 代码块的主题 参考 https://shiki-zh-docs.vercel.app/themes
    theme: {
      light: "github-light",
      dark: "one-dark-pro",
    },
    config: (md) => {
      md.use(mathjax3); // 支持识别 latex
      md.use(centerStandaloneImages); // 图片居中
    },
  },
});
