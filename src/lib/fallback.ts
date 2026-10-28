// Offline slogan ideas, used when the AI service is unavailable.
import type { GraphicId } from "./types";

const BY_GRAPHIC: Record<GraphicId, string[]> = {
  robot: ["Built to Compete", "Code. Build. Win.", "Powered by Teamwork", "Beep Boop, We Win"],
  gear: ["Every Gear Matters", "Geared for Greatness", "We Make It Turn", "Small Gears, Big Ideas"],
  rocket: ["Launch Mode: On", "Aim Higher", "Built for Lift-Off", "Next Stop: Finals"],
  bolt: ["Charged Up", "Full Power Team", "Spark the Future", "Fast Thinkers"],
  star: ["Shine Together", "Star Builders", "Reach for More", "Team of Stars"],
  chip: ["Think. Code. Repeat.", "Smart by Design", "Debug the World", "Logic Wins"],
  none: ["Stronger Together", "One Team, One Goal", "Learn. Build. Share.", "Here to Build"],
};

export function fallbackSlogans(teamName: string, graphic: GraphicId): string[] {
  const list = [...BY_GRAPHIC[graphic]];
  const name = teamName.trim();
  if (name) list.unshift(`${name}: Built Different`.slice(0, 40), `Team ${name}, Full Speed`.slice(0, 40));
  return list.slice(0, 5);
}
