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
  if (!Array.isArray(plugin.excluded_capabilities) || !plugin.excluded_capabilities.includes("offline_video_downloads") || !plugin.excluded_capabilities.includes("diagnostic_telemetry")) {
    throw new Error(`Plugin ${plugin.id} must exclude downloads and diagnostic telemetry`);
  }
  if (plugin.network_policy !== "declared_hosts_only") {
    throw new Error(`Plugin ${plugin.id} must use declared-host network policy`);
  }
  for (const host of plugin.declared_network_domains ?? []) {
    if (!/^(?:\\*\\.)?(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(host)) {
      throw new Error(`Invalid declared network host in ${plugin.id}: ${host}`);
    }
  }
}
console.log(`Validated ${manifest.plugins.length} plugin definitions (${[...ids].join(", ")})`);
