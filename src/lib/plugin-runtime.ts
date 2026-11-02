export type PluginDefinition = {
  id: string;
  name: string;
  kind: string;
  category: string;
  enabled: boolean;
  platforms: Array<"web" | "roku">;
  requires_authorized_stream: boolean;
  description: string;
};

export type PluginManifest = {
  schema_version: number;
  runtime: string;
  plugins: PluginDefinition[];
};

export type PluginItemMetadata = {
  plugin_source?: string;
  target_content?: string;
  playback_mode?: string;
  extras?: Record<string, unknown>;
};

export function resolveStreamUrl(item: { stream_url?: string | null; metadata?: PluginItemMetadata }) {
  const extraUrl = item.metadata?.extras?.stream_url;
  return item.stream_url || (typeof extraUrl === "string" ? extraUrl : null);
}

export function resolveStreamType(item: { stream_type?: string | null; metadata?: PluginItemMetadata }) {
  const extraType = item.metadata?.extras?.stream_format;
  const value = (typeof extraType === "string" ? extraType : item.stream_type) || "hls";
  return value.toLowerCase();
}

export async function loadPluginManifest(): Promise<PluginManifest> {
  const response = await fetch("/plugins.json", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar el registro de plugins.");
  const value = (await response.json()) as PluginManifest;
  if (value.schema_version !== 1 || !Array.isArray(value.plugins)) {
    throw new Error("El registro de plugins tiene una versión no compatible.");
  }
  return value;
}

export function pluginMatchesSource(plugin: PluginDefinition, sourceName?: string | null, metadata?: PluginItemMetadata) {
  const pluginSource = metadata?.plugin_source?.trim();
  const source = (pluginSource || sourceName || "").trim().toLocaleLowerCase();
  return source === plugin.id.toLocaleLowerCase() || source === plugin.name.toLocaleLowerCase();
}

export function isSafeMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
