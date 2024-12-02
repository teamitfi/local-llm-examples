# Local LLM Examples

A collection of examples and tools for running **local large language models (LLMs)** and building AI-powered applications without relying on external APIs. This repository focuses on local processing, privacy, cost-efficiency, and independence.

## Features
- 🛠 **Local Embeddings and LLMs**: Examples using local LLaMA-CPP and Ollama models.
- 📚 **Retrieval-Augmented Generation (RAG)**: End-to-end examples for document retrieval and question-answering systems.
- 🚀 **Customizable Workflows**: Chains for embeddings, QA, and analysis.
- 🔗 **LangChain Integration**: Examples for using LangChain with local models.
- 🖥 **GPU Acceleration**: Leverages local GPU for performance optimization.

## Prerequisites
- **Node.js**: Ensure Node.js is installed.
- **Bun**: A fast JavaScript runtime. [Install Bun](https://bun.sh/).
- **Python**: Some dependencies may require Python installed in your environment.
- **Models**: Pull required LLaMA models by running the post-install script (see below).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/local-llm-examples.git
   cd local-llm-examples
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Pull the required models:
   ```bash
   npm run models:pull
   ```

## Usage

### Ollama
### Server Start
```
ollama serve
```

#### Embeddings Download
```
ollama pull mxbai-embed-large
ollama pull nomic-embed-text 
```

#### Models Download
```
ollama pull llama2
```

### Run Examples

The repository includes various examples for working with local LLMs and embeddings. Use the following scripts to execute specific examples:

#### Embedding Generation with LLaMA-CPP
Generate embeddings locally using LLaMA-CPP:
```bash
npm run embeddings-node-llama-cpp
```

#### Local Question-Answering Chain
Run a QA chain locally:
```bash
npm run local-qa-chain
```

#### Local RAG Chain
Test a retrieval-augmented generation (RAG) chain:
```bash
npm run local-rag-chain
```

#### Analyze Documents with Ollama
Analyze documents using a local Ollama setup:
```bash
npm run analyze-docs-ollama
```

#### GPU Inspection
Inspect the local GPU for LLaMA compatibility:
```bash
npm run inspect-gpu
```

## Scripts

| Script                       | Description                                                |
|------------------------------|------------------------------------------------------------|
| `embeddings-node-llama-cpp` | Generates embeddings using LLaMA-CPP.                     |
| `local-qa-chain`            | Runs a local question-answering chain.                    |
| `local-chain`               | Executes a basic local chain.                             |
| `local-rag-chain`           | Tests a retrieval-augmented generation (RAG) chain.       |
| `langchain-chat-ollama-cpp` | Chats using LangChain and LLaMA-CPP locally.              |
| `analyze-docs-ollama`       | Analyzes documents using Ollama.                          |
| `analyze-docs-llama-cpp`    | Analyzes documents using LLaMA-CPP.                       |
| `inspect-gpu`               | Inspects GPU for compatibility with LLaMA-CPP.            |
| `models:pull`               | Pulls required LLaMA models into the `./models` directory.|

## Dependencies

| Dependency                  | Purpose                                                   |
|-----------------------------|-----------------------------------------------------------|
| `@langchain/core`           | Core functionality for LangChain.                        |
| `@langchain/langgraph`      | Workflow graphs for LangChain.                           |
| `@langchain/ollama`         | Integration with Ollama for local LLMs.                  |
| `node-llama-cpp`            | Library for running LLaMA models locally.                |
| `faiss-node`                | Efficient similarity search and clustering.              |
| `hnswlib-node`              | High-performance in-memory vector database.              |
| `sharp`                     | Image processing for analysis use cases.                 |

## Directory Structure

```
local-llm-examples/
├── models/                # Directory for downloaded models
├── embeddings-node-llama-cpp.ts # Embedding generation example
├── local-qa-chain.ts      # Local QA chain example
├── local-chain.ts         # Simple local chain example
├── local-rag-chain.ts     # Local RAG chain example
├── analyze-docs-ollama.ts # Document analysis with Ollama
├── analyze-docs-llama-cpp.ts # Document analysis with LLaMA-CPP
└── README.md              # Project documentation
```

## Contributing
We welcome contributions! Feel free to submit pull requests or open issues to improve this repository.

## License
This project is licensed under the ISC License. See the LICENSE file for details.

---

Enjoy building local, private, and cost-efficient AI solutions! 🚀

