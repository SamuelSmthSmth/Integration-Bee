# Integration-Bee

A real-time web application for hosting Integration Bee competitions, where contestants solve calculus integration problems against the clock.

## Overview

Integration Bee is an interactive mathematical competition platform that allows participants to solve integration problems in real-time. The application features a dual-interface system: a host display for projecting problems and contestant answers, and a remote control interface for contestants to input their solutions using a custom calculator interface.

## Features

- **Real-time Collaboration**: Built with Socket.IO for instant synchronization between host and remote displays
- **LaTeX Rendering**: Mathematical expressions rendered beautifully using KaTeX
- **Custom Calculator Interface**: Easy-to-use button interface for entering mathematical expressions including:
  - Basic arithmetic operations (+, -, ×, /)
  - Trigonometric functions (sin, cos, tan)
  - Logarithmic and exponential functions (ln, e)
  - Variables (x, y, u, π)
  - Integration symbols and notation
- **Timer System**: 3-minute countdown timer for each problem
- **Answer Validation**: Automatic checking of submitted answers using numerical evaluation
- **Sample Problems**: Pre-loaded set of integration problems including:
  - Polynomial integrals
  - Trigonometric integrals
  - Exponential integrals
  - Product integrals

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SamuelSmthSmth/Integration-Bee.git
   cd Integration-Bee
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```

2. Open two browser windows:
   - **Host Display**: Navigate to `http://localhost:3000/host.html`
   - **Remote Control**: Navigate to `http://localhost:3000/remote.html`

3. Click "Start" on the remote control to begin a new problem

4. Enter your answer using the calculator interface

5. Click "SUBMIT" to check your answer

## Technical Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Math Processing**: MathJS
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Math Rendering**: KaTeX

## Project Structure

```
Integration-Bee/
├── server.js           # Express server with Socket.IO logic
├── package.json        # Project dependencies and scripts
├── public/
│   ├── host.html      # Host display interface
│   ├── remote.html    # Remote control interface
│   └── style.css      # Application styling
└── README.md          # Project documentation
```

## License

ISC
