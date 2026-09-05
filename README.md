# 📄 DocuRAG — RAG Application

A **Retrieval-Augmented Generation (RAG)** application that allows users to upload a PDF, ask questions about its content, and receive answers generated using the relevant information retrieved from the document.

The project combines **Node.js, Express, Google Gemini, and Qdrant Vector Database** to implement the core RAG pipeline from scratch.

---

## 🚀 Overview

Traditional LLM applications can answer questions using their general knowledge, but they don't automatically know the contents of a user's private documents.

This project solves that problem using **Retrieval-Augmented Generation (RAG)**.

The application:

1. Extracts text from an uploaded PDF.
2. Splits the text into chunks.
3. Generates vector embeddings for each chunk using Gemini.
4. Stores the embeddings and original text in Qdrant.
5. Converts the user's question into an embedding.
6. Searches Qdrant for semantically similar content.
7. Sends the retrieved context to Gemini.
8. Generates an answer based on the retrieved PDF content.

---

## 🧠 RAG Architecture

```text
                    ┌──────────────┐
                    │     PDF      │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  PDF Text       │
                  │  Extraction     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Text Chunking   │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Gemini          │
                  │ Embeddings      │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Qdrant          │
                  │ Vector Database │
                  └────────┬────────┘
                           │
                    User Question
                           │
                           ▼
                  ┌─────────────────┐
                  │ Question        │
                  │ Embedding       │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Similarity      │
                  │ Search          │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Relevant PDF    │
                  │ Context         │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Gemini LLM      │
                  │ Answer          │
                  └─────────────────┘
```

---

## ✨ Features

### Currently Implemented

* 📄 PDF upload
* 🔍 PDF text extraction
* ✂️ Basic text chunking
* 🧠 Gemini embeddings
* 🗄️ Qdrant vector storage
* 🔎 Semantic similarity search
* 📚 Retrieval of relevant PDF content
* 🤖 Gemini-powered answer generation
* ⚡ Node.js + Express backend

## 🛠️ Tech Stack

| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **Node.js**       | Backend runtime                  |
| **Express.js**    | REST API server                  |
| **Multer**        | PDF file uploads                 |
| **pdf-parse**     | PDF text extraction              |
| **Google Gemini** | Embeddings and answer generation |
| **Qdrant**        | Vector database                  |
| **JavaScript**    | Application language             |

---

## 📁 Project Structure

```text
Chat-with-pdf/
│
├── server/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   └── Uploads/
│
├── .gitignore
└── README.md
```

> The project structure may evolve as the application is refactored into separate services and routes.

---

## ⚙️ Prerequisites

Before running the project, make sure you have:

* **Node.js** installed
* A **Google Gemini API key**
* A **Qdrant Cloud** account or local Qdrant instance

---

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=3000

GEMINI_API_KEY=your_gemini_api_key

QUADRANT_URL=your_qdrant_url
QUADRANT_API_KEY=your_qdrant_api_key
```

> **Important:** Never commit your `.env` file or API keys to GitHub.

Add the following to `.gitignore`:

```gitignore
node_modules/
.env
Uploads/
```

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/Chat-with-pdf.git
```

Move into the server directory:

```bash
cd Chat-with-pdf/server
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Running the Server

Start the server:

```bash
node index.js
```

The server will run on:

```text
http://localhost:3000
```

You should see:

```text
Server is running on port 3000
```

---

## 🗄️ Creating the Qdrant Collection

The application uses a Qdrant collection named:

```text
pdf-docs
```

The collection is configured for the embedding dimensionality used by the project.

The current implementation provides:

```text
GET /create-collection
```

Run the server and open:

```text
http://localhost:3000/create-collection
```

The collection should be created before uploading documents.

---

## 📤 Uploading a PDF

The application exposes:

```http
POST /upload
```

The request should contain:

* `pdf` — PDF file
* `question` — question about the PDF

Example using Postman:

```text
POST http://localhost:3000/upload
```

### Form Data

| Key        | Type | Value         |
| ---------- | ---- | ------------- |
| `pdf`      | File | Your PDF      |
| `question` | Text | Your question |

Example:

```text
Question:
What is the main purpose of this document?
```

---

## 🔍 How Retrieval Works

Suppose the PDF contains:

```text
The company was founded in 1995.
It initially operated in the technology sector.
```

The user's question might be:

```text
When was the company founded?
```

The application converts the question into an embedding vector.

Qdrant compares this vector against the vectors stored from the PDF chunks.

The most semantically similar chunk is retrieved and passed to Gemini as context.

---

## 🤖 Generation

The retrieved context is provided to Gemini along with the user's question.

Conceptually:

```text
Context:
"The company was founded in 1995..."

Question:
"When was the company founded?"

                    ↓

                  Gemini

                    ↓

Answer:
"The company was founded in 1995."
```

This allows the LLM to answer using information retrieved from the uploaded document rather than relying only on its general knowledge.

---

## 🧩 Core RAG Components

### 1. Document Ingestion

```text
PDF
 ↓
pdf-parse
 ↓
Extracted text
```

### 2. Chunking

The extracted text is currently divided using paragraph breaks:

```javascript
text.split('\n\n')
```

This is intentionally simple and will be improved in future versions.

### 3. Embeddings

Each chunk is converted into a vector representation using Gemini embeddings.

```javascript
const embedding = await createEmbedding(chunk);
```

### 4. Vector Storage

Each embedding is stored in Qdrant along with its original text:

```javascript
{
    id: ...,
    vector: embedding,
    payload: {
        text: chunk
    }
}
```

### 5. Retrieval

The question is converted into an embedding and compared against stored vectors.

```text
Question
   ↓
Embedding
   ↓
Qdrant
   ↓
Relevant chunks
```

### 6. Generation

The retrieved context is provided to Gemini to generate the final answer.

---

## 🎯 Why I Built This Project

This project was built to understand the fundamentals of **Retrieval-Augmented Generation** without hiding the underlying process behind a framework.

The implementation demonstrates how:

* Embeddings represent text as vectors.
* Vector databases store and retrieve semantic information.
* Similarity search finds relevant document content.
* Retrieved context can be passed to an LLM.
* An LLM can generate an answer grounded in retrieved information.

The goal is to understand the **RAG architecture itself**, rather than simply using a RAG framework.

## 📚 Concepts Learned

This project provides hands-on experience with:

* Large Language Models (LLMs)
* Generative AI
* Embeddings
* Vector databases
* Semantic search
* Similarity search
* Retrieval-Augmented Generation (RAG)
* Prompt engineering
* PDF processing
* REST APIs
* Express.js
* Asynchronous JavaScript
* Cloud vector databases

---

## ⭐ Future Goal

The long-term goal is to evolve this project into a production-ready **document intelligence and conversational PDF assistant** capable of:

```text
Multiple PDFs
     ↓
Document indexing
     ↓
Semantic retrieval
     ↓
Multi-chunk context
     ↓
Grounded generation
     ↓
Source citations
     ↓
Conversational Q&A
```

---

## 👨‍💻 Author

**Shivam Tripathi**

This project is part of my hands-on learning journey in **Generative AI, RAG systems, and backend development**.


