import MinitelTS from "minitel.ts";
import type { MinitelTSRoute } from "minitel.ts/types";
import i18n from "../lib/i18n.js";

export const initialState =  {userInput: '...'};

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
  const { input, output } = minitel;
  output.cls();
  output.inverse(true)
  output.print(i18n.__('welcome'));
  output.inverse(false)
  output.newLine();
  output.newLine();


  try {
    const choice = await input.multipleCoice(i18n.__('choose'), 
      minitel.router.routes.filter((route) => route.name !== 'index')
      .map((route) => ( { label: route.name, value: route.path} )));
    const nextRoute = minitel.router.routes.find((route) => route.path === choice.value);
    if (nextRoute) {
        minitel.router.goto(nextRoute.path);
        minitel.bip();
    } 
  } catch (error) {
    minitel.bip();
  }
}

