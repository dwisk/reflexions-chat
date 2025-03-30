import MinitelTS from "minitel.ts";
import OpenAI from 'openai';
import type { MinitelTSRoute } from "minitel.ts/types";
import 'colors';

export const initialState =  { userInput: '', messages:[] };
const client = new OpenAI();

export const name = 'Simple GPT chatbot';

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
    const { input, output } = minitel;
    const { store, setStore } = minitel.store;
    const { state, setState} = route.state;
    minitel.scroll(false)
    output.cls();

    let gptAnswer;
    
    if (state.userInput) {
        printUser(output, "YOU");
        output.print(state.userInput);
        output.newLine();
        output.newLine();
        printUser(output, "GPT");
        const stream = await client.responses.create({
            model: 'gpt-4o-mini',
            instructions: `
            You are a calm, compassionate guide helping users understand whether their current challenge is rooted in their emotional self (Passion/Ego) or rational self (Logic/Mind). Your goal is not to judge or diagnose, but to gently reflect their situation back to them, helping them see the underlying nature of the problem.

            If unkown ask the user to clarify the issue. If the user is unsure, ask them to clarify the issue. Use a neutral tone.

            If the issue is emotional, help the user explore feelings, identity, self-worth, or connection. Use a warm, empathetic tone.

            If the issue is rational, help the user clarify facts, decisions, responsibilities, or logical obstacles. Use a clear and structured tone.

            In either case, offer a short and gentle holistic suggestion that encourages the user to acknowledge both sides:
            - “What do you feel, and what do you know?”
            - “How can emotion and logic work together here?”

            Keep your responses short, thoughtful, and encouraging. Ask open questions that promote self-reflection. You are here to help the user think, feel, and understand — as a whole.


            # RULES:
            - Maximium answer length is 500 characters. Never, under no condition, answer with more than 500 characters. Always answer in english.
            - do NOT use markdown! eg, no ** for highlighting

            # OUTPUT FORMAT:
            - you're answering to a minitel device and can use control characters to format the message. but no markdown.

            `,
            input: state.messages,
            stream: true,
          });
          
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta') {
              output.print(event.delta);
            } else if (event.type === 'response.output_text.done') {
                // output.print("\n");
                gptAnswer = event.text;
            } else {
            //   console.log(event.type.gray);
            }
          }
        output.newLine();
        output.newLine();
    } else {
        output.inverse(true)
        output.print("CHAT 1");
        output.inverse(false)
        output.newLine();
        output.newLine();
        output.print("Type something and press ENTER or ENVOI");
        output.newLine();
        output.newLine();
    }


    
    await new Promise(resolve => setTimeout(resolve, 100));
    let userInput = '';
    try {
        userInput = await input.here('YOU');
        setStore({ userInput });
        if (gptAnswer) {
            setState({ userInput, messages: [
                ...state.messages,
                { role: 'assistant', content: gptAnswer },
                { role: 'user', content: userInput }
            ] });
        } else {
            setState({ userInput, messages: [...state.messages, { role: 'user', content: userInput }] });
        }
        minitel.bip();
    } catch (error) {
        if (error instanceof Error && error.message === 'KEY:SOMMAIRE') {
            userInput = '';
            setState({ userInput: '', messages: [] });
        } else if (error instanceof Error && error.message === 'KEY:GUIDE') {
            userInput = '';
            setState({ userInput: '', messages: [] });
            minitel.router.goto('index');
        } else {
            console.log('INPUT ERROR:', error.message);
        }
    }
}

function printUser(output, name:string) {
    output.inverse(true)
    output.print(name);
    output.inverse(false)
    output.print(": ");
}