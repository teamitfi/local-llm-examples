import { LlamaCpp } from "@langchain/community/llms/llama_cpp";

import { loadSummarizationChain, AnalyzeDocumentChain } from "langchain/chains";
import * as fs from "fs";

import { fileURLToPath } from "url";
import path from "path";
import { resolveModelFile } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "models");

const modelPath = await resolveModelFile(
  "hf:mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
  modelsDirectory
);

const model = await LlamaCpp.initialize({
  modelPath,
  temperature: 0.5,
});

// In this example, we use the `AnalyzeDocumentChain` to summarize a large text document.
const text = fs.readFileSync("./output/tim.txt", "utf8");

const combineDocsChain = loadSummarizationChain(model);
const chain = new AnalyzeDocumentChain({
  combineDocumentsChain: combineDocsChain,
});
const res = await chain.invoke({
  input_document: text,
});
console.log({ res });
/*
{
  res: {
    text: ' President Biden is taking action to protect Americans from the COVID-19 pandemic and Russian aggression, providing economic relief, investing in infrastructure, creating jobs, and fighting inflation.
    He is also proposing measures to reduce the cost of prescription drugs, protect voting rights, and reform the immigration system. The speaker is advocating for increased economic security, police reform, and the Equality Act, as well as providing support for veterans and military families.
    The US is making progress in the fight against COVID-19, and the speaker is encouraging Americans to come together and work towards a brighter future.'
  }
}
*/