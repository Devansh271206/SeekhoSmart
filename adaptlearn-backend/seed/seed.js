/**
 * Seed script — run once to populate the database with sample content.
 * Usage: node seed/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const Topic      = require('../models/Topic');
const Lesson     = require('../models/Lesson');
const Quiz       = require('../models/Quiz');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptlearn';

/* ── Sample data ──────────────────────────────────────────────────────────── */

const topics = [
  { title: 'JavaScript Basics',    icon: '🟨', color: '#f7df1e', order: 1, description: 'Core JavaScript concepts every developer should know.' },
  { title: 'HTML & CSS',           icon: '🌐', color: '#e34c26', order: 2, description: 'Building and styling web pages from scratch.' },
  { title: 'Python Fundamentals',  icon: '🐍', color: '#3572a5', order: 3, description: 'Getting started with Python programming.' },
  { title: 'Data Structures',      icon: '🏗️',  color: '#6c63ff', order: 4, description: 'Arrays, linked lists, stacks, queues and more.' },
];

// lessons[topicIndex] = array of lesson objects (without topic id)
const lessonTemplates = [
  // JavaScript Basics
  [
    {
      title: 'Variables & Data Types',
      difficulty: 'beginner',
      order: 1,
      content: `<h2>Variables & Data Types</h2>
<p>JavaScript has three ways to declare variables: <code>var</code>, <code>let</code>, and <code>const</code>.</p>
<ul>
  <li><strong>var</strong> — function-scoped, avoid in modern code</li>
  <li><strong>let</strong> — block-scoped, reassignable</li>
  <li><strong>const</strong> — block-scoped, not reassignable</li>
</ul>
<h3>Primitive Types</h3>
<pre><code>let num    = 42;           // Number
let str    = "hello";      // String
let bool   = true;         // Boolean
let n      = null;         // Null
let u      = undefined;    // Undefined
let sym    = Symbol("id"); // Symbol
let big    = 9007199254740991n; // BigInt</code></pre>`,
    },
    {
      title: 'Functions & Scope',
      difficulty: 'beginner',
      order: 2,
      content: `<h2>Functions & Scope</h2>
<p>Functions are reusable blocks of code. JavaScript supports several function syntaxes.</p>
<pre><code>// Function declaration
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function
const greet = (name) => \`Hello, \${name}!\`;</code></pre>
<p>Scope determines where variables are accessible. Variables declared with <code>let</code> or <code>const</code> are block-scoped.</p>`,
    },
    {
      title: 'Arrays & Objects',
      difficulty: 'intermediate',
      order: 3,
      content: `<h2>Arrays & Objects</h2>
<p>Arrays store ordered collections; objects store key-value pairs.</p>
<pre><code>const fruits = ['apple', 'banana', 'cherry'];
fruits.push('date');
fruits.map(f => f.toUpperCase()); // ['APPLE', ...]

const user = { name: 'Alice', age: 30 };
const { name, age } = user; // destructuring</code></pre>`,
    },
  ],
  // HTML & CSS
  [
    {
      title: 'HTML Document Structure',
      difficulty: 'beginner',
      order: 1,
      content: `<h2>HTML Document Structure</h2>
<p>Every HTML page follows a standard structure:</p>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
  &lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;Hello World&lt;/h1&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>`,
    },
    {
      title: 'CSS Selectors & Box Model',
      difficulty: 'beginner',
      order: 2,
      content: `<h2>CSS Selectors & Box Model</h2>
<p>CSS selectors target elements to apply styles. The box model describes every element as a nested set of boxes: <strong>content → padding → border → margin</strong>.</p>
<pre><code>/* Element selector */
p { color: navy; }

/* Class selector */
.card { padding: 1rem; }

/* Box model */
.box {
  width: 200px;
  padding: 16px;
  border: 2px solid #333;
  margin: 8px;
}</code></pre>`,
    },
  ],
  // Python Fundamentals
  [
    {
      title: 'Python Syntax & Variables',
      difficulty: 'beginner',
      order: 1,
      content: `<h2>Python Syntax & Variables</h2>
<p>Python uses indentation instead of braces. Variables are dynamically typed.</p>
<pre><code>name = "Alice"
age  = 30
pi   = 3.14159

print(f"Hello, {name}! You are {age} years old.")</code></pre>`,
    },
    {
      title: 'Lists, Tuples & Dicts',
      difficulty: 'beginner',
      order: 2,
      content: `<h2>Lists, Tuples & Dictionaries</h2>
<p>Python's core collection types:</p>
<pre><code>fruits = ['apple', 'banana']   # list — mutable
coords = (10, 20)              # tuple — immutable
user   = {'name': 'Bob', 'age': 25}  # dict

# List comprehension
squares = [x**2 for x in range(10)]</code></pre>`,
    },
  ],
  // Data Structures
  [
    {
      title: 'Arrays & Linked Lists',
      difficulty: 'intermediate',
      order: 1,
      content: `<h2>Arrays & Linked Lists</h2>
<p><strong>Arrays</strong> store elements in contiguous memory — O(1) random access, O(n) insertion.</p>
<p><strong>Linked lists</strong> store elements as nodes with pointers — O(1) insertion at head, O(n) search.</p>
<pre><code>// Singly linked list node
class Node {
  constructor(val) {
    this.val  = val;
    this.next = null;
  }
}</code></pre>`,
    },
    {
      title: 'Stacks & Queues',
      difficulty: 'intermediate',
      order: 2,
      content: `<h2>Stacks & Queues</h2>
<p><strong>Stack</strong> — LIFO (Last In, First Out). Use cases: undo, call stack, parenthesis matching.</p>
<p><strong>Queue</strong> — FIFO (First In, First Out). Use cases: task scheduling, BFS traversal.</p>
<pre><code>// Stack with an array
const stack = [];
stack.push(1); stack.push(2);
stack.pop();   // 2

// Queue
const queue = [];
queue.push('a'); queue.push('b');
queue.shift();   // 'a'</code></pre>`,
    },
  ],
];

// quizTemplates[topicIndex][lessonIndex] = array of questions
const quizTemplates = [
  // JS Basics
  [
    [ // Lesson 0
      {
        text: 'Which keyword declares a block-scoped variable that can be reassigned?',
        options: [
          { text: 'var',   isCorrect: false },
          { text: 'let',   isCorrect: true  },
          { text: 'const', isCorrect: false },
          { text: 'def',   isCorrect: false },
        ],
        explanation: '`let` is block-scoped and allows reassignment. `const` is block-scoped but not reassignable. `var` is function-scoped.',
      },
      {
        text: 'What is the type of `null` in JavaScript?',
        options: [
          { text: 'null',    isCorrect: false },
          { text: 'object',  isCorrect: true  },
          { text: 'undefined', isCorrect: false },
          { text: 'string',  isCorrect: false },
        ],
        explanation: 'typeof null === "object" is a known JavaScript quirk / bug that was never fixed for backwards compatibility.',
      },
    ],
    [ // Lesson 1
      {
        text: 'Which of these is an arrow function syntax?',
        options: [
          { text: 'function greet => (name) {}', isCorrect: false },
          { text: 'const greet = (name) => {};', isCorrect: true  },
          { text: 'def greet(name):',            isCorrect: false },
          { text: 'greet(name) -> {}',           isCorrect: false },
        ],
        explanation: 'Arrow functions use the `=>` syntax: `const fn = (params) => expression`.',
      },
    ],
    [ // Lesson 2
      {
        text: 'Which array method returns a NEW array transformed by a callback?',
        options: [
          { text: 'forEach', isCorrect: false },
          { text: 'push',    isCorrect: false },
          { text: 'map',     isCorrect: true  },
          { text: 'pop',     isCorrect: false },
        ],
        explanation: '`Array.prototype.map()` returns a new array with each element transformed by the callback.',
      },
    ],
  ],
  // HTML & CSS
  [
    [ // Lesson 0
      {
        text: 'Which tag is used for the main visible content of an HTML document?',
        options: [
          { text: '<head>',  isCorrect: false },
          { text: '<html>',  isCorrect: false },
          { text: '<body>',  isCorrect: true  },
          { text: '<main>',  isCorrect: false },
        ],
        explanation: 'The `<body>` tag contains all the visible page content. `<head>` holds metadata.',
      },
    ],
    [ // Lesson 1
      {
        text: 'In the CSS box model, which property creates space INSIDE the border?',
        options: [
          { text: 'margin',  isCorrect: false },
          { text: 'padding', isCorrect: true  },
          { text: 'border',  isCorrect: false },
          { text: 'outline', isCorrect: false },
        ],
        explanation: 'Padding is space between the content and the border. Margin is space outside the border.',
      },
    ],
  ],
  // Python
  [
    [ // Lesson 0
      {
        text: 'Which symbol is used for f-strings in Python?',
        options: [
          { text: 'p"..."',  isCorrect: false },
          { text: 's"..."',  isCorrect: false },
          { text: 'f"..."',  isCorrect: true  },
          { text: 'r"..."',  isCorrect: false },
        ],
        explanation: 'f-strings (formatted string literals) start with `f` and allow expressions inside `{}`.',
      },
    ],
    [ // Lesson 1
      {
        text: 'Which Python collection type is IMMUTABLE?',
        options: [
          { text: 'list',  isCorrect: false },
          { text: 'dict',  isCorrect: false },
          { text: 'set',   isCorrect: false },
          { text: 'tuple', isCorrect: true  },
        ],
        explanation: 'Tuples cannot be changed after creation; lists, dicts, and sets are all mutable.',
      },
    ],
  ],
  // Data Structures
  [
    [ // Lesson 0
      {
        text: 'What is the time complexity of random access in an array?',
        options: [
          { text: 'O(n)',    isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(1)',    isCorrect: true  },
          { text: 'O(n²)',   isCorrect: false },
        ],
        explanation: 'Arrays support O(1) random access because elements are stored in contiguous memory.',
      },
    ],
    [ // Lesson 1
      {
        text: 'A Stack follows which principle?',
        options: [
          { text: 'FIFO', isCorrect: false },
          { text: 'LIFO', isCorrect: true  },
          { text: 'LILO', isCorrect: false },
          { text: 'FILO', isCorrect: false },
        ],
        explanation: 'Stack = Last In, First Out. The most recently added element is removed first.',
      },
    ],
  ],
];

/* ── Seed function ────────────────────────────────────────────────────────── */

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Topic.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
  ]);
  console.log('🗑️   Cleared existing topics, lessons, quizzes');

  for (let ti = 0; ti < topics.length; ti++) {
    const topic = await Topic.create(topics[ti]);
    console.log(`📚  Created topic: ${topic.title}`);

    const topicLessons = lessonTemplates[ti] || [];

    for (let li = 0; li < topicLessons.length; li++) {
      const lesson = await Lesson.create({ ...topicLessons[li], topic: topic._id });
      console.log(`   📖 Lesson: ${lesson.title}`);

      const questions = (quizTemplates[ti] || [])[li];
      if (questions && questions.length) {
        await Quiz.create({ lesson: lesson._id, questions });
        console.log(`      ✅ Quiz added (${questions.length} questions)`);
      }
    }
  }

  console.log('\n🎉  Seed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
