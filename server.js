const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const math = require('mathjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Current equation state - array of tokens
let inputTokens = [];
// Cursor position in the token array
let cursorIndex = 0;

// Sample integrals for the game
const sampleIntegrals = [
  { display: '\\int x \\, dx', answer: '0.5 * x^2' },
  { display: '\\int e^x \\, dx', answer: 'e^x' },
  { display: '\\int x^2 \\, dx', answer: '(1/3) * x^3' },
  { display: '\\int \\sin(x) \\, dx', answer: '-cos(x)' },
  { display: '\\int \\cos(x) \\, dx', answer: 'sin(x)' },
  { display: '\\int \\frac{1}{x} \\, dx', answer: 'ln(x)' },
  { display: '\\int x e^x \\, dx', answer: 'x * e^x - e^x' },
  { display: '\\int \\ln(x) \\, dx', answer: 'x * ln(x) - x' }
];

// Current problem
let currentProblem = null;

// Helper function to convert LaTeX to MathJS format
function toMathJS(latexString) {
  return latexString
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\ln/g, 'log') // MathJS uses 'log' for natural log
    .replace(/\\pi/g, 'pi')
    .replace(/\\sqrt/g, 'sqrt')
    .replace(/{/g, '(')  // Replace { with (
    .replace(/}/g, ')')  // Replace } with )
    .replace(/dx/g, ''); // Remove dx entirely
}

// Function to clean LaTeX for MathJS evaluation
function cleanLatexForMathJs(latex) {
  return latex
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\ln/g, 'log') // MathJS uses 'log' for natural log
    .replace(/\\pi/g, 'pi')
    .replace(/\\sqrt/g, 'sqrt')
    .replace(/\\left\|/g, 'abs(')  // \left| → abs(
    .replace(/\\right\|/g, ')')    // \right| → )
    .replace(/dx/g, '') // Remove dx
    .replace(/\\text\{[^}]*\}/g, '') // Remove \text{...} tags
    .replace(/\\/g, '') // Remove any remaining backslashes
    .replace(/{/g, '')  // Remove curly braces (formatting wrappers)
    .replace(/}/g, ''); // Remove curly braces (formatting wrappers)
}

// Function to emit updated equation to host
function emitEquationUpdate() {
  let equationToSend;
  if (inputTokens.length === 0) {
    equationToSend = cursorIndex === 0 ? '\\textcolor{#faa}{|}' : '\\text{Enter equation...}';
  } else {
    // Insert cursor at cursorIndex position
    const tokensWithCursor = [...inputTokens];
    tokensWithCursor.splice(cursorIndex, 0, '\\textcolor{#faa}{|}');
    equationToSend = tokensWithCursor.join('');
  }
  io.emit('update_math', equationToSend);
  console.log('Equation updated:', equationToSend);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current equation to newly connected client
  emitEquationUpdate();

  // Handle 'join' event
  socket.on('join', () => {
    console.log('Client joined:', socket.id);
  });

  // Handle 'keystroke' event - insert token at cursor position
  socket.on('keystroke', (key) => {
    console.log('Keystroke received:', key);
    inputTokens.splice(cursorIndex, 0, key);
    cursorIndex++;
    emitEquationUpdate();
  });

  // Handle 'command' event - modify equation
  socket.on('command', (command) => {
    console.log('Command received:', command);
    
    if (command === 'clear') {
      inputTokens = [];
      cursorIndex = 0;
    } else if (command === 'backspace' || command === 'delete') {
      if (cursorIndex > 0) {
        inputTokens.splice(cursorIndex - 1, 1);
        cursorIndex--;
      }
    } else if (command === 'left') {
      cursorIndex = Math.max(0, cursorIndex - 1);
    } else if (command === 'right') {
      cursorIndex = Math.min(inputTokens.length, cursorIndex + 1);
    }
    
    emitEquationUpdate();
  });

  // Handle 'start_game' event - pick random problem and emit to host
  socket.on('start_game', () => {
    console.log('Start game event received from:', socket.id);
    currentProblem = sampleIntegrals[Math.floor(Math.random() * sampleIntegrals.length)];
    // Clear input tokens when starting a new problem
    inputTokens = [];
    cursorIndex = 0;
    emitEquationUpdate();
    io.emit('new_problem', currentProblem.display);
    console.log('New problem selected:', currentProblem);
  });

  // Handle 'submit' event - check answer using mathjs
  socket.on('submit', () => {
    console.log('Submit event received from:', socket.id);
    
    if (!currentProblem) {
      console.log('No current problem');
      return;
    }

    // Construct user's answer string from tokens
    const userAnswer = inputTokens.join('');
    
    if (!userAnswer || userAnswer.trim() === '') {
      console.log('User answer is empty');
      io.emit('wrong_answer');
      return;
    }

    try {
      // Test value for x
      const testValue = 2.345;
      
      // Clean LaTeX for MathJS evaluation
      let userMathString = cleanLatexForMathJs(userAnswer);
      
      // Remove int symbol (not needed for evaluation)
      userMathString = userMathString.replace(/int/g, '');
      
      console.log('User answer (LaTeX):', userAnswer);
      console.log('User answer (MathJS):', userMathString);
      
      // Evaluate user's answer
      let userValue;
      try {
        userValue = math.evaluate(userMathString, { x: testValue });
      } catch (evalError) {
        console.error('Error evaluating user answer:', evalError);
        io.emit('syntax_error');
        return;
      }
      
      // Evaluate correct answer
      let correctValue;
      try {
        const correctMathString = cleanLatexForMathJs(currentProblem.answer);
        correctValue = math.evaluate(correctMathString, { x: testValue });
      } catch (evalError) {
        console.error('Error evaluating correct answer:', evalError);
        io.emit('syntax_error');
        return;
      }
      
      // Check if answers are close (within 0.001)
      const difference = Math.abs(userValue - correctValue);
      console.log('User answer value:', userValue);
      console.log('Correct answer value:', correctValue);
      console.log('Difference:', difference);
      
      if (difference < 0.001) {
        io.emit('correct_answer');
        console.log('Correct answer!');
      } else {
        io.emit('wrong_answer');
        console.log('Wrong answer');
      }
    } catch (error) {
      console.error('Error in submit handler:', error);
      io.emit('syntax_error');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
