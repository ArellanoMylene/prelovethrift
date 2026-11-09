import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
    plugins: [
        vue({
            template: {
                // keep absolute public-dir URLs (/assets/...) as plain URLs instead of imports
                transformAssetUrls: { includeAbsolute: false }
            }
        })
    ]
});
