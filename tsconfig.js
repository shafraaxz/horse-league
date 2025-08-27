{
  "name": "football-manager",
  "version": "2.1.0",
  "description": "Professional Football League Management System",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next node_modules package-lock.json",
    "fresh": "npm run clean && npm install",
    "fresh-start": "npm run fresh && npm run dev",
    "db:cleanup": "node scripts/cleanup-database.js",
    "db:cleanup:execute": "node scripts/cleanup-database.js --execute",
    "db:init": "node scripts/init-database.js",
    "db:seed": "node scripts/seed-database.js",
    "db:backup": "node scripts/backup-database.js",
    "optimize": "npm run lint && npm run build",
    "analyze": "cross-env ANALYZE=true npm run build",
    "test": "echo \"No tests specified yet\" && exit 0",
    "vercel-build": "next build",
    "postinstall": "echo 'Dependencies installed successfully'"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cloudinary": "^2.2.0",
    "dotenv": "^17.2.1",
    "formidable": "^3.5.1",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.263.1",
    "mongodb": "^6.3.0",
    "mongoose": "^8.17.1",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/formidable": "^3.4.5",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.11.17",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "autoprefixer": "^10.4.17",
    "cross-env": "^7.0.3",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/football-manager.git"
  },
  "keywords": [
    "football",
    "soccer",
    "league",
    "management",
    "nextjs",
    "mongodb",
    "cloudinary",
    "real-time",
    "sports",
    "analytics"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "browserslist": {
    "production": [
      ">0.3%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "eslintConfig": {
    "extends": [
      "next/core-web-vitals"
    ],
    "rules": {
      "no-unused-vars": "warn",
      "no-console": "off",
      "@next/next/no-img-element": "off"
    }
  }
}
