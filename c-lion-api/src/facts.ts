import factsText from "../facts.txt";

export const SEA_LION_FACTS: string[] = factsText
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

export function getRandomFact(): string {
  return SEA_LION_FACTS[Math.floor(Math.random() * SEA_LION_FACTS.length)];
}
