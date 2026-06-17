/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Salida autocontenida para imagen Docker mínima. Se activa solo en el build de
  // Docker (Linux); en Windows local los symlinks de standalone requieren admin.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
