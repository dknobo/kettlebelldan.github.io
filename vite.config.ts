export default defineConfig({
  base: '/',                    // ← correct for custom domain
  plugins: [react(), tailwindcss()],
})
