/** @type {import('next').NextConfig} */
const nextConfig = {
    // Hapus 'output: export' 
    images: {
      unoptimized: true, // Opsional, tergantung kebutuhan
    },
    // Konfigurasi untuk production
    reactStrictMode: true,
    poweredByHeader: false,
  }
  
  module.exports = nextConfig