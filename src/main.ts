import { plannerAgent } from "./planner/planner";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function main() {
  const rl = readline.createInterface({ input, output });
  const task = await rl.question("What is your task? ");
  rl.close();

  const result = await plannerAgent(task);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);