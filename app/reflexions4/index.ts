import MinitelTS from "minitel.ts";
import OpenAI from 'openai';
import type { MinitelTSRoute } from "minitel.ts/types";
import 'colors';
import i18n from "../../lib/i18n.ts";
import { parseMultipleChoice } from "./ui-multiplechoice.ts";
import { catchError, printUser } from "./helper.ts";
import fs from 'fs';

export const initialState =  { initialAnswer: false, messages:[] };
export const name = i18n.__('reflexions4.name');

const client = new OpenAI();

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
    const { input, output } = minitel;
    const { store, setStore } = minitel.store;
    const { state, setState} = route .state;
    
    // load instrcutions from ./instructions.md
    const instructions = fs.readFileSync('./app/reflexions4/instructions.md', 'utf8');

    output.cls();

    let gptAnswer;
    
    if ( !store.userName) {
        output.inverse(true)
        output.print(name);
        output.inverse(false)
        output.newLine();
        output.newLine();
        output.print(i18n.__('reflexions4.welcome'));
        output.newLine();
        output.newLine();
        output.print(i18n.__('reflexions4.askForName'), minitel.colors.bleu);
        output.newLine();
        output.newLine();

        let userName = '';
        try {
            userName = (await input.here('NAME'));
            const titleName = userName
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            setStore({ userName: titleName });
            minitel.bip();
        } catch (error) {
            catchError(error, setState, setStore, minitel);
        }

        return;
    } else if (!state.initialAnswer!) {
        output.inverse(true)
        output.print(name);
        output.inverse(false)
        output.newLine();
        output.newLine();

        const questions = i18n.__('reflexions4.questions');
        const prompts = i18n.__('reflexions4.prompts');

        let choice;
        try {
            choice = await input.multipleCoice(i18n.__('reflexions4.initialQuestion'), questions.map((question,id) => ({
                label: question,
                value: prompts[id]
            })));
        } catch (error) {
            catchError(error, setState, setStore, minitel);
            return;
        }

        const initialMessages = [
            {
                role: 'assistant',
                content: 'What do you want to learn about yourself?'
            }, 
            {
                role: 'user',
                content: choice.label
            },
            {
                role: 'developer',
                content: `The user has selected the initial questions and their name is ${store.userName}. ${choice.value}`
            }
        ];

        setState({ userInput: choice.label, messages: initialMessages, initialAnswer: true });
        return;

    } else if (state.messages.length > 0) {
        if (state.userInput) {
            printUser(output, store.userName);
            output.print(state.userInput);
            output.newLine();
            output.newLine();
        }
        printUser(output, "Reflexions");
        input.cursor(true);
        const stream = await client.responses.create({
            model: 'gpt-4o',
            instructions,
            input: state.messages,
            stream: true,
          });
          
          let completeResponse = "";
          let isMultipleChoice = false;
          
          for await (const event of stream) {
            if (event.type === 'response.content_part.added') {
                input.cursor(false);
            } else if (event.type === 'response.output_text.delta') {
                completeResponse += event.delta;
                // Once enough characters are received, check if this is a multiple-choice command.
                if (!isMultipleChoice && completeResponse.length >= 20 && completeResponse.includes("[input.multipleChoice]")) {
                    isMultipleChoice = true;
                    
                    for (let i = 0; i < "[input.multipleChoice]".length; i++) {
                        output.backspace();
                        output.print(" ");
                        output.backspace();
                    }
                }
                // If not a multiple-choice response, stream output normally.
                if (!isMultipleChoice) {
                    output.foreColor(minitel.colors.bleu);
                    output.print(event.delta);
                    output.foreColor(minitel.colors.vert);
                }
            } else if (event.type === 'response.output_text.done') {
                gptAnswer = completeResponse;
            }
          }
        output.newLine();
        output.newLine();
    
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    let userInput = '';
    console.log("gptAnswer".bold, JSON.stringify(gptAnswer, null, 2));
    const uiCommand = parseMultipleChoice(gptAnswer || "");
    try {
        if (uiCommand) {
            // Display the multiple choice UI as specified by GPT
            const choice = await input.multipleCoice(uiCommand.prompt, uiCommand.options, true);
            userInput = choice.label;
        } else {
            userInput = (await input.here(store.userName)).toLowerCase();
        }
        if (gptAnswer) {
            setState({ userInput, messages: [
                ...state.messages,
                { role: 'assistant', content: gptAnswer },
                { role: 'user', content: userInput }
            ] });
        } else {
            setState({ userInput: userInput, messages: [...state.messages, { role: 'user', content: userInput }] });
        }
        minitel.bip();
    } catch (error) {
        catchError(error, setState, setStore, minitel);
    }
}

