import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ 
  plugins: [react()],
  server: {
    port: 5173, // Usar puerto libre automáticamente
    host: true, // Permitir acceso desde la red local
    strictPort: false, // Si el puerto está ocupado, usar otro
    open: true // Abrir automáticamente el navegador
  }
})