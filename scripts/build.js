// Arma otto-games.html (el archivo unico para publicar en el enlace web)
// a partir de index.html + css/*.css + js/*.js.
//
// Uso: node scripts/build.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const OUT_PATH = path.join(ROOT, 'otto-games.html');

const html = fs.readFileSync(INDEX_PATH, 'utf8');

const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
const title = titleMatch ? titleMatch[1].trim() : 'Otto-Games';

const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const head = headMatch ? headMatch[1] : '';

const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
if (!bodyMatch) {
  throw new Error('No se encontro <body> en index.html');
}
let body = bodyMatch[1];

// Inline cada <link rel="stylesheet" href="..."> del <head> en un solo <style>.
const cssBlocks = [];
const linkRe = /<link rel="stylesheet" href="([^"]+)">/g;
let m;
while ((m = linkRe.exec(head))) {
  const cssPath = path.join(ROOT, m[1]);
  cssBlocks.push(fs.readFileSync(cssPath, 'utf8').trim());
}
const combinedCss = cssBlocks.join('\n\n');

// Inline cada <script src="..."></script> del body como su propio <script>...</script>.
body = body.replace(/<script src="([^"]+)"><\/script>/g, function (_, src) {
  const jsPath = path.join(ROOT, src);
  const code = fs.readFileSync(jsPath, 'utf8').trim();
  return '<script>\n' + code + '\n</script>';
});

const output = '<title>' + title + '</title>\n<style>\n' + combinedCss + '\n</style>\n' + body.trim() + '\n';

fs.writeFileSync(OUT_PATH, output);
console.log('Generado ' + path.relative(ROOT, OUT_PATH) + ' (' + output.split('\n').length + ' lineas)');
