import path from 'path';
import i18n from 'i18n';
import fs from 'fs';

const appDir = path.join(path.dirname(process.argv[1]), 'app');

const staticCatalog = {};

function loadCatalogFromDir(dir: string = '') {
  const catalog = {};
  const pathName = path.join(appDir, dir, '/_locales');
  if (!fs.existsSync(pathName)) {
    return;
  }
  const files = fs.readdirSync(pathName);
  files.forEach((file) => {
    const filePath = path.join(pathName, file);
    if (fs.statSync(filePath).isFile()) {
      const locale = path.basename(file, '.json');
      catalog[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  });
  Object.keys(catalog).forEach((locale) => {
    if (!staticCatalog[locale]) {
      staticCatalog[locale] = {};
    }
    if (dir !== '') {
      staticCatalog[locale][dir] = catalog[locale];
    } else {
      staticCatalog[locale] = catalog[locale];
    }
  });
}

// load index
loadCatalogFromDir();

// load app dirs
const dirs = fs.readdirSync(appDir);
dirs.forEach((dir) => {
  const dirPath = path.join(appDir, dir);
  if (!fs.statSync(dirPath).isDirectory()) {
    return;
  }
  loadCatalogFromDir(dir);
});


i18n.configure({
  locales: ['en', 'de'],
  retryInDefaultLocale: true,
  defaultLocale: 'en',
  objectNotation: true,
  staticCatalog: staticCatalog
})

i18n.setLocale(process.env.DEFAULT_LANG || 'en');
i18n.__('welcome');

export default i18n;