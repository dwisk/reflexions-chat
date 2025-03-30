import MinitelTS from "minitel.ts";

export function printUser(output, name:string) {
  output.inverse(true)
  output.print(name);
  output.inverse(false)
  output.print(": ");
}

export function catchError(error:Error, setState:Function, setStore:Function, minitel:MinitelTS) {
  if (error instanceof Error && error.message === 'KEY:REPETITION') {
      setState({ messages: [], initialAnswer: false });
      // setStore({ userName: '' });
  } else if (error instanceof Error && error.message === 'KEY:SOMMAIRE') {
      setState({ messages: [], initialAnswer: false });
      setStore({ userName: '' });
      console.log('GOING TO INDEX');
      minitel.router.goto('index');
  } else {
      console.log('INPUT ERROR:', error.message);
  }
}