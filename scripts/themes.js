// Builds themes/index.json from the header comment of every themes/*.css (@name, @description,
// @author). The demo reads it to offer each theme. Run directly or through npm run build.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** @param {string} dir */
export function themeList(dir) {
  return readdirSync(dir).filter((f) => f.endsWith(".css")).sort().map((file) => {
    const header = /^\s*\/\*([\s\S]*?)\*\//.exec(readFileSync(join(dir, file), "utf8"))?.[1] ?? "";
    // A tag runs until the next tag or the end of the comment; line breaks and leading "*" fold away.
    const tag = (name) => (new RegExp(`@${name}\\s+([\\s\\S]*?)(?=@\\w|$)`).exec(header)?.[1] ?? "").replace(/\s*\n\s*\*?\s*/g, " ").trim();
    return { file, name: tag("name") || file.replace(/\.css$/, ""), description: tag("description"), author: tag("author") };
  });
}

/** @param {string} dir */
export function writeThemeList(dir) {
  writeFileSync(join(dir, "index.json"), JSON.stringify(themeList(dir), null, 2) + "\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) writeThemeList(process.argv[2] ?? "themes");
