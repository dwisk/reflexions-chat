import MinitelTS from 'minitel.ts'; // Ensure the package is installed and the path is correct
import 'dotenv/config'
import './lib/i18n.ts';

const minitel = new MinitelTS();
await minitel.init();
await minitel.loop('./app', 'reflexions4', {
  // userName: 'Mephy',
});
