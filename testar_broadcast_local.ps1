# Replica o teste do ReqBin: POST em /.netlify/functions/push com type broadcast.
# Uso:
#   .\testar_broadcast_local.ps1
#   .\testar_broadcast_local.ps1 -Title "Teste" -Body "Mensagem aqui"

param(
    [string]$Url = "https://ssrx-radar.netlify.app/.netlify/functions/push",
    [string]$Title = "Saint Seiya EX",
    [string]$Body = "Novo banner disponivel!"
)

$ErrorActionPreference = "Stop"

$obj = [ordered]@{
    type    = "broadcast"
    payload = [ordered]@{
        title = $Title
        body  = $Body
    }
}

$json = $obj | ConvertTo-Json -Compress -Depth 5
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

try {
    $response = Invoke-WebRequest -Uri $Url -Method Post -Body $bytes -ContentType "application/json; charset=utf-8" -UseBasicParsing
    Write-Host "Status:" $response.StatusCode
    Write-Host "Resposta:" $response.Content
}
catch {
    Write-Host "Erro:" $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
    exit 1
}
