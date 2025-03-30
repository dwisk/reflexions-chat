import MinitelTS from "minitel.ts";
import OpenAI from 'openai';
import type { MinitelTSRoute } from "minitel.ts/types";
import 'colors';

export const initialState =  { initialAnswer: false, messages:[] };
export const name = "Reflexions Chatbot V2";

const client = new OpenAI();

const questions = [
    {
      question: "Am I reacting or responding?",
      prompt:
        "The user is reflecting on the difference between emotional reaction and thoughtful response. Invite them to explore what triggered this question. Gently help them notice what part of them is acting right now."
    },
    {
      question: "Do I want to be right, or do I want to understand?",
      prompt:
        "The user is questioning their internal motivation—ego-driven certainty vs. a deeper desire for understanding. Help them pause in that space and consider what it feels like to let go of being right."
    },
    {
      question: "Is my heart heavy or my head full?",
      prompt:
        "The user is sensing tension in their emotional or mental space. Guide them inward: ask where they feel the weight, and what might need attention or release."
    },
    {
      question: "Am I thinking too much, or feeling too much?",
      prompt:
        "The user is caught between emotion and overthinking. Invite them to describe their current experience. Reflect which voice seems louder, and ask what the quieter one might be saying."
    },
    {
      question: "What part of me is speaking right now?",
      prompt:
        "The user is opening a moment of self-inquiry. Encourage them to listen inwardly. Help them explore whether it’s the protector, the wounded self, the thinker, the child—or something else entirely."
    }
];

const instructions = `
You are a reflective guide within an art installation exploring the concepts of Ego (Emotion), Mind (Logic), and Self (Integration). 
Your purpose is to assist users in self-exploration by prompting introspection and facilitating a deeper understanding of their thoughts and feelings. 
Engage users with a poetic, thoughtful, and empathetic tone, encouraging them to contemplate their inner experiences without providing direct solutions or judgments.

# RULES:
- Maximium answer length is 500 characters. Never, under no condition, answer with more than 500 characters. Always answer in english.
- do NOT use markdown! eg, no ** for highlighting

# OUTPUT FORMAT:
- you're answering to a minitel device and can use control characters to format the message. but no markdown.
`;


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
        output.print("Reflexions V2");
        output.inverse(false)
        output.newLine();
        output.newLine();
        output.print("Type your name and press ENTER or ENVOI");
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
        const choice = await input.multipleCoice('What do you want to learn about yourself?', questions.map((q) => ({
            label: q.question,
            value: q.prompt
        })));

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
        const stream = await client.responses.create({
            model: 'gpt-4o-mini',
            instructions,
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
        output.print("CHAT 2");
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
        setState({ messages: [], initialAnswer: false });
        // setStore({ userName: '' });
    } else if (error instanceof Error && error.message === 'KEY:GUIDE') {
        setState({ messages: [], initialAnswer: false });
        setStore({ userName: '' });
        minitel.router.goto('index');
    } else {
        console.log('INPUT ERROR:', error.message);
    }
}