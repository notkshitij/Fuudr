import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  // 1. Build client bundle
  console.log('Building client bundle...');
  await build({
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  });

  // 2. Build server bundle for SSR
  console.log('Building server bundle for SSR...');
  await build({
    build: {
      ssr: 'src/entry-server.jsx',
      outDir: 'dist-ssr',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          format: 'esm'
        }
      }
    }
  });

  // 3. Import render function
  const entryServerPath = path.resolve(__dirname, '../dist-ssr/entry-server.js');
  const { render } = await import(pathToFileURL(entryServerPath).href);

  // 4. Read client template
  const templatePath = path.resolve(__dirname, '../dist/index.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // List of routes to pre-render
  const routes = [
    { path: '/', file: 'index.html' },
    { path: '/partner', file: 'partner/index.html' },
    { path: '/partner/signup', file: 'partner/signup/index.html' },
    { path: '/privacy', file: 'privacy/index.html' },
    { path: '/terms', file: 'terms/index.html' },
    { path: '/delete-account', file: 'delete-account/index.html' },
    { path: '/blog', file: 'blog/index.html' },
    { path: '/blog/best-food-reels-app-mumbai', file: 'blog/best-food-reels-app-mumbai/index.html' },
    { path: '/blog/how-fuudr-helps-restaurants-grow', file: 'blog/how-fuudr-helps-restaurants-grow/index.html' }
  ];

  console.log('Pre-rendering static pages...');
  for (const route of routes) {
    const helmetContext = {};
    const appHtml = render(route.path, helmetContext);
    
    // Extract metadata tags that React 19 / helmet renders inside appHtml
    let pageTitle = '';
    let pageDescription = '';
    let pageCanonical = '';
    const otherTags = [];

    // Find and extract <title>
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const titleMatch = appHtml.match(titleRegex);
    if (titleMatch) {
      pageTitle = titleMatch[0];
    }

    // Find and extract <meta>
    const metaRegex = /<meta([\s\S]*?)\/?>/gi;
    let metaMatch;
    while ((metaMatch = metaRegex.exec(appHtml)) !== null) {
      const tag = metaMatch[0];
      if (tag.includes('name="description"')) {
        const descMatch = tag.match(/content="([\s\S]*?)"/i);
        if (descMatch) {
          pageDescription = descMatch[1];
        }
      } else {
        otherTags.push(tag);
      }
    }

    // Find and extract <link>
    const linkRegex = /<link([\s\S]*?)\/?>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(appHtml)) !== null) {
      const tag = linkMatch[0];
      if (tag.includes('rel="canonical"')) {
        const canonicalMatch = tag.match(/href="([\s\S]*?)"/i);
        if (canonicalMatch) {
          pageCanonical = canonicalMatch[1];
        }
      } else {
        otherTags.push(tag);
      }
    }

    // Find and extract <script type="application/ld+json">
    const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(appHtml)) !== null) {
      otherTags.push(scriptMatch[0]);
    }

    // Clean up appHtml by removing all these extracted tags from the markup
    const cleanAppHtml = appHtml
      .replace(/<title>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta[\s\S]*?\/?>/gi, '')
      .replace(/<link[\s\S]*?\/?>/gi, '')
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

    // Now, construct the new HTML template
    let renderedHtml = template;

    // 1. Replace the root div with clean HTML
    renderedHtml = renderedHtml.replace('<div id="root"></div>', `<div id="root">${cleanAppHtml}</div>`);

    // 2. Replace title in head
    if (pageTitle) {
      renderedHtml = renderedHtml.replace(/<title>[\s\S]*?<\/title>/i, pageTitle);
    }

    // 3. Replace description in head
    if (pageDescription) {
      renderedHtml = renderedHtml.replace(/<meta name="description"([\s\S]*?)\/?>/i, `<meta name="description" content="${pageDescription}" />`);
    }

    // 4. Replace canonical in head
    if (pageCanonical) {
      renderedHtml = renderedHtml.replace(/<link rel="canonical"([\s\S]*?)\/?>/i, `<link rel="canonical" href="${pageCanonical}" />`);
    }

    // 5. Append all other meta/script/link tags right before </head>
    if (otherTags.length > 0) {
      renderedHtml = renderedHtml.replace('</head>', `${otherTags.join('\n')}\n</head>`);
    }

    // Write file to output folder
    const outFile = path.resolve(__dirname, '../dist', route.file);
    const outDir = path.dirname(outFile);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(outFile, renderedHtml, 'utf-8');
    console.log(`Prerendered: ${route.path} -> dist/${route.file}`);
  }

  // 5. Clean up temporary SSR build folder
  console.log('Cleaning up temporary SSR build directory...');
  fs.rmSync(path.resolve(__dirname, '../dist-ssr'), { recursive: true, force: true });
  console.log('Pre-render compilation complete!');
}

run().catch(console.error);
