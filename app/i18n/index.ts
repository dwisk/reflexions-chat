import MinitelTS from "minitel.ts";
import type { MinitelTSRoute } from "minitel.ts/types";
import i18n from "../../lib/i18n.ts";

export const initialState =  {userInput: '...'};
export const name = "Language / Sprache";


const locales = i18n.getLocales();
const languages = locales.map((lng) => ({
    key: lng,
    name: i18n.__(`i18n.languages.${lng}`),
}));


export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
  const { input, output } = minitel;
  output.cls();
  output.inverse(true)
  output.print(`Minitel TS settings`);
  output.inverse(false)
  output.newLine();
  output.newLine();


  try {
    const choice = await input.multipleCoice(i18n.__('i18n.choose'), 
      languages.map((lng) => ( { label: lng.name, value: lng.key} )));
    const nextLng = languages.find((lng) => lng.key === choice.value);
    if (nextLng) {
        i18n.setLocale(nextLng.key);
        minitel.router.goto('index');
        minitel.bip();
    } 
  } catch (error) {
    if (error instanceof Error && error.message === 'KEY:GUIDE') {
      console.log('GOING TO INDEX');
      minitel.router.goto('index');
  } else {
      console.log('INPUT ERROR:', error.message);
  }
    minitel.bip();
  }

}

