import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [AntDesignVueResolver({
        importStyle: false,
      })]
    })
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.json', '.vue']
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['moodjournal-1.onrender.com']
  }
})
