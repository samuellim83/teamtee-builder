// Shared types for the app and the Cloudflare Worker.

export type Garment = "tee" | "polo" | "hoodie";
export type GraphicId = "robot" | "gear" | "rocket" | "bolt" | "star" | "chip" | "none";
export type BackStyle = "none" | "team" | "slogan" | "names";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

export interface Member {
  id: string;
  name: string;
  number: string;
  size: Size;
}

export interface Design {
  garment: Garment;
  shirtColor: string;        // hex
  graphic: GraphicId;
  teamName: string;
  frontInks: string[];       // 1 to 4 ink colours (hex) used on the front print
  backStyle: BackStyle;
  slogan: string;            // used when backStyle is "slogan"
  backInk: string;           // single ink colour for the back
  members: Member[];         // roster: each row is one shirt
}

// What the browser sends to /api/suggest
export interface SuggestRequest {
  task: "slogans";
  teamName: string;
  graphic: GraphicId;
  vibe: string;              // short free text, e.g. "robotics club, primary school"
}

export interface SuggestResponse {
  suggestions: string[];
  source: "ai" | "fallback";
}
