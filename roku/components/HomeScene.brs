sub init()
 m.status=m.top.findNode("status")
 m.list=m.top.findNode("catalog")
 m.player=m.top.findNode("player")
 m.playing=m.top.findNode("playing")
 m.list.observeField("itemSelected","onSelected")
 m.top.setFocus(true)
 loadCatalog()
end sub

sub loadCatalog()
 apiBase="https://tv-dexterh4ck.vercel.app"
 request=CreateObject("roUrlTransfer")
 request.SetUrl(apiBase+"/api/catalog")
 request.SetCertificatesFile("common:/certs/ca-bundle.crt")
 request.InitClientCertificates()
 response=request.GetToString()
 if response=invalid or response="" then
  m.status.text="No se pudo conectar. Revisa internet o el despliegue web."
  return
 end if
 data=ParseJson(response)
 if data=invalid or data.items=invalid then
  m.status.text="Catálogo no disponible."
  return
 end if
 content=CreateObject("roSGNode","ContentNode")
 for each item in data.items
  entry=content.CreateChild("ContentNode")
  entry.title=item.title
  entry.url=item.stream_url
  entry.streamFormat=item.stream_type
  entry.description=item.synopsis
  if item.is_live then entry.title="EN VIVO  ·  "+item.title
 end for
 m.list.content=content
 m.status.text=Str(data.items.Count())+" títulos · Selecciona para reproducir"
 m.list.setFocus(true)
end sub

sub onSelected()
 index=m.list.itemSelected
 if index=invalid then return
 item=m.list.content.GetChild(index)
 if item=invalid or item.url=invalid or item.url="" then
  m.playing.text="Fuente pendiente: "+item.title
  return
 end if
 videoContent=CreateObject("roSGNode","ContentNode")
 videoContent.url=item.url
 format=item.streamFormat
 if format=invalid or format="" then format="hls"
 videoContent.streamFormat=format
 m.player.content=videoContent
 m.player.visible=true
 m.player.width=1280
 m.player.height=720
 m.player.control="play"
 m.playing.text="Reproduciendo: "+item.title+" · BACK para volver"
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
 if not press then return false
 if key="back" and m.player.visible then
  m.player.control="stop"
  m.player.visible=false
  m.player.width=1
  m.player.height=1
  m.list.setFocus(true)
  return true
 end if
 return false
end function