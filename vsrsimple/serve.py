"""Static server for the WebNN SR webapp.

`python -m http.server` is not enough here:
- it serves .mjs as text/plain, which browsers refuse to import as a JS
  module (ORT's WebNN/WebGPU jsep loader needs ort-wasm-simd-threaded.jsep.mjs),
- it does not set COOP/COEP, so SharedArrayBuffer is unavailable and the
  threaded WASM backend degrades.

Usage:
  python serve.py                     # http://127.0.0.1:8123 (loopback)
  python serve.py --host 0.0.0.0      # LAN-accessible http
  python serve.py --https --host 0.0.0.0   # LAN + self-signed HTTPS
                                      # (required for WebNN/WebGPU on
                                      #  non-localhost clients: browsers
                                      #  only grant secure context to
                                      #  localhost over plain http)
"""

import argparse
import datetime
import ipaddress
import os
import socket
import socketserver
import ssl
import http.server

DEFAULT_PORT = 8123


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.mjs': 'application/javascript',
        '.js': 'application/javascript',
        '.wasm': 'application/wasm',
        '.onnx': 'application/octet-stream',
    }

    def end_headers(self):
        # cross-origin isolation -> SharedArrayBuffer -> threaded WASM
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return socket.gethostbyname(socket.gethostname())


def ensure_cert(cert_path, key_path):
    """Generate a self-signed certificate (cached on disk)."""
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    if os.path.exists(cert_path) and os.path.exists(key_path):
        return
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name(
        [x509.NameAttribute(NameOID.COMMON_NAME, 'sr-webapp')])
    san = [x509.DNSName('localhost'),
           x509.IPAddress(ipaddress.ip_address('127.0.0.1'))]
    try:
        san.append(x509.IPAddress(ipaddress.ip_address(lan_ip())))
    except ValueError:
        pass
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now - datetime.timedelta(days=1))
            .not_valid_after(now + datetime.timedelta(days=3650))
            .add_extension(x509.SubjectAlternativeName(san), critical=False)
            .sign(key, hashes.SHA256()))
    with open(cert_path, 'wb') as fp:
        fp.write(cert.public_bytes(serialization.Encoding.PEM))
    with open(key_path, 'wb') as fp:
        fp.write(key.private_bytes(serialization.Encoding.PEM,
                                   serialization.PrivateFormat.TraditionalOpenSSL,
                                   serialization.NoEncryption()))
    print(f'generated self-signed certificate: {cert_path}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--host', default='127.0.0.1',
                    help='bind address; 0.0.0.0 = all interfaces (LAN)')
    ap.add_argument('--port', type=int, default=DEFAULT_PORT)
    ap.add_argument('--https', action='store_true',
                    help='serve HTTPS with a self-signed certificate '
                         '(needed for WebNN/WebGPU from non-localhost '
                         'clients)')
    args = ap.parse_args()

    scheme = 'https' if args.https else 'http'
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)

    try:
        httpd = socketserver.ThreadingTCPServer((args.host, args.port), Handler)
    except OSError as e:
        raise SystemExit(
            f'cannot bind {args.host}:{args.port} ({e}) -- another server '
            '(e.g. an old python -m http.server) is still running on this '
            'port; stop it first') from e
    if args.https:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        cert, key = os.path.join(here, 'cert.pem'), os.path.join(here, 'key.pem')
        ensure_cert(cert, key)
        ctx.load_cert_chain(cert, key)
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    print(f'serving the SR webapp at {scheme}://localhost:{args.port}')
    if args.host in ('0.0.0.0', '::'):
        print(f'LAN clients: {scheme}://{lan_ip()}:{args.port}')
        print('note: allow inbound port '
              f'{args.port} in Windows Defender Firewall')
        if not args.https:
            print('warning: WebNN/WebGPU need a secure context -- remote '
                  'clients over plain http will only get the WASM backend; '
                  'use --https for full EP support')
        else:
            print('clients must accept the self-signed certificate warning')
    httpd.serve_forever()


if __name__ == '__main__':
    main()
