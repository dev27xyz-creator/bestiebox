import { writeFile, mkdir } from "node:fs/promises";
import { routeDefinitions } from "../src/lib/routes";

await mkdir("public", { recursive: true });
await writeFile("public/generated-routes.json", `${JSON.stringify(routeDefinitions, null, 2)}\n`, "utf8");
console.log(`Generated ${routeDefinitions.length} pre-rendered route definitions.`);
