const path = require('path');
const readline = require('readline');
const { askPromise } = require('./utils/ask-questions');
const color = require('./utils/color-functions');
const { saveFile } = require('./utils/save-file');
const toJson = require('./utils/to-json');
const { isYes, isNo } = require('./utils/yes-no-answer');
const {
  print,
  printBgGreen,
  printRed,
  printGreen,
  printYellow,
  printWhite,
  printCyan,
  printMagenta,
  printBlue,
} = require('./utils/print');
const { breakLine } = require('./utils/break-line');
const { runSystemCommand } = require('./utils/run-system-command');

console.clear();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

const questions = [
  { question: 'Which of these package managers do you use?', options: ['yarn', 'npm', 'pnpm',] },
  { question: 'Do you use React?', options: ['Yes', 'No'] },
  { question: 'Do you use TypeScript?', options: ['Yes', 'No'] },
  { question: 'Do you want to continue with the installation process?', options: ['Yes', 'No'] },
];

let currentQuestion = 0;
let selectedIndex = 0;
const answers = [];

function renderQuestion() {
  console.clear();
  printBgGreen('Welcome to installing and configuring Eslint!')
  breakLine();
  if (currentQuestion === 3) {
    printMagenta('Your choices:');
    breakLine();
    questions.forEach((q, index) => {
      if(index === questions.length - 1) {
        return
      }
      console.log(`${q.question} -> ${color.red(answers[index])}`);
    });
    breakLine();
  }
  printGreen(questions[currentQuestion].question);
  questions[currentQuestion].options.forEach((option, index) => {
    if (index === selectedIndex) {
      printBlue(`> ${option}`);
    } else {
      console.log(`  ${option}`);
    }
  });
}

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.name === 'up') {
    selectedIndex = (selectedIndex > 0) ? selectedIndex - 1 : questions[currentQuestion].options.length - 1;
    renderQuestion();
  } else if (key.name === 'down') {
    selectedIndex = (selectedIndex < questions[currentQuestion].options.length - 1) ? selectedIndex + 1 : 0;
    renderQuestion();
  } else if (key.name === 'return') {
    answers.push(questions[currentQuestion].options[selectedIndex]); // Armazena a resposta
    currentQuestion++;
    selectedIndex = 0;

    if (currentQuestion === questions.length) {
      console.log(answers[answers.length-1])
      if (answers[answers.length-1] === 'No') {
        process.exit();
      }
      executeNpmCommand();
    }
    if (currentQuestion < questions.length) {
      renderQuestion();
    }
  } else if (key.name === 'escape' || key.ctrl && key.name === 'c') {
    process.exit();
  }
});

const executeNpmCommand = () => {
  console.clear();
  printGreen(`Ok! Trying to install packages.`);
  printGreen(`This may take a while. Please wait...`);
  let npmCommand;
  if(answers[0] === 'npm') {
    npmCommand = 'npm install -D eslint eslint-config-prettier ';
  }
  if(answers[0] === 'yarn') {
    npmCommand = 'yarn -D eslint eslint-config-prettier ';
  }
  if(answers[0] === 'pnpm') {
    npmCommand = 'pnpm i -D eslint eslint-config-prettier ';
  }
  npmCommand += 'eslint-plugin-prettier prettier';

  const eslintConfigObj = require('./eslint_config_file');
  const prettierConfigObj = require('./prettier_config_file');

  if (askPromise.answers.usingReact) {
    eslintConfigObj.extends = [
      ...eslintConfigObj.extends,
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
    ];
    eslintConfigObj.settings = {
      react: {
        version: 'detect',
      },
    };
    eslintConfigObj.plugins.push('react');
    npmCommand += ' eslint-plugin-react eslint-plugin-react-hooks ';
  }

  if (askPromise.answers.usingTypeScript) {
    eslintConfigObj.extends = [
      ...eslintConfigObj.extends,
      'plugin:@typescript-eslint/recommended',
    ];
    eslintConfigObj.parser = '@typescript-eslint/parser';
    eslintConfigObj.plugins.push('@typescript-eslint');
    npmCommand += ' @typescript-eslint/eslint-plugin @typescript-eslint/parser';
  }

  breakLine();
  printYellow(`Eslint configuration to be applied: `);
  print(color.white, toJson(eslintConfigObj));

  breakLine();
  printYellow(`Prettier configuration to be applied: `);
  printWhite(toJson(prettierConfigObj));

  const eslintFilePath = path.resolve('.', '.eslintrc.json');
  const prettierFilePath = path.resolve('.', '.prettierrc.json');
  breakLine();

  const systemCommandCallback = (error, stdout) => {
    if (error) {
      breakLine();
      printRed(`An error occurred:`);

      breakLine();
      printRed(`${error.message}`);

      process.exit();
    }

    printCyan(`Installation completed:`);
    breakLine();
    printCyan(`${stdout}`);

    saveFile(eslintFilePath, eslintConfigObj);
    saveFile(prettierFilePath, prettierConfigObj);

    printGreen(`.eslintrc.json saved: ${eslintFilePath}`);
    printGreen(`.prettierrc.json saved: ${prettierFilePath}`);

    breakLine();
    printMagenta(`Seems like everything is fine!`);
    printMagenta(`You may need to reload your editor 😊!`);

    print(color.magenta, 'BYE!');

    process.exit();
  };

  runSystemCommand(npmCommand, systemCommandCallback);
};

renderQuestion();