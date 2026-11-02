import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../public/plugins.json", import.meta.url), "utf8"));
if (manifest.schema_version !== 1 || manifest.runtime !== "dexter-media-adapter-v1" || !Array.isArray(manifest.plugins)) {
  throw new Error("Plugin manifest header is invalid");
}
const ids = new Set();
for (const plugin of manifest.plugins) {
  if (!plugin.id || !plugin.name || !plugin.kind || !plugin.category) throw new Error("Plugin is missing required fields");
  if (ids.has(plugin.id)) throw new Error(`Duplicate plugin id: ${plugin.id}`);
  ids.add(plugin.id);
  if (!Array.isArray(plugin.platforms) || plugin.platforms.some((p) => !["web", "roku"].includes(p))) {
    throw new Error(`Unsupported platform in plugin ${plugin.id}`);
  }
  if (plugin.enabled && plugin.requires_authorized_stream !== true) {
    throw new Error(`Enabled plugin ${plugin.id} must explicitly require an authorized source`);
  }
  if (plugin.enabled && !["direct_hls_dash", "api_or_direct_hls_dash"].includes(plugin.kind)) {
    throw new Error(`Plugin ${plugin.id} needs a provider-specific API adapter before activation`);
  }
}
console.log(`Validated ${manifest.plugins.length} plugin definitions (${[...ids].join(", ")})`);
