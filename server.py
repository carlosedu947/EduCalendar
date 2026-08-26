#!/usr/bin/env python3
"""
EduCalendar - Servidor Multi-Rede e Acesso Remoto (Desktop, Celular e Qualquer Wi-Fi)
Permite acesso na rede local (Wi-Fi/Ethernet) e disponibiliza integração com túneis públicos.
"""

import http.server
import socketserver
import webbrowser
import socket
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_all_ips():
    """Detecta todos os endereços IPs locais disponíveis no computador."""
    ips = set()
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127."):
                ips.add(ip)
    except Exception:
        pass

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    return list(ips) if ips else ["127.0.0.1"]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Desativa cache e permite CORS para compartilhamento
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()

def run_server():
    port = PORT
    max_retries = 15
    httpd = None

    for _ in range(max_retries):
        try:
            # Bind em 0.0.0.0 permite conexões de qualquer placa de rede ou Wi-Fi
            httpd = socketserver.TCPServer(("0.0.0.0", port), Handler)
            break
        except OSError:
            port += 1

    if not httpd:
        print(f"Erro: Não foi possível vincular o servidor na porta {PORT}.")
        sys.exit(1)

    all_ips = get_all_ips()
    primary_ip = all_ips[0]

    local_url = f"http://localhost:{port}/index.html"
    wifi_url = f"http://{primary_ip}:{port}/index.html"

    print("=" * 70)
    print("🎓 EduCalendar - Servidor Ativo para Todas as Redes Wi-Fi")
    print("=" * 70)
    print(f"💻 1. Acesso Local no PC:        {local_url}")
    print(f"📱 2. Acesso no Celular (Wi-Fi): {wifi_url}")
    if len(all_ips) > 1:
        print("   Outros IPs disponíveis:")
        for ip in all_ips[1:]:
            print(f"   👉 http://{ip}:{port}/index.html")
    print("-" * 70)
    print("🌍 3. QUER ACESSAR DE QUALQUER REDE WI-FI OU 4G/5G DO MUNDO?")
    print(f"   Opção A (Sem instalar nada): Use o botão '🔗 Conectar Celular' no topo do site.")
    print(f"   Opção B (Túnel Cloudflare): Execute em outro terminal:")
    print(f"          npx cloudflared tunnel --url http://localhost:{port}")
    print(f"   Opção C (Túnel LocalTunnel):")
    print(f"          npx localtunnel --port {port}")
    print("=" * 70)
    print("Pressione Ctrl+C para encerrar o servidor.")
    print("-" * 70)

    try:
        webbrowser.open(local_url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado com sucesso. Até logo!")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
