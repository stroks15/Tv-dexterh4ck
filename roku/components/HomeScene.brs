sub init()
 m.apiBase = "https://tv-dexterh4ck-git-feat-import-kino-ki-aa9c65-stroks15s-projects.vercel.app"
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
 request.SetUrl(m.apiBase + "/plugins.json")
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
  if plugin.id = "mi-xtream" then
   entry.description = "CONECTOR PERSONAL · XTREAM"
  else if plugin.enabled then
   entry.description = "ACTIVO"
  else
   entry.description = "PENDIENTE DE ADAPTADOR AUTORIZADO"
  end if
 end for
 entry = content.CreateChild("ContentNode")
 entry.title = "Lista M3U personal"
 entry.description = "CONECTAR UNA LISTA PROPIA O AUTORIZADA"
 m.pluginList.content = content
end sub

sub loadCatalog(category as String, pluginId = invalid, pluginName = invalid)
 request = CreateObject("roUrlTransfer")
 request.SetCertificatesFile("common:/certs/ca-bundle.crt")
 request.InitClientCertificates()
 url = m.apiBase + "/api/catalog"
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
 filtered = []
 count = 0
 for each item in data.items
  source = ""
  if item.source_name <> invalid then source = LCase(item.source_name)
  if item.metadata <> invalid and item.metadata.plugin_source <> invalid and item.metadata.plugin_source <> "" then source = LCase(item.metadata.plugin_source)
  if pluginId <> invalid
   if source <> LCase(pluginId) and source <> LCase(pluginName) then continue for
  end if
  filtered.Push(item)
  entry = content.CreateChild("ContentNode")
  entry.title = item.title
  entry.description = item.synopsis
  entry.url = item.stream_url
  if (entry.url = invalid or entry.url = "") and item.metadata <> invalid and item.metadata.extras <> invalid then entry.url = item.metadata.extras.stream_url
  entry.streamFormat = item.stream_type
  if item.metadata <> invalid and item.metadata.extras <> invalid and item.metadata.extras.stream_format <> invalid and item.metadata.extras.stream_format <> "" then entry.streamFormat = item.metadata.extras.stream_format
  if entry.streamFormat = invalid or entry.streamFormat = "" then entry.streamFormat = "hls"
  if item.is_live then entry.title = "EN VIVO  ·  " + item.title
  if item.is_series then entry.title = "SERIE  ·  " + item.title
  count = count + 1
 end for
 m.itemData = filtered
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
 if index = invalid then return
 if index = m.pluginData.Count() then
  startM3uSetup()
  return
 end if
 if index > m.pluginData.Count() then return
 plugin = m.pluginData[index]
 if plugin.id = "mi-xtream" then
  startXtreamSetup()
  return
 end if
 if not plugin.enabled then
  m.status.text = plugin.name + ": pendiente de adaptador autorizado y probado."
  return
 end if
 loadCatalog(plugin.category, plugin.id, plugin.name)
end sub

sub startXtreamSetup()
 m.sourceType = "xtream"
 m.xtreamServer = ""
 m.xtreamUser = ""
 m.xtreamPassword = ""
 m.sourceFlow = "xtream_server"
 showSourceKeyboard("Servidor Xtream", "Escribe la URL base de tu proveedor, por ejemplo https://servidor:8080", "generic")
end sub

sub startM3uSetup()
 m.sourceType = "m3u"
 m.sourceFlow = "m3u_url"
 showSourceKeyboard("Lista M3U", "Pega la URL de tu lista M3U propia o autorizada", "generic")
end sub

sub showSourceKeyboard(title as String, message as String, domain as String)
 dialog = CreateObject("roSGNode", "StandardKeyboardDialog")
 dialog.title = title
 dialog.message = [message]
 dialog.buttons = ["Continuar", "Cancelar"]
 dialog.keyboardDomain = domain
 if domain = "password" and dialog.textEditBox <> invalid then dialog.textEditBox.secureMode = true
 dialog.observeField("buttonSelected", "onSourceKeyboardSelected")
 m.sourceDialog = dialog
 m.top.dialog = dialog
end sub

sub onSourceKeyboardSelected()
 if m.sourceDialog = invalid then return
 if m.sourceDialog.buttonSelected <> 0 then
  m.top.dialog = invalid
  m.sourceDialog = invalid
  m.status.text = "Conexión cancelada."
  return
 end if
 value = m.sourceDialog.text
 m.top.dialog = invalid
 m.sourceDialog = invalid
 if value = invalid or value = "" then
  m.status.text = "El campo no puede quedar vacío."
  return
 end if
 if m.sourceFlow = "xtream_server" then
  m.xtreamServer = value
  m.sourceFlow = "xtream_user"
  showSourceKeyboard("Usuario Xtream", "Escribe el usuario de tu proveedor", "generic")
 else if m.sourceFlow = "xtream_user" then
  m.xtreamUser = value
  m.sourceFlow = "xtream_password"
  showSourceKeyboard("Contraseña Xtream", "Escribe la contraseña de tu proveedor", "password")
 else if m.sourceFlow = "xtream_password" then
  m.xtreamPassword = value
  m.sourceFlow = ""
  connectXtream()
 else if m.sourceFlow = "m3u_url" then
  m.sourceFlow = ""
  connectM3u(value)
 end if
end sub

sub connectXtream()
 m.status.text = "Conectando con tu servidor Xtream..."
 payload = {kind:"xtream", server:m.xtreamServer, username:m.xtreamUser, password:m.xtreamPassword}
 data = postSource(payload)
 if data = invalid then return
 if data.error <> invalid then
  m.status.text = data.error
  return
 end if
 m.returnSeriesItems = invalid
 loadSourceItems(data.items, "Mi Xtream")
end sub

sub connectM3u(url as String)
 m.status.text = "Cargando lista M3U..."
 payload = {kind:"m3u", playlistUrl:url}
 data = postSource(payload)
 if data = invalid then return
 if data.error <> invalid then
  m.status.text = data.error
  return
 end if
 m.returnSeriesItems = invalid
 loadSourceItems(data.items, "Lista M3U personal")
end sub

sub loadSeriesEpisodes(item as Object)
 if m.sourceType <> "xtream" then
  m.status.text = "Los episodios requieren una conexión Xtream."
  return
 end if
 seriesId = item.metadata.extras.series_id
 if seriesId = invalid then return
 m.returnSeriesItems = m.itemData
 m.status.text = "Cargando episodios de " + item.title + "..."
 payload = {kind:"series_episodes", server:m.xtreamServer, username:m.xtreamUser, password:m.xtreamPassword, seriesId:seriesId}
 data = postSource(payload)
 if data = invalid then return
 if data.error <> invalid then
  m.status.text = data.error
  return
 end if
 loadSourceItems(data.items, item.title)
end sub

function postSource(payload as Object) as Object
 request = CreateObject("roUrlTransfer")
 request.SetUrl(m.apiBase + "/api/sources")
 request.SetCertificatesFile("common:/certs/ca-bundle.crt")
 request.InitClientCertificates()
 request.AddHeader("Content-Type", "application/json")
 response = request.PostFromString(FormatJson(payload))
 if response = invalid or response = "" then
  m.status.text = "No se pudo conectar con la fuente. Revisa la URL y la conexión."
  return invalid
 end if
 data = ParseJson(response)
 if data = invalid then
  m.status.text = "El proveedor devolvió una respuesta no válida."
  return invalid
 end if
 return data
end function

sub loadSourceItems(items as Object, title as String)
 if items = invalid then
  m.status.text = "La fuente no devolvió contenido."
  return
 end if
 content = CreateObject("roSGNode", "ContentNode")
 count = 0
 for each item in items
  entry = content.CreateChild("ContentNode")
  entry.title = item.title
  entry.description = item.category_id
  entry.url = item.stream_url
  entry.streamFormat = item.stream_type
  if entry.streamFormat = invalid or entry.streamFormat = "" or entry.streamFormat = "mpegts" then entry.streamFormat = "hls"
  if item.is_live then entry.title = "EN VIVO  ·  " + item.title
  if item.is_series then entry.title = "SERIE  ·  " + item.title + "  ·  OK PARA EPISODIOS"
  count = count + 1
 end for
 m.itemData = items
 m.list.content = content
 m.status.text = title + " · " + count.ToStr() + " elementos"
 m.list.setFocus(true)
end sub

sub onSelected()
 index = m.list.itemSelected
 if index = invalid or m.itemData = invalid or index >= m.itemData.Count() then return
 item = m.itemData[index]
 if item = invalid then return
 if item.is_series = true then
  loadSeriesEpisodes(item)
  return
 end if
 if item.stream_url = invalid or item.stream_url = "" then
  m.playing.text = "Fuente pendiente: " + item.title
  return
 end if
 videoContent = CreateObject("roSGNode", "ContentNode")
 videoContent.url = item.stream_url
 format = item.stream_type
 if format = invalid or format = "" or format = "mpegts" then format = "hls"
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
 if key = "back" and m.returnSeriesItems <> invalid then
  previous = m.returnSeriesItems
  m.returnSeriesItems = invalid
  loadSourceItems(previous, "Mi Xtream · Series")
  return true
 end if
 if key = "back" and m.pluginList.isInFocusChain() then
  m.pluginList.itemSelected = -1
  loadCatalog("inicio", invalid, invalid)
  return true
 end if
 return false
end function
