# Reflexions Chat

## Prerequistes

- NodeJS Version >23
- A minitel on USb
- OpenAI API key

## Installation

```bash
npm install
```

**.env**
```bash
OPENAI_API_KEY= # Your openai-api-key

MINITEL_PATH=/dev/tty.usbserial-0001 # Path to serial (this one is for mac)
MINITEL_BAUDRATE=1200
MINITEL_SILENT=true # silence the beep

DEFAULT_LANG=en # preselected language
```

## Run
```bash
npm run build # creates js build
npm run start # runs js build

npm run dev # builds & starts
```