import { plannerAgent } from "./planner/planner";

async function main() {
  const result = await plannerAgent("How to make a pizza?");
  console.log(result);
}

main().catch(console.error);