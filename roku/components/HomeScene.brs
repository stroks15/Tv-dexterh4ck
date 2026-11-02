sub init()
 m.status = m.top.findNode("status")
 m.pluginList = m.top.findNode("plugins")
 m.list = m.top.findNode("catalog")
 m.player = m.top.findNode("player")
 m.playing = m.top.findNode("playing")
 m.pluginList.observeField("itemSelected", "onPluginSelected")
 m.list.observeField("itemSelected", "onSelected")
 m.top.setFocus(true)
 loadPlugins()
 loadCatalog("inicio", invalid, invalid)
end sub

sub loadPlugins()
 request = CreateObject("roUrlTransfer")
 request.SetUrl("https://tv-dexterh4ck.vercel.app/plugins.json")
 request.SetCertificatesFile("common:/certs/ca-bundle.crt")
 request.InitClientCertificates()
 response = request.GetToString()
 if response = invalid or response = "" then
  m.status.text = "No se pudo cargar el registro de plugins."
  return
 end if
 data = ParseJson(response)
 if data = invalid or data.plugins = invalid then
  m.status.text = "Registro de plugins no compatible."
  return
 end if
 m.pluginData = data.plugins
 content = CreateObject("roSGNode", "ContentNode")
 for each plugin in m.pluginData
  entry = content.CreateChild("ContentNode")
  entry.title = plugin.name
  if plugin.enabled then
   entry.description = "ACTIVO"
  else
   entry.description = "POR CONFIGURAR"
  end if
 end for
 m.pluginList.content = content
end sub

sub loadCatalog(category as String, pluginId = invalid, pluginName = invalid)
 request = CreateObject("roUrlTransfer")
 request.SetCertificatesFile("common:/certs/ca-bundle.crt")
 request.InitClientCertificates()
 url = "https://tv-dexterh4ck.vercel.app/api/catalog"
 if category <> invalid and category <> "" and category <> "inicio" then url = url + "?category=" + category
 request.SetUrl(url)
 response = request.GetToString()
 if response = invalid or response = "" then
  m.status.text = "No se pudo conectar con el catálogo."
  return
 end if
 data = ParseJson(response)
 if data = invalid or data.items = invalid then
  m.status.text = "Catálogo no disponible."
  return
 end if
 content = CreateObject("roSGNode", "ContentNode")
 count = 0
 for each item in data.items
  source = ""
  if item.source_name <> invalid then source = LCase(item.source_name)
  if item.metadata <> invalid and item.metadata.plugin_source <> invalid and item.metadata.plugin_source <> "" then source = LCase(item.metadata.plugin_source)
  if pluginId <> invalid
   if source <> LCase(pluginId) and source <> LCase(pluginName) then continue for
  end if
  entry = content.CreateChild("ContentNode")
  entry.title = item.title
  entry.description = item.synopsis
  entry.url = item.stream_url
  if (entry.url = invalid or entry.url = "") and item.metadata <> invalid and item.metadata.extras <> invalid then entry.url = item.metadata.extras.stream_url
  entry.streamFormat = item.stream_type
  if item.metadata <> invalid and item.metadata.extras <> invalid and item.metadata.extras.stream_format <> invalid and item.metadata.extras.stream_format <> "" then entry.streamFormat = item.metadata.extras.stream_format
  if entry.streamFormat = invalid or entry.streamFormat = "" then entry.streamFormat = "hls"
  if item.is_live then entry.title = "EN VIVO  ·  " + item.title
  count = count + 1
 end for
 m.list.content = content
 if pluginId <> invalid then
  m.status.text = count.ToStr() + " títulos del plugin " + pluginName
 else
  m.status.text = count.ToStr() + " títulos · Selecciona para reproducir"
 end if
 m.list.setFocus(true)
end sub

sub onPluginSelected()
 index = m.pluginList.itemSelected
 if index = invalid or m.pluginData = invalid or index >= m.pluginData.Count() then return
 plugin = m.pluginData[index]
 if not plugin.enabled then
  m.status.text = plugin.name + ": por configurar. Añade un stream/feed autorizado y activa el plugin."
  return
 end if
 loadCatalog(plugin.category, plugin.id, plugin.name)
end sub

sub onSelected()
 index = m.list.itemSelected
 if index = invalid then return
 item = m.list.content.GetChild(index)
 if item = invalid then return
 if item.url = invalid or item.url = "" then
  m.playing.text = "Fuente pendiente: " + item.title
  return
 end if
 videoContent = CreateObject("roSGNode", "ContentNode")
 videoContent.url = item.url
 format = item.streamFormat
 if format = invalid or format = "" then format = "hls"
 videoContent.streamFormat = format
 videoContent.title = item.title
 m.player.content = videoContent
 m.player.visible = true
 m.player.width = 1280
 m.player.height = 720
 m.player.control = "play"
 m.playing.text = "Reproduciendo: " + item.title + " · BACK para volver"
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
 if not press then return false
 if key = "back" and m.player.visible then
  m.player.control = "stop"
  m.player.visible = false
  m.player.width = 1
  m.player.height = 1
  m.list.setFocus(true)
  return true
 end if
 if key = "back" and m.pluginList.isInFocusChain() then
  m.pluginList.itemSelected = -1
  loadCatalog("inicio", invalid, invalid)
  return true
 end if
 return false
end function
