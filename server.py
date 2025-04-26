from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/save-data':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)

                # Zapisz dane do pliku data.json
                with open('data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/get-data':
            try:
                # Odczytaj dane z pliku data.json
                with open('data.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())
            except FileNotFoundError:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Plik data.json nie istnieje'}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            return SimpleHTTPRequestHandler.do_GET(self)

# Uruchomienie serwera
server_address = ('', 8000)
httpd = HTTPServer(server_address, CustomHandler)
print('Server running on port 8000...')
httpd.serve_forever()