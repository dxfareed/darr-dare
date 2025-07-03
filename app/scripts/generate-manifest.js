// scripts/generate-manifest.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Helper to filter out empty properties, similar to your function
function withValidProperties(properties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => !!value)
  );
}

// Check for required environment variables
const requiredEnv = ['NEXT_PUBLIC_URL', 'FARCASTER_HEADER', 'FARCASTER_PAYLOAD', 'FARCASTER_SIGNATURE', 'NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME', 'NEXT_PUBLIC_APP_ICON'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Error: Missing required environment variable ${key}`);
  }
}

const URL = process.env.NEXT_PUBLIC_URL;

const manifest = {
  accountAssociation: {
    header: process.env.FARCASTER_HEADER,
    payload: process.env.FARCASTER_PAYLOAD,
    signature: process.env.FARCASTER_SIGNATURE,
  },
  // IMPORTANT: The manifest spec uses 'miniapp' not 'frame' for new fields
  // But we use 'frame' for now for broader compatibility with older clients.
  miniapp: withValidProperties({ 
    version: "1",
    name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
    subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    // screenshotUrls: [], // an empty array is not a valid property
    iconUrl: process.env.NEXT_PUBLIC_APP_ICON,
    splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
    splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
    homeUrl: URL,
    webhookUrl: `${URL}/api/webhook`,
    primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
    // tags: [], // an empty array is not a valid property
    heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
    tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
    ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
    ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
    ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE,
  }),
};

// Create the directory if it doesn't exist
const dirPath = path.join(process.cwd(), 'public', '.well-known');
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// Write the manifest file
const filePath = path.join(dirPath, 'farcaster.json');
fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));

console.log('✅ Farcaster manifest generated successfully!');