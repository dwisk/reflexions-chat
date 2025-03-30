
export function parseMultipleChoice(text: string): { prompt: string, options: { label: string, value: string }[] } | null {
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