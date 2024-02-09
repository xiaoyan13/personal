import { defineConfig } from 'vitepress'
import sidebar from './sideBarData.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "xy13's personal Lib",
  description: "welcome here.",
  head: [
    [
      'link', { rel: 'icon', href: '/logo.svg' }
    ],

  ],

  themeConfig: {
    logo: '/MaterialSymbolsBook4.svg',

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '笔记', link: '/笔记/' }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xiaoyan13/personal' }
    ]
  },

  markdown: {
    // 代码块的主题 参考 https://shiki-zh-docs.vercel.app/themes
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
    config: (md) => {
    }
  }
})
