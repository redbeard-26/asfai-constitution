#!/usr/bin/env bash
set -euo pipefail

cd /opt/asfai
docker compose --env-file images.env ps

expected=(education constitution caddy)
for service in "${expected[@]}"; do
  running="$(docker compose --env-file images.env ps --status running --services "$service")"
  if [[ "$running" != "$service" ]]; then
    echo "$service is not running" >&2
    exit 1
  fi
done

docker compose --env-file images.env exec -T education \
  node -e "fetch('http://127.0.0.1:3000/education').then(r=>{if(!r.ok)process.exit(1);return r.text()}).then(()=>console.log('education ok'))"
docker compose --env-file images.env exec -T education \
  node -e "fetch('http://127.0.0.1:3000/education/.well-known/oauth-protected-resource').then(r=>{if(!r.ok)process.exit(1);return r.json()}).then(m=>{if(!m.authorization_servers?.length)process.exit(1);console.log('education oauth metadata ok')})"
docker compose --env-file images.env exec -T education \
  node -e "fetch('http://127.0.0.1:3000/education/api/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'deploy-check',version:'1'}}})}).then(r=>{if(r.status!==401)process.exit(1);console.log('education mcp auth required')})"
docker compose --env-file images.env exec -T constitution \
  node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1);return r.text()}).then(()=>console.log('constitution ok'))"
