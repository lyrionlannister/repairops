# Certbot para app.kaltrafix.mx (DNS-01, detrás del tunel de Cloudflare)

app.kaltrafix.mx entra por el tunel cloudflared, no por el puerto 80 del host, así que el challenge HTTP-01 clásico no sirve. Se usa DNS-01 con el plugin de Cloudflare: certbot crea un registro TXT temporal en la zona vía API, sin exponer ningún puerto nuevo.

## Alta inicial (una sola vez)

1. Crear el token en Cloudflare: dash.cloudflare.com → perfil → API Tokens → Create Token → plantilla "Edit zone DNS", scope solo a la zona `kaltrafix.mx`.
2. `cp infra/SSL/cloudflare.ini.example infra/SSL/cloudflare.ini` y pegar el token en `dns_cloudflare_api_token`. Hacerlo antes de cualquier `podman compose up` que incluya `certbot`: el bind mount de un archivo que no existe crea una carpeta vacía con ese nombre en vez de fallar.
3. Emitir el certificado:

   ```bash
   podman compose run --rm --entrypoint "certbot certonly --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini --dns-cloudflare-propagation-seconds 30 -d app.kaltrafix.mx --email TU_EMAIL --agree-tos --non-interactive" certbot
   ```

4. Levantar certbot (ahora sí con el loop de renovación por defecto) y recargar nginx para que monte el volumen `certbot_certs` y tome `infra/nginx/conf.d/prod-tunnel.conf`:

   ```bash
   podman compose up -d certbot
   podman compose up -d --force-recreate nginx
   ```

## Cloudflare: ingress del tunel

En Zero Trust → Networks → Tunnels → repairops → Public Hostname, el hostname `app.kaltrafix.mx` tiene que apuntar a `https://nginx:443` (no `http://nginx:80` como dev.kaltrafix.mx), con "No TLS Verify" apagado — el cert de Let's Encrypt ya es de una CA pública, cloudflared lo valida solo.

## Renovación

El servicio `certbot` del compose corre `certbot renew --quiet` cada 12h con el mismo plugin DNS, sin intervención manual mientras el token no se revoque.
