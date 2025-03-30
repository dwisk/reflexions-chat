import MinitelTS from "minitel.ts";
import OpenAI from 'openai';
import type { MinitelTSRoute } from "minitel.ts/types";
import 'colors';

export const initialState =  { initialAnswers:[], messages:[] };
export const name = "Reflexions Chatbot V1";

const client = new OpenAI();

const questions = [
    "How do you feel about your current situation?",
]


export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
    const { input, output } = minitel;
    const { store, setStore } = minitel.store;
    const { state, setState} = route .state;
    output.cls();

    let gptAnswer;

    // output.print(`loops ${store.loop}`);
    // output.newLine();
    // console.log(state);
    
    if ( !store.userName) {
        output.inverse(true)
        output.print("CHAT 2");
        output.inverse(false)
        output.newLine();
        output.newLine();
        output.print("Type your name and press ENTER or ENVOI");
        output.newLine();
        output.newLine();

        let userName = '';
        try {
            userName = await input.here('NAME');
            setStore({ userName: userName });
            minitel.bip();
        } catch (error) {
            catchError(error, setState, setStore, minitel);
        }

        return;
    } else if (state.initialAnswers.length < questions.length) {
        output.inverse(true)
        output.print("Some initial questions");
        output.inverse(false)
        output.newLine();
        output.newLine();
        output.print(questions[state.initialAnswers.length]);
        output.newLine();
        output.newLine();
        let userInput = '';
        try {
            userInput = await input.here(store.userName);
            
            setState({ initialAnswers: [...state.initialAnswers, userInput] });
            minitel.bip();
        } catch (error) {
            catchError(error, setState, setStore, minitel);
        }
        return;
    } else if (state.initialAnswers.length === questions.length && state.messages.length === 0) {
        const initialMessages = questions.flatMap((question, index) => [
            { role: 'assistant', content: question },
            { role: 'user', content: state.initialAnswers[index].toLowerCase() }
        ]);
        initialMessages.push({
            role: 'developer',
            content: `The user has answered all initial questions and their name is ${store.userName}. Greet them and start helping.`
        })
        setState({ messages: initialMessages });
        return;
    } else if (state.messages.length > 0) {
        if (state.userInput) {
            printUser(output, store.userName);
            output.print(state.userInput);
            output.newLine();
            output.newLine();
        }
        printUser(output, "Reflexions");
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
                output.foreColor(minitel.colors.bleu);
                output.print(event.delta);
                output.foreColor(minitel.colors.vert);
            } else if (event.type === 'response.output_text.done') {
                gptAnswer = event.text;
            } else {
            //   console.log(event.type.gray);
            }
          }
        output.newLine();
        output.newLine();
    
    } else {

        output.inverse(true)
        output.print("Reflexions V1");
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
        userInput = (await input.here(store.userName)).toLowerCase();
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

function printUser(output, name:string) {
    output.inverse(true)
    output.print(name);
    output.inverse(false)
    output.print(": ");
}

function catchError(error:Error, setState:Function, setStore:Function, minitel:MinitelTS) {
    if (error instanceof Error && error.message === 'KEY:SOMMAIRE') {
        setState({ messages: [], initialAnswers: [] });
        // setStore({ userName: '' });
    } else if (error instanceof Error && error.message === 'KEY:GUIDE') {
        setState({ messages: [], initialAnswers: [] });
        setStore({ userName: '' });
        minitel.router.goto('index');
    } else {
        console.log('INPUT ERROR:', error.message);
    }
}