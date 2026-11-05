/**
 * Pack dist-share into one self-contained HTML file.
 * Usage: node scripts/pack-single-html.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist-share');
const outPath = path.join(root, 'Al-Falah-Project-Share.html');

function findAsset(dir, exts, ...namePrefixes) {
  const files = fs.readdirSync(dir);
  const extList = Array.isArray(exts) ? exts : [exts];
  const match = files.find(
    (f) =>
      namePrefixes.some((p) => f.startsWith(p)) &&
      extList.some((ext) => f.endsWith(ext)),
  );
  if (!match) {
    throw new Error(`Missing ${namePrefixes.join('|')}*${extList.join('|')} in ${dir}`);
  }
  return path.join(dir, match);
}

const assetsDir = path.join(dist, 'assets');
const jsPath = findAsset(assetsDir, '.js', 'index-');
const cssPath = findAsset(assetsDir, '.css', 'index-', 'style-');
const dataPath = path.join(dist, 'data', 'survey-data.json');
const dataPathFallback = path.join(root, 'public', 'data', 'survey-data.json');
const resolvedDataPath = fs.existsSync(dataPath) ? dataPath : dataPathFallback;
if (!fs.existsSync(resolvedDataPath)) {
  throw new Error('Missing survey-data.json (checked dist-share/data and public/data)');
}
const logoPath = fs.existsSync(path.join(dist, 'bayaan-logo.svg'))
  ? path.join(dist, 'bayaan-logo.svg')
  : findAsset(assetsDir, '.svg', 'bayaan-logo-');

const css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');
const surveyData = fs.readFileSync(resolvedDataPath, 'utf8');
const logoSvg = fs.readFileSync(logoPath, 'utf8');
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`;

// Prevent early </script> termination inside the inline module
js = js.replace(/<\/script/gi, '<\\/script');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="${logoDataUri}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Al Falah District Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      /* Embedded survey data — intercept fetch so the app works offline as a single file */
      window.__AL_FALAH_SURVEY_DATA__ = ${surveyData};
      (function () {
        var originalFetch = window.fetch.bind(window);
        window.fetch = function (input, init) {
          var url = typeof input === 'string' ? input : (input && input.url) || '';
          if (String(url).indexOf('survey-data.json') !== -1) {
            return Promise.resolve(
              new Response(JSON.stringify(window.__AL_FALAH_SURVEY_DATA__), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            );
          }
          return originalFetch(input, init);
        };
      })();
    </script>
    <script type="module">
${js}
    </script>
  </body>
</html>
`;

fs.writeFileSync(outPath, html, 'utf8');
const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
console.log(`Wrote ${outPath} (${sizeMb} MB)`);
