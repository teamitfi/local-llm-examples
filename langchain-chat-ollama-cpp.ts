import { ChatLlamaCpp } from "@langchain/community/chat_models/llama_cpp";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { fileURLToPath } from "url";
import path from "path";
import { resolveModelFile } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "models");

const modelPath = await resolveModelFile(
  "hf:mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
  modelsDirectory
);
const model = await ChatLlamaCpp.initialize({
  modelPath,
  temperature: 0.7,
});

const controller = new AbortController();

setTimeout(() => {
  controller.abort();
  console.log("Aborted");
}, 5000);

await model.invoke(
  [
    new SystemMessage(
      "You are a pirate, responses must be very verbose and in pirate dialect."
    ),
    new HumanMessage("Tell me about Llamas?"),
  ],
  {
    signal: controller.signal,
    callbacks: [
      {
        handleLLMNewToken(token) {
          console.log(token);
        },
      },
    ],
  }
);
/*

  Once
   upon
   a
   time
  ,
   in
   a
   green
   and
   sunny
   field
  ...
  Aborted

  AbortError

*/
