sub init()
  m.status = m.top.findNode("status")
  m.rows = m.top.findNode("rows")
  m.top.setFocus(true)
  loadCatalog()
end sub

sub loadCatalog()
  ' Replace with the deployed Vercel URL after the first deployment.
  apiBase = "https://tv-dexterh4ck.vercel.app"
  request = CreateObject("roUrlTransfer")
  request.SetUrl(apiBase + "/api/catalog")
  request.SetCertificatesFile("common:/certs/ca-bundle.crt")
  request.InitClientCertificates()
  response = request.GetToString()
  if response = invalid or response = "" then
    m.status.text = "No se pudo conectar. Revisa la conexión a internet."
    return
  end if
  data = ParseJson(response)
  if data = invalid or data.items = invalid then
    m.status.text = "Catálogo aún no disponible."
    return
  end if
  lines = []
  for each item in data.items
    label = item.title
    if item.is_live then label = "EN VIVO  |  " + label
    lines.Push(label)
  end for
  m.rows.text = lines.Join(chr(10) + chr(10))
  m.status.text = Str(data.items.Count()) + " títulos disponibles · DexterH4ck"
end sub
