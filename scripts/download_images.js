import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const images = [
  { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=400&q=60", name: "fuudr-gourmet-pizza-slice-order.webp" },
  { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?fm=webp&fit=crop&w=400&q=60", name: "fuudr-brutal-burger-double-cheese.webp" },
  { url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?fm=webp&fit=crop&w=400&q=60", name: "fuudr-fresh-pasta-italian-dish.webp" },
  { url: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?fm=webp&fit=crop&w=400&q=60", name: "fuudr-chinese-momos-dumplings.webp" },
  { url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?fm=webp&fit=crop&w=400&q=60", name: "fuudr-asian-manchurian-noodle-bowl.webp" },
  { url: "https://images.unsplash.com/photo-1574484284002-952d92456975?fm=webp&fit=crop&w=400&q=60", name: "fuudr-italian-spread-bruschetta-pasta.webp" },
  { url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?fm=webp&fit=crop&w=400&q=60", name: "fuudr-spicy-chinese-noodles.webp" },
  { url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?fm=webp&fit=crop&w=400&q=80", name: "fuudr-mexican-tacos-avocado-lime.webp" },
  
  { url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?fm=webp&fit=crop&w=600&q=80", name: "fuudr-japanese-sushi-platter-note.webp" },
  { url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?fm=webp&fit=crop&w=600&q=80", name: "fuudr-gourmet-mexican-tacos-note.webp" },
  
  { url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=webp&fit=crop&w=800&q=80", name: "fuudr-brand-pizza-base-collage.webp" },
  { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?fm=webp&fit=crop&w=800&q=80", name: "fuudr-restaurant-kitchen-chef-counter.webp" },
  { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?fm=webp&fit=crop&w=800&q=80", name: "fuudr-italian-spaghetti-cooking-collage.webp" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?fm=webp&fit=crop&w=800&q=80", name: "fuudr-healthy-food-spread-collage.webp" },
  
  { url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?fm=webp&fit=crop&w=400&q=80", name: "fuudr-discovery-avocado-salad-reel.webp" },
  { url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?fm=webp&fit=crop&w=400&q=80", name: "fuudr-discovery-barbecue-grilled-chicken-reel.webp" },
  { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?fm=webp&fit=crop&w=400&q=80", name: "fuudr-discovery-creamy-pasta-reel.webp" },
  { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?fm=webp&fit=crop&w=400&q=80", name: "fuudr-discovery-american-breakfast-spread-reel.webp" }
];

const destDir = path.resolve(__dirname, '../public/images');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      const fileStream = fs.createWriteStream(dest);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading images from Unsplash...');
  for (const img of images) {
    const destPath = path.resolve(destDir, img.name);
    console.log(`Downloading: ${img.url} -> ${img.name}`);
    await download(img.url, destPath);
  }
  console.log('Images downloaded successfully.');
}

run().catch(console.error);
