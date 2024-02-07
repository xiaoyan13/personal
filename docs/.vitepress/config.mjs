import { defineConfig } from 'vitepress'
import sidebar from '../../script/test.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "xy13's personal Lib",
  description: "welcome here.",


  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: '笔记', link: '/笔记/' }
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
