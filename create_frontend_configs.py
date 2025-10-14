"""
Script to create missing Next.js configuration files
"""
from pathlib import Path

# Get the em-frontend directory
frontend_dir = Path(__file__).parent / 'em-frontend'

print(f"Creating config files in: {frontend_dir}\n")

# 1. tsconfig.json
tsconfig = """{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"""
(frontend_dir / 'tsconfig.json').write_text(tsconfig, encoding='utf-8')
print("✓ Created tsconfig.json")

# 2. next.config.js
next_config = """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
"""
(frontend_dir / 'next.config.js').write_text(next_config, encoding='utf-8')
print("✓ Created next.config.js")

# 3. postcss.config.js
postcss = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""
(frontend_dir / 'postcss.config.js').write_text(postcss, encoding='utf-8')
print("✓ Created postcss.config.js")

# 4. app/globals.css
globals_css = """@tailwind base;
@tailwind components;
@tailwind utilities;
"""
(frontend_dir / 'app' / 'globals.css').write_text(globals_css, encoding='utf-8')
print("✓ Created app/globals.css")

# 5. app/layout.tsx
layout = """import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '7 Days to Calm - Elevated Movements',
  description: 'A guided mindfulness meditation challenge. Breathe, reset, rise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
"""
(frontend_dir / 'app' / 'layout.tsx').write_text(layout, encoding='utf-8')
print("✓ Created app/layout.tsx")

# 6. Update tailwind.config.js
tailwind = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
"""
(frontend_dir / 'tailwind.config.js').write_text(tailwind, encoding='utf-8')
print("✓ Updated tailwind.config.js")

print("\n✅ All config files created!")
print("\nNext steps:")
print("1. cd em-frontend")
print("2. npm run dev")
print("3. Open http://localhost:3000/7-days-to-calm")