"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import type { MediaPlayerClass } from "dashjs";
import { Search, Play, Heart, Radio, Film, MonitorPlay, LogIn, LogOut, Tv2, PlugZap, ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { loadPluginManifest, pluginMatchesSource, resolveStreamType, resolveStreamUrl, type PluginDefinition, type PluginItemMetadata, isSafeMediaUrl } from "@/lib/plugin-runtime";

type Item = {
  id: string; category_id: string; title: string; synopsis: string; poster_url: string | null;
  backdrop_url: string | null; stream_url: string | null; stream_type: string; source_name: string | null;
  release_year: number | null; duration_seconds: number | null; is_live: boolean; featured: boolean; metadata?: PluginItemMetadata;
};
type Category = { id: string; name: string; description: string };

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const dashRef = useRef<MediaPlayerClass | null>(null);
  const lastProgressRef = useRef(0);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [category, setCategory] = useState("inicio");
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (category !== "inicio") params.set("category", category);
    if (query.trim()) params.set("q", query.trim());
    const response = await fetch("/api/catalog?" + params.toString());
    const data = await response.json();
    if (response.ok) { setItems(data.items ?? []); setCategories(data.categories ?? []); }
    else setNotice(data.error || "No se pudo cargar el catálogo.");
  }

  useEffect(() => { void load(); }, [category, query]);
  useEffect(() => {
    loadPluginManifest().then((manifest) => setPlugins(manifest.plugins.filter((p) => p.platforms.includes("web"))))
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "No se pudo cargar plugins."));
  }, []);

  useEffect(() => {
    try {
      const client = supabaseBrowser();
      client.auth.getSession().then(({ data }) => {
        const session = data.session;
        if (session) { setUser(session.user.email ?? "Cuenta"); setToken(session.access_token); void refreshMe(session.access_token); }
      });
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user.email ?? null); setToken(session?.access_token ?? "");
        if (session) void refreshMe(session.access_token); else setFavorites([]);
      });
      return () => subscription.unsubscribe();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Configura Supabase."); }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected) return;
    const streamUrl = resolveStreamUrl(selected);
    if (!streamUrl) return;
    if (!isSafeMediaUrl(streamUrl)) { setNotice("La fuente debe ser una URL HTTP(S) válida."); return; }
    const type = resolveStreamType(selected);
    let cancelled = false;
    lastProgressRef.current = 0;
    video.pause(); video.removeAttribute("src"); video.load();
    if (type === "hls") {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30, maxBufferLength: 30 });
        hlsRef.current = hls;
        hls.on(Hls.Events.ERROR, (_event, data) => { if (data.fatal) setNotice("La fuente HLS no pudo reproducirse. Verifica URL, CORS y autorización del proveedor."); });
        hls.loadSource(streamUrl); hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl; void video.play().catch(() => undefined);
      } else setNotice("Este navegador no admite HLS de forma nativa.");
    } else if (type === "dash") {
      void import("dashjs").then(({ MediaPlayer }) => {
        if (cancelled) return;
        const player = MediaPlayer().create();
        dashRef.current = player;
        player.initialize(video, streamUrl, true);
        player.updateSettings({ streaming: { buffer: { fastSwitchEnabled: true } } });
        player.on(MediaPlayer.events.ERROR, () => setNotice("La fuente DASH no pudo reproducirse. Verifica manifiesto, CORS, códec y DRM."));
      }).catch(() => setNotice("No se pudo inicializar el reproductor DASH."));
    } else {
      video.src = streamUrl; void video.play().catch(() => undefined);
    }
    return () => {
      cancelled = true;
      hlsRef.current?.destroy(); hlsRef.current = null;
      dashRef.current?.reset(); dashRef.current = null;
      video.pause(); video.removeAttribute("src"); video.load();
    };
  }, [selected]);

  async function refreshMe(accessToken: string) {
    const response = await fetch("/api/me", { headers: { Authorization: "Bearer " + accessToken } });
    if (response.ok) { const data = await response.json(); setFavorites(data.favorites.map((item: { item_id: string }) => item.item_id)); }
  }
  async function login() {
    setBusy(true); setNotice("");
    try {
      const { error } = await supabaseBrowser().auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
      if (error) throw error;
      setNotice("Te enviamos un enlace de acceso a tu correo.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No fue posible iniciar sesión."); }
    finally { setBusy(false); }
  }
  async function favorite(item: Item) {
    if (!token) { setNotice("Inicia sesión para guardar favoritos."); return; }
    const on = !favorites.includes(item.id);
    const response = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ itemId: item.id, favorite: on }) });
    if (response.ok) setFavorites((current) => on ? [...current, item.id] : current.filter((id) => id !== item.id));
    else setNotice("No se pudo actualizar el favorito.");
  }
  async function saveProgress(video: HTMLVideoElement, force = false) {
    if (!token || !selected) return;
    const position = Math.floor(video.currentTime);
    if (!force && position - lastProgressRef.current < 15) return;
    lastProgressRef.current = position;
    await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ itemId: selected.id, positionSeconds: position, durationSeconds: Number.isFinite(video.duration) ? Math.floor(video.duration) : null }) });
  }
  async function signOut() { await supabaseBrowser().auth.signOut(); setUser(null); setToken(""); }
  function choosePlugin(plugin: PluginDefinition) {
    setSelectedPlugin(plugin.id); setCategory(plugin.category);
    if (!plugin.enabled) setNotice(`${plugin.name}: ${plugin.description} El adaptador está preparado, pero falta configurar una fuente autorizada.`);
  }

  const activePlugin = plugins.find((plugin) => plugin.id === selectedPlugin) ?? null;
  const visibleItems = useMemo(() => selectedPlugin ? items.filter((item) => pluginMatchesSource(plugins.find((p) => p.id === selectedPlugin)!, item.source_name, item.metadata)) : items, [items, plugins, selectedPlugin]);
  const featured = useMemo(() => visibleItems.find((item) => item.featured) || visibleItems[0], [visibleItems]);

  return <main className="shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brandIcon"><Tv2 /></span><span>TV <b>DEXTERH4CK</b></span></a>
      <nav>
        <button className={category === "inicio" ? "nav active" : "nav"} onClick={() => { setSelectedPlugin(null); setCategory("inicio"); }}>Inicio</button>
        <button className={category === "en-vivo" ? "nav active" : "nav"} onClick={() => { setSelectedPlugin(null); setCategory("en-vivo"); }}>En vivo</button>
        <button className={category === "peliculas" ? "nav active" : "nav"} onClick={() => { setSelectedPlugin(null); setCategory("peliculas"); }}>Películas</button>
        <button className={category === "series" ? "nav active" : "nav"} onClick={() => { setSelectedPlugin(null); setCategory("series"); }}>Series</button>
      </nav>
      <div className="actions"><label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar contenido" /></label>
        {user ? <button className="account" onClick={signOut}><LogOut size={16} /><span>{user.split("@")[0]}</span></button> : <div className="login"><input aria-label="Correo" placeholder="Tu correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /><button onClick={login} disabled={busy || !email.includes("@") }><LogIn size={16} /></button></div>}
      </div>
    </header>
    {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    {category === "inicio" && featured && <section className="hero" style={featured.backdrop_url ? { backgroundImage: `linear-gradient(90deg,#080b14 8%,rgba(8,11,20,.72) 52%,rgba(8,11,20,.15)),url(${featured.backdrop_url})` } : {}}>
      <div className="heroCopy"><span className="eyebrow"><span className="dot" /> TU ENTRETENIMIENTO EN UN SOLO LUGAR</span><h1>{featured.title}</h1><p>{featured.synopsis || "Explora el catálogo y disfruta tu contenido favorito."}</p><div className="heroButtons"><button className="primary" onClick={() => setSelected(featured)}><Play size={17} fill="currentColor" /> Ver ahora</button><button className="secondary" onClick={() => favorite(featured)}><Heart size={17} fill={favorites.includes(featured.id) ? "currentColor" : "none"} /> Mi lista</button></div></div>
      <div className="heroMark"><span>DEXTER</span><strong>H4CK</strong></div>
    </section>}
    <section className="content">
      <div className="sectionHead"><div><span className="eyebrow">DESCUBRE</span><h2>{activePlugin?.name ?? (category === "inicio" ? "Explora el catálogo" : categories.find((item) => item.id === category)?.name || "Contenido")}</h2></div><span className="count">{visibleItems.length} títulos</span></div>
      <div className="chips"><button className={category === "inicio" ? "chip chosen" : "chip"} onClick={() => { setSelectedPlugin(null); setCategory("inicio"); }}>Todo</button>{categories.map((item) => <button key={item.id} className={category === item.id && !selectedPlugin ? "chip chosen" : "chip"} onClick={() => { setSelectedPlugin(null); setCategory(item.id); }}>{item.name}</button>)}</div>
      <section className="pluginShelf"><div className="pluginHeading"><PlugZap size={18} /><div><h3>Plugins y proveedores</h3><p>Un mismo catálogo de conectores para web y Roku</p></div></div><div className="pluginGrid">{plugins.map((plugin) => <button key={plugin.id} className={selectedPlugin === plugin.id ? "pluginCard pluginSelected" : "pluginCard"} onClick={() => choosePlugin(plugin)}><span className="pluginCardTop"><PlugZap size={17} /><small>{plugin.enabled ? "ACTIVO" : "POR CONFIGURAR"}</small></span><strong>{plugin.name}</strong><span className="pluginDescription">{plugin.description}</span><span className="pluginStatus">{plugin.enabled ? <><ShieldCheck size={13} /> Fuente habilitada</> : "Requiere endpoint / feed autorizado"}</span></button>)}</div></section>
      {visibleItems.length === 0 ? <div className="empty"><MonitorPlay size={38} /><h3>{selectedPlugin ? "Plugin preparado; falta su fuente" : "Tu catálogo está listo para conectarse"}</h3><p>{selectedPlugin ? "Cuando configures el proveedor con una URL HLS, DASH o MP4 autorizada y publiques títulos con ese source_name, aparecerán aquí." : "Cuando agregues canales o títulos autorizados en Supabase, aparecerán aquí automáticamente."}</p></div> : <div className="grid">{visibleItems.map((item) => <article className="tile" key={item.id}><button className="poster" onClick={() => setSelected(item)} style={item.poster_url ? { backgroundImage: `url(${item.poster_url})` } : {}}><span className="posterFallback">{item.is_live ? <Radio /> : <Film />}<small>{item.is_live ? "EN VIVO" : item.category_id.toUpperCase()}</small></span><span className="playOverlay"><Play fill="currentColor" /></span></button><div className="tileInfo"><div><h3>{item.title}</h3><p>{item.release_year || item.source_name || "DexterH4ck"}</p></div><button aria-label="Favorito" className="heart" onClick={() => favorite(item)}><Heart size={18} fill={favorites.includes(item.id) ? "currentColor" : "none"} /></button></div></article>)}</div>}
    </section>
    <footer><span>TV DEXTERH4CK</span><span>Catálogo personal · Adaptadores web + Roku · Fuentes autorizadas</span></footer>
    {selected && <div className="modal" onClick={() => setSelected(null)}><section className="player" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><div className="playerScreen">{resolveStreamUrl(selected) ? <video ref={videoRef} controls autoPlay playsInline onTimeUpdate={(event) => { void saveProgress(event.currentTarget); }} onEnded={(event) => { void saveProgress(event.currentTarget, true); }} /> : <div className="empty"><MonitorPlay size={44} /><h3>Fuente pendiente de configurar</h3><p>Este título aparecerá aquí cuando tenga una URL de reproducción autorizada.</p></div>}</div><div className="playerMeta"><h2>{selected.title}</h2><p>{selected.synopsis}</p><button className="secondary" onClick={() => favorite(selected)}><Heart size={16} /> Guardar en mi lista</button></div></section></div>}
  </main>;
}
