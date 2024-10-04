#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs";
import { exec } from "child_process";
import chalk from "chalk";
import figlet from "figlet";
import cliSpinners from "cli-spinners";
import ora from "ora";

const displayWelcomeMessage = () => {
  console.log(
    chalk.green(
      figlet.textSync("NOUR CLI", {
        font: "ghost",
        horizontalLayout: "default",
        verticalLayout: "default",
      })
    )
  );
  console.log(
    chalk.yellow(
      "Welcome to time saving Terminal 😎\nJust let me help you with your project configuration settings ✨"
    )
  );
};

const createProjectDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir);
  process.chdir(dir);
};

const executeCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(`Error: ${error.message}`);
      if (stderr) return reject(`Stderr: ${stderr}`);
      resolve(stdout);
    });
  });
};

const installTypeScript = async () => {
  await executeCommand("npm install typescript --save-dev");
  await executeCommand("npx tsc --init");
};

const waitForFolderCreation = (folderPath) => {
  return new Promise((resolve) => {
    const checkFolder = setInterval(() => {
      if (fs.existsSync(folderPath)) {
        clearInterval(checkFolder);
        resolve();
      }
    }, 100);
  });
};

const updatePackageJson = (renamedDir, answers) => {
  fs.readFile(`${renamedDir}/package.json`, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading package.json:", err);
      process.exit();
    }
    let packageJson = JSON.parse(data);
    packageJson.name = answers.name;
    packageJson.version = answers.version || "1.0.0";
    packageJson.author = answers.author || "";
    packageJson.tech = [
      "Typescript",
      "React_ts",
      "Vue_ts",
      "Angular_ts",
    ].includes(answers.tech)
      ? "module"
      : "commonjs";
    packageJson.scripts = {
      run: {
        Typescript: "tsc index.ts",
        Vue: "npm run dev",
        React: "npm start",
        Angular: "ng serve",
      }[answers.tech],
      build: {
        Typescript: "tsc && node dist/index.js",
        Vue: "npm run build",
        React: "npm run build",
        Angular: "ng build",
      }[answers.tech],
      test: 'echo "Error: no test specified" && exit 1',
    };
    fs.writeFile(
      `${renamedDir}/package.json`,
      JSON.stringify(packageJson, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing package.json:", err);
          process.exit();
        }
      }
    );
  });
};

const createProject = async (answers) => {
  const dir = "./Project";
  createProjectDirectory(dir);

  const commands = {
    Typescript: `npm install typescript --save-dev && npx tsc --init`,
    Vue: `npm create vite@latest my-vue-app -- --template vue`,
    Vue_ts: "npm create vite@latest my-vue-app -- --template vue-ts",
    React: `npm create vite@latest my-react-app -- --template react`,
    React_ts: `npm create vite@latest my-react-app -- --template react-ts`,
    Angular: `npm install -g @angular/cli && ng new ${answers.name}`,
    Angular_ts: `npm install -g @angular/cli && ng new ${answers.name}`,
  };

  await executeCommand(commands[answers.tech]);

  if (["React_ts", "Vue_ts", "Angular_ts"].includes(answers.tech)) {
    await installTypeScript();
  }

  if (answers.tech === "Typescript") {
    fs.mkdirSync(`${process.cwd()}/${answers.name}`);
    process.chdir(`${process.cwd()}/${answers.name}`);
    fs.writeFileSync("index.ts", 'console.log("Hello, world!");');
  } else {
    const newDir = `${process.cwd()}/my-${answers.tech
      .toLowerCase()
      .replace("_ts", "")}-app`;
    await waitForFolderCreation(newDir);
    const renamedDir = `${process.cwd()}/${answers.name}`;
    fs.renameSync(newDir, renamedDir);
    process.chdir(renamedDir);
    updatePackageJson(renamedDir, answers);
  }

  const spinner = ora({
    text: "Setting up your project...",
    spinner: cliSpinners.dots,
  }).start();

  setTimeout(() => {
    spinner.succeed("Project setup complete!");
  }, 3000);

  console.log(chalk.green("\nYour project is ready!"));
  console.log(
    chalk.whiteBright(
      `\nTo get started, navigate to your project directory and run the following commands:`
    )
  );
  console.log(chalk.greenBright(`\ncd ${answers.name}`));
  console.log(chalk.greenBright(`npm install`));
  console.log(chalk.greenBright(`npm start`));
  const techDocs = {
    Typescript: "https://www.typescriptlang.org/docs/",
    React: "https://reactjs.org/docs/getting-started.html",
    React_ts: "https://reactjs.org/docs/getting-started.html",
    Vue: "https://vuejs.org/v2/guide/",
    Vue_ts: "https://vuejs.org/v2/guide/typescript.html",
    Angular: "https://angular.io/docs",
    Angular_ts: "https://angular.io/docs",
  };

  const docContent = `
    # ${answers.tech} Documentation

    You have selected ${
      answers.tech
    } for your project. Here is the link to the official documentation to help you get started:

    ${techDocs[answers.tech]}
  `;

  console.log(chalk.yellowBright(docContent));
};

const main = async () => {
  displayWelcomeMessage();

  const program = new Command();
  const questions = [
    {
      type: "input",
      name: "name",
      message: "Project name",
      validate: (input) => (input ? true : "Project name is required"),
    },
    {
      type: "list",
      name: "tech",
      message: "Select a tech",
      choices: [
        "Typescript",
        "React",
        "React_ts",
        "Vue",
        "Vue_ts",
        "Angular",
        "Angular_ts",
      ],
    },
    { type: "input", name: "author", message: "Author name" },
    { type: "input", name: "version", message: "Version" },
  ];

  program
    .name("time saving terminal")
    .description("CLI to create a new projects")
    .version("1.0.0");

  program
    .command("create")
    .alias("c")
    .description("Create a new project")
    .action(async () => {
      try {
        const answers = await inquirer.prompt(questions);
        await createProject(answers);
      } catch (err) {
        console.error(err);
      }
    });

  program
    .command("list")
    .alias("l")
    .description("Lists all Technologies")
    .action(() => {
      const techDocs = {
        Typescript: "https://www.typescriptlang.org/docs/",
        React: "https://reactjs.org/docs/getting-started.html",
        Vue: "https://vuejs.org/v2/guide/",
        Angular: "https://angular.io/docs",
      };

      console.log(`# Technologies Documentation`);
      for (const [tech, url] of Object.entries(techDocs)) {
        console.log(
          chalk.whiteBright(`${tech}`),
          ":",
          chalk.blueBright(`${url}`)
        );
      }
    });

  program.parse(process.argv);
};

main();
