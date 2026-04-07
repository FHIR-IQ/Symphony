// AI Knowledge Base for Product Managers
// Quiz questions and glossary terms drawn from Google, OpenAI, and Anthropic ecosystems

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  category: "protocols" | "architecture" | "terminology" | "products" | "safety" | "strategy";
}

export interface AITerm {
  term: string;
  definition: string;
  analogy: string;
  category: "protocols" | "architecture" | "terminology" | "products" | "safety";
}

// ─── WARMUP QUIZ QUESTIONS ────────────────────────────────────────────────────
// Covers: MCP, A2A, RAG, agents, tokens, hallucination, evals, and more

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Original MAS & IMPACT questions
  {
    question: "A pharmacy needs to check drug-drug, drug-disease, and drug-allergy interactions simultaneously. Which MAS pattern fits best?",
    options: ["Sequential Pipeline", "Parallel Fan-Out", "Coordinator"],
    answer: 1,
    explanation: "Parallel Fan-Out lets multiple sub-agents work independently on each interaction type, then a synthesizer aggregates results — much faster than checking sequentially.",
    category: "architecture",
  },
  {
    question: "What does the 'M' in the IMPACT framework stand for?",
    options: ["Measurable", "Meaningful", "Minimal"],
    answer: 1,
    explanation: "Meaningful — does the strategy drive real business value like Star Ratings, adherence improvements, or revenue?",
    category: "strategy",
  },
  {
    question: "A patient support bot needs to route billing questions vs. clinical medication questions to different specialists. Which pattern?",
    options: ["Sequential Pipeline", "Parallel Fan-Out", "Coordinator / Dispatcher"],
    answer: 2,
    explanation: "A Coordinator routes incoming requests to the right specialized sub-agent based on the type of question.",
    category: "architecture",
  },

  // MCP (Model Context Protocol)
  {
    question: "What is MCP (Model Context Protocol), introduced by Anthropic?",
    options: [
      "A method for compressing model weights",
      "An open standard for connecting AI models to external tools and data sources",
      "A protocol for encrypting AI training data",
    ],
    answer: 1,
    explanation: "MCP is like 'USB-C for AI' — a universal interface that lets any AI model connect to tools, APIs, and data sources through a single standard. OpenAI and Google have also adopted it.",
    category: "protocols",
  },
  {
    question: "In the MCP ecosystem, what does a 'server' do?",
    options: [
      "Trains AI models on new data",
      "Exposes tools and data for AI apps to use",
      "Manages user authentication tokens",
    ],
    answer: 1,
    explanation: "An MCP server exposes tools and data (like your product's API). An MCP client (the AI app) connects to servers to use them — build one server, and any MCP-compatible AI can use your product.",
    category: "protocols",
  },

  // A2A (Agent-to-Agent Protocol)
  {
    question: "Google's A2A protocol enables what kind of communication?",
    options: [
      "AI models talking to databases",
      "AI agents from different vendors discovering and collaborating with each other",
      "Users sending messages to AI assistants",
    ],
    answer: 1,
    explanation: "A2A (Agent-to-Agent) lets AI agents discover each other's capabilities and collaborate on tasks across vendors. If MCP is USB-C (connecting to tools), A2A is Bluetooth (agents talking to agents).",
    category: "protocols",
  },

  // RAG
  {
    question: "What does RAG stand for in AI architecture?",
    options: [
      "Rapid Agent Generation",
      "Retrieval Augmented Generation",
      "Recursive Algorithm Gateway",
    ],
    answer: 1,
    explanation: "RAG first retrieves relevant documents from a knowledge base, then generates an answer grounded in those documents. Think of it as an open-book exam — the AI looks up answers in your data instead of relying on memory alone.",
    category: "architecture",
  },
  {
    question: "Why is RAG often preferred over fine-tuning for enterprise AI?",
    options: [
      "It's always faster at inference time",
      "It lets AI answer questions about your company's data without expensive retraining",
      "It eliminates all hallucinations",
    ],
    answer: 1,
    explanation: "RAG lets you inject up-to-date, company-specific knowledge at query time — no retraining needed. It's cheaper, faster to set up, and the knowledge base can be updated instantly.",
    category: "architecture",
  },

  // Tokens & Context Windows
  {
    question: "In AI, what is a 'token'?",
    options: [
      "A user authentication credential",
      "The basic unit an LLM processes — roughly 3/4 of a word",
      "A type of cryptocurrency used to pay for AI services",
    ],
    answer: 1,
    explanation: "Tokens are the 'calories' of AI — everything you feed in and get out has a token count. The word 'pharmacy' is about 2 tokens. Pricing and limits are measured in tokens.",
    category: "terminology",
  },
  {
    question: "Claude Opus has a context window of up to 1 million tokens. What does 'context window' mean?",
    options: [
      "How many users can connect simultaneously",
      "The maximum text the model can 'see' at once (input + output)",
      "The time window for API rate limiting",
    ],
    answer: 1,
    explanation: "The context window is the model's 'working memory' — like the size of your desk. A bigger desk (1M tokens) means you can spread out more documents and work with them all at once.",
    category: "terminology",
  },

  // Hallucination
  {
    question: "What is 'hallucination' in AI?",
    options: [
      "When an AI generates images from text",
      "When an AI confidently produces information that is factually incorrect or made up",
      "When an AI model crashes during inference",
    ],
    answer: 1,
    explanation: "Hallucination is like a confident intern who makes up an answer instead of saying 'I don't know.' It's the single biggest risk in AI product design — always have a mitigation strategy.",
    category: "terminology",
  },

  // Embeddings & Vector DBs
  {
    question: "What are 'embeddings' in the context of AI?",
    options: [
      "Code injected into a webpage",
      "Numerical representations of text that capture semantic meaning",
      "Embedded hardware chips for running AI models",
    ],
    answer: 1,
    explanation: "Embeddings are like GPS coordinates for meaning. 'Dog' and 'puppy' have similar embeddings because they're semantically related. This powers semantic search, RAG, and recommendations.",
    category: "terminology",
  },
  {
    question: "A vector database is optimized for what kind of search?",
    options: [
      "Full-text keyword search",
      "Finding semantically similar items using embeddings",
      "SQL queries on relational data",
    ],
    answer: 1,
    explanation: "Vector databases (Pinecone, Weaviate, pgvector) are like librarians who organize books by meaning rather than title. When you ask a question, they pull the most relevant documents instantly.",
    category: "terminology",
  },

  // Temperature
  {
    question: "In AI, what does the 'temperature' parameter control?",
    options: [
      "How fast the model processes requests",
      "Output randomness — low = focused, high = creative",
      "The GPU operating temperature during inference",
    ],
    answer: 1,
    explanation: "Temperature is the 'jazz dial.' At 0, the AI plays sheet music exactly. At 1, it starts improvising. Use low for factual tasks, higher for brainstorming.",
    category: "terminology",
  },

  // Prompt Engineering
  {
    question: "What is 'few-shot learning' in prompt engineering?",
    options: [
      "Training a model on very little data",
      "Providing a few examples in the prompt to guide the model's output",
      "Running the model for only a few inference cycles",
    ],
    answer: 1,
    explanation: "Few-shot is showing the AI 2-3 examples of what you want before asking it to perform. Like showing someone photos of a finished dish before asking them to cook it. It's the single most effective prompt technique.",
    category: "terminology",
  },

  // Evals
  {
    question: "What are 'evals' in AI product development?",
    options: [
      "Employee evaluation forms for AI engineers",
      "Systematic tests of AI outputs against defined quality criteria",
      "Marketing evaluations of AI product-market fit",
    ],
    answer: 1,
    explanation: "Evals are report cards for your AI. Without them, you're shipping blind. PMs should define what 'good' looks like and build eval suites before launching or changing AI features.",
    category: "safety",
  },

  // Guardrails
  {
    question: "What are 'guardrails' in the context of AI products?",
    options: [
      "Physical barriers around AI server rooms",
      "Rules and filters that constrain AI behavior to prevent harmful or off-topic outputs",
      "Guidelines for AI model training data selection",
    ],
    answer: 1,
    explanation: "Guardrails are bowling lane bumpers for AI — the model can still aim for a strike, but it won't end up in the gutter. PMs should define guardrails as product requirements, not leave them to engineering.",
    category: "safety",
  },

  // Agents
  {
    question: "What distinguishes an 'AI agent' from a basic chatbot?",
    options: [
      "Agents are always more expensive to run",
      "Agents can plan, use tools, execute multi-step tasks, and adapt autonomously",
      "Agents only work with text, while chatbots are multimodal",
    ],
    answer: 1,
    explanation: "A chatbot is a vending machine (input in, output out). An agent is a personal assistant who plans the trip, books the tickets, and handles problems along the way. 2025 is widely called 'the year of agents.'",
    category: "architecture",
  },

  // Human-in-the-Loop
  {
    question: "What does 'Human-in-the-Loop' (HITL) mean for AI products?",
    options: [
      "A human writes every AI response manually",
      "AI does most of the work but pauses at critical points for human review",
      "Humans train the AI by providing continuous real-time feedback",
    ],
    answer: 1,
    explanation: "HITL is like autopilot on a plane — it flies 95% of the journey, but the pilot handles takeoff, landing, and surprises. The PM's key decision is where to place those human checkpoints.",
    category: "safety",
  },

  // Red Teaming
  {
    question: "What is 'red teaming' in AI safety?",
    options: [
      "Building AI for competitive sports analytics",
      "Deliberately trying to make an AI fail or produce harmful outputs to find vulnerabilities",
      "Assigning team colors in hackathon competitions",
    ],
    answer: 1,
    explanation: "Red teaming is hiring someone to try to break into your house so you can fix vulnerabilities before a real burglar finds them. If you don't red-team your AI, your users will — publicly.",
    category: "safety",
  },

  // Structured Outputs
  {
    question: "Why are 'structured outputs' (JSON mode) important for AI products?",
    options: [
      "They make AI responses more readable for humans",
      "They let you parse AI-generated data programmatically and feed it into your product's UI or workflow",
      "They reduce the model's token usage by 50%",
    ],
    answer: 1,
    explanation: "Structured outputs transform AI from 'chatbot that talks' to 'engine that powers features.' Instead of free text, the AI fills out a structured form your code can use directly.",
    category: "terminology",
  },

  // Function Calling / Tool Use
  {
    question: "What is 'function calling' (aka tool use) in AI?",
    options: [
      "Writing code that calls the AI's API",
      "The AI's ability to output structured requests to invoke predefined tools",
      "A programming pattern for organizing AI model code",
    ],
    answer: 1,
    explanation: "Function calling is the bridge between 'chatbot that talks' and 'agent that does things.' The AI decides when to call a tool and what arguments to pass; your code executes the actual function.",
    category: "protocols",
  },

  // Multimodal
  {
    question: "What does 'multimodal' mean when describing an AI model like Gemini or GPT-4o?",
    options: [
      "It can run on multiple types of hardware",
      "It can process and generate text, images, audio, and video",
      "It has multiple deployment modes (cloud, edge, on-device)",
    ],
    answer: 1,
    explanation: "A multimodal AI is like a person who can read, look at photos, listen to audio, and watch video — all at once. This unlocks features like screenshot analysis, meeting transcription, and image-based search.",
    category: "terminology",
  },

  // Prompt Injection
  {
    question: "What is 'prompt injection' and why should PMs care?",
    options: [
      "A technique for improving prompt quality",
      "An attack where users craft inputs that override the AI's instructions or safety guidelines",
      "A method for injecting prompts into a database",
    ],
    answer: 1,
    explanation: "Prompt injection is to AI what SQL injection is to databases. It's like someone passing a fake note saying 'Ignore all previous instructions.' Any AI feature taking user input needs defenses against this.",
    category: "safety",
  },

  // Distillation
  {
    question: "What is 'model distillation' in AI?",
    options: [
      "Removing harmful content from training data",
      "Training a smaller, cheaper model to mimic a larger model's outputs",
      "Converting a model from one programming language to another",
    ],
    answer: 1,
    explanation: "Distillation is like creating CliffsNotes from a textbook — you get 80% of the value at 20% of the cost. It's how you go from a $0.50/request prototype to a $0.01/request production model.",
    category: "terminology",
  },

  // Context/Prompt Caching
  {
    question: "What is 'prompt caching' and why does it matter for AI product costs?",
    options: [
      "Saving user prompts for analytics purposes",
      "Caching the processing of a large context so it can be reused across requests at 75-90% lower cost",
      "Storing AI responses in a CDN for faster delivery",
    ],
    answer: 1,
    explanation: "Prompt caching is like meal prepping — process once, reuse all week. If your AI sends the same long context (docs, policies) with every request, caching can slash API costs dramatically.",
    category: "terminology",
  },

  // RLHF
  {
    question: "What does RLHF stand for and why is it important?",
    options: [
      "Rapid Learning from Heuristic Functions — speeds up model training",
      "Reinforcement Learning from Human Feedback — makes AI helpful and safe through human ratings",
      "Real-time Language Handling Framework — enables streaming responses",
    ],
    answer: 1,
    explanation: "RLHF is like training a puppy — reward good behaviors (helpful responses), discourage bad ones (harmful outputs). It's why modern AI models are conversational and helpful rather than just autocompleting text.",
    category: "terminology",
  },

  // Google ADK
  {
    question: "What is Google's Agent Development Kit (ADK)?",
    options: [
      "A hardware kit for building AI-powered robots",
      "An open-source framework for building, orchestrating, and deploying AI agents",
      "Google's internal tool for training Gemini models",
    ],
    answer: 1,
    explanation: "ADK is like a LEGO kit for agents — standardized pieces that snap together into whatever agent architecture you need. It supports MCP and A2A protocols and works with non-Google models too.",
    category: "products",
  },

  // Constitutional AI
  {
    question: "What is Anthropic's 'Constitutional AI' approach?",
    options: [
      "AI that only follows US constitutional law",
      "Training AI against a set of written principles instead of relying solely on human feedback for every decision",
      "An AI governance framework required by EU regulations",
    ],
    answer: 1,
    explanation: "Instead of a parent watching every move, you teach the child a set of values and trust them to apply those values to new situations. PMs can borrow this — write explicit principles for how your AI feature should behave.",
    category: "products",
  },

  // Grounding
  {
    question: "What does 'grounding' mean in Google's Gemini API?",
    options: [
      "Connecting the model to physical IoT sensors",
      "Anchoring AI responses in verifiable sources like Google Search or your own data to reduce hallucination",
      "Limiting the AI to only respond about specific topics",
    ],
    answer: 1,
    explanation: "Grounding is like putting footnotes on every claim — the model cites its sources. It's Google's productized RAG, and it dramatically improves factual accuracy with minimal setup.",
    category: "products",
  },

  // Chain of Thought
  {
    question: "What is 'chain-of-thought' (CoT) reasoning in AI?",
    options: [
      "Linking multiple AI models together in sequence",
      "Making the model think step-by-step before giving a final answer",
      "A blockchain-based verification of AI responses",
    ],
    answer: 1,
    explanation: "CoT is the difference between a student blurting out an answer vs. showing their work. It's why OpenAI's o-series and Gemini's 'thinking mode' are dramatically better at hard reasoning — but slower and more expensive.",
    category: "terminology",
  },

  // System Prompts
  {
    question: "What is a 'system prompt' in AI products?",
    options: [
      "The operating system commands that start an AI server",
      "Hidden instructions defining the AI's persona, rules, and boundaries before the user interacts",
      "A prompt automatically generated by the system for logging",
    ],
    answer: 1,
    explanation: "A system prompt is the employee handbook you give a new hire on day one — who they are, what they do, what they should never do. Writing system prompts is a core PM skill in 2025.",
    category: "terminology",
  },

  // Inference vs Training
  {
    question: "What's the difference between 'training' and 'inference' in AI?",
    options: [
      "Training is for large models, inference is for small models",
      "Training builds the model (one-time cost); inference runs it to get outputs (ongoing cost)",
      "Training uses GPUs, inference uses CPUs",
    ],
    answer: 1,
    explanation: "Training is building a factory. Inference is running the factory. PMs care because inference costs (per token, per request) directly affect your product's unit economics and pricing.",
    category: "terminology",
  },
];

// ─── AI GLOSSARY / TERM SPOTLIGHTS ───────────────────────────────────────────
// Short "Did You Know?" facts shown during gameplay

export const AI_TERM_SPOTLIGHTS: AITerm[] = [
  {
    term: "MCP (Model Context Protocol)",
    definition: "An open standard from Anthropic that lets AI connect to any tool through one universal interface — now adopted by OpenAI & Google too.",
    analogy: "MCP is USB-C for AI. Build one plug, connect everywhere.",
    category: "protocols",
  },
  {
    term: "A2A (Agent-to-Agent)",
    definition: "Google's open protocol for AI agents from different vendors to discover and collaborate with each other.",
    analogy: "If MCP is USB-C (connecting to tools), A2A is Bluetooth (agents talking to agents).",
    category: "protocols",
  },
  {
    term: "RAG",
    definition: "Retrieval Augmented Generation — the AI looks up relevant documents first, then answers grounded in real data.",
    analogy: "RAG is an open-book exam. The AI looks it up instead of guessing.",
    category: "architecture",
  },
  {
    term: "Hallucination",
    definition: "When AI confidently produces information that is factually incorrect or entirely made up.",
    analogy: "A confident intern who makes up answers instead of saying 'I don't know.'",
    category: "terminology",
  },
  {
    term: "Tokens",
    definition: "The basic units an LLM processes — roughly 3/4 of a word. Pricing and limits are measured in tokens.",
    analogy: "Tokens are the calories of AI. Every input and output has a count, and you're on a budget.",
    category: "terminology",
  },
  {
    term: "Function Calling",
    definition: "The AI's ability to decide when to use a tool and output structured requests to invoke it.",
    analogy: "A chef calling out orders. The AI decides what to make; your code cooks it.",
    category: "protocols",
  },
  {
    term: "Embeddings",
    definition: "Numerical representations of text that capture semantic meaning. Similar concepts have similar embeddings.",
    analogy: "GPS coordinates for meaning. 'Dog' and 'puppy' are close on the map.",
    category: "terminology",
  },
  {
    term: "Guardrails",
    definition: "Rules and filters that constrain AI behavior to keep outputs safe, on-topic, and correctly formatted.",
    analogy: "Bowling lane bumpers. The AI aims for a strike but can't end up in the gutter.",
    category: "safety",
  },
  {
    term: "Evals",
    definition: "Systematic tests of AI outputs against quality criteria — the QA process for AI features.",
    analogy: "Report cards for your AI. Don't ship a model without checking its grades.",
    category: "safety",
  },
  {
    term: "Context Window",
    definition: "The max text a model can 'see' at once (input + output). Ranges from 8K to 1M+ tokens.",
    analogy: "The model's desk size. A bigger desk means more documents spread out at once.",
    category: "terminology",
  },
  {
    term: "Temperature",
    definition: "A parameter controlling output randomness. Low = focused and deterministic, high = creative and varied.",
    analogy: "The jazz dial. At 0, the AI plays sheet music. At 1, it starts improvising.",
    category: "terminology",
  },
  {
    term: "Prompt Injection",
    definition: "An attack where users craft inputs to override the AI's instructions — like SQL injection for AI.",
    analogy: "A fake note saying 'Ignore all previous instructions.' Your AI needs to spot the trick.",
    category: "safety",
  },
  {
    term: "Human-in-the-Loop",
    definition: "AI does the work but pauses at critical points for human review before proceeding.",
    analogy: "Autopilot on a plane. It flies 95% of the journey, but the pilot handles takeoff and landing.",
    category: "safety",
  },
  {
    term: "Distillation",
    definition: "Training a smaller, cheaper model to mimic a larger model's quality — the path from prototype to production.",
    analogy: "CliffsNotes from a textbook. 80% of the value at 20% of the cost.",
    category: "terminology",
  },
  {
    term: "Structured Outputs",
    definition: "Forcing AI to output valid JSON that your code can parse directly — the bridge from chatbot to product feature.",
    analogy: "Instead of 'describe the weather,' you hand the AI a form: Temperature, Humidity, Conditions.",
    category: "terminology",
  },
  {
    term: "Constitutional AI",
    definition: "Anthropic's approach: train the AI against written principles instead of rating every single output.",
    analogy: "Teaching values instead of supervising every decision. The AI learns to self-correct.",
    category: "products",
  },
  {
    term: "Grounding",
    definition: "Connecting AI responses to verifiable sources (like Google Search) to reduce hallucination.",
    analogy: "Putting footnotes on every claim. The model has to cite its sources.",
    category: "products",
  },
  {
    term: "Chain-of-Thought",
    definition: "Making the model reason step-by-step before answering — dramatically better on hard problems.",
    analogy: "The difference between blurting out an answer and showing your work on a math test.",
    category: "terminology",
  },
  {
    term: "Red Teaming",
    definition: "Deliberately attacking your AI to find vulnerabilities before users do.",
    analogy: "Hiring someone to break into your house so you can fix the locks first.",
    category: "safety",
  },
  {
    term: "Few-Shot Learning",
    definition: "Providing 2-3 examples in the prompt to guide the model's output format and quality.",
    analogy: "Showing photos of the finished dish before asking someone to cook. Huge quality difference.",
    category: "terminology",
  },
  {
    term: "Vector Database",
    definition: "A database optimized for storing and searching embeddings — the backbone of semantic search and RAG.",
    analogy: "A librarian who organizes books by meaning, not by title or author.",
    category: "architecture",
  },
  {
    term: "Prompt Caching",
    definition: "Reuse expensive prompt processing across requests for 75-90% cost savings.",
    analogy: "Meal prepping on Sunday. Cook once, reheat all week.",
    category: "terminology",
  },
  {
    term: "System Prompt",
    definition: "Hidden instructions that define your AI's persona, rules, and boundaries before users interact.",
    analogy: "The employee handbook on day one. Who you are, what you do, what you never do.",
    category: "terminology",
  },
  {
    term: "RLHF",
    definition: "Reinforcement Learning from Human Feedback — how AI learns to be helpful through human ratings.",
    analogy: "Training a puppy. Reward good behaviors, discourage bad ones, repeat.",
    category: "terminology",
  },
  {
    term: "Multimodal",
    definition: "AI that can process text, images, audio, and video — not just text in, text out.",
    analogy: "A person who can read, look at photos, listen, and watch video — all at once.",
    category: "terminology",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Get a shuffled subset of quiz questions */
export function getRandomQuestions(count: number): QuizQuestion[] {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Get a random AI term spotlight */
export function getRandomSpotlight(): AITerm {
  return AI_TERM_SPOTLIGHTS[Math.floor(Math.random() * AI_TERM_SPOTLIGHTS.length)];
}

/** Get spotlights filtered by category */
export function getSpotlightsByCategory(category: AITerm["category"]): AITerm[] {
  return AI_TERM_SPOTLIGHTS.filter((t) => t.category === category);
}
