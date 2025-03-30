import MinitelTS from "minitel.ts";
import OpenAI from 'openai';
import type { MinitelTSRoute } from "minitel.ts/types";
import 'colors';
import i18n from "../lib/i18n.ts";

function parseMultipleChoice(text: string): { prompt: string, options: { label: string, value: string }[] } | null {
  const tag = "[input.multipleChoice]";
  const tagIndex = text.indexOf(tag);
  if (tagIndex !== -1) {
    const preamble = text.substring(0, tagIndex).trim();
    const rest = text.substring(tagIndex).split("\n");
    let prompt = "";
    let options: { label: string, value: string }[] = [];
    for (const line of rest.slice(1)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("prompt:")) {
        prompt = trimmed.substring("prompt:".length).trim();
      } else if (trimmed.startsWith("-")) {
        const optionText = trimmed.substring(1).trim();
        options.push({ label: optionText, value: optionText });
      }
    }
    if (preamble) {
      prompt = prompt;
    }
    return { prompt, options };
  }
  return null;
}

export const initialState =  { initialAnswer: false, messages:[] };
export const name = "Reflexions Chatbot V3";

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

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
    const { input, output } = minitel;
    const { store, setStore } = minitel.store;
    const { state, setState} = route .state;
    
    const instructions = `
You are a reflective guide within an art installation exploring the concepts of Ego (Emotion), Mind (Logic), and Self (Integration). 
Your purpose is to assist users in self-exploration by prompting introspection and facilitating a deeper understanding of their thoughts and feelings. 
Engage users with a poetic, thoughtful, and empathetic tone, encouraging them to contemplate their inner experiences without providing direct solutions or judgments.

# RULES:
- Maximum answer length is 500 characters. Never, under no condition, answer with more than 500 characters. Always answer in ${i18n.getLocale() || 'english'}.
- do NOT use markdown! eg, no ** for highlighting.
- Avoid adding unnecessary newlines between paragraphs or commands.

# UI COMMANDS:
Use these commands frequently to make the conversation interactive and engaging. Especially your first messages should be multipleChoices.
- If you need to ask the user a multiple choice question, you must output a command in the following format and keep any preamble short and to the point:
[input.multipleChoice]
prompt: <Your question here>
- Option 1
- Option 2
- Option 3

You may include a short preamble before [input.multipleChoice], but keep it under 2 paragraphs and relevant to the question. Avoid long introductions or reflections before a choice.
Ensure that the command starts with exactly [input.multipleChoice] and that each option is preceded by a dash (-). Use this format whenever possible to guide the user through introspection.
`;
    
    output.cls();

    let gptAnswer;
    
    if ( !store.userName) {
        output.inverse(true)
        output.print("Reflexions V3");
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
            model: 'gpt-4o',
            instructions,
            input: state.messages,
            stream: true,
          });
          
          let completeResponse = "";
          let isMultipleChoice = false;
          
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta') {
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
        console.log('GOING TO INDEX');
        minitel.router.goto('index');
    } else {
        console.log('INPUT ERROR:', error.message);
    }
}