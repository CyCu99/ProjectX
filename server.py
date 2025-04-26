from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        # Obsługa zapisu danych na endpoint /save-data
        if self.path == '/save-data':
            try:
                # Odczytaj długość danych z nagłówka
                content_length = int(self.headers['Content-Length'])
                
                # Odczytaj dane z treści żądania
                post_data = self.rfile.read(content_length)
                
                # Parsuj dane JSON
                data = json.loads(post_data)
                
                # Zapisz dane do pliku data.json
                with open('data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                
                # Wyślij odpowiedź sukcesu
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
            except Exception as e:
                # Wyślij odpowiedź błędu
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            # Obsługa innych żądań POST (jeśli istnieją)
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        # Obsługa żądań GET (np. serwowanie plików statycznych)
        return SimpleHTTPRequestHandler.do_GET(self)

# Uruchomienie serwera
server_address = ('', 8000)  # '' oznacza localhost, 8000 to numer portu
httpd = HTTPServer(server_address, CustomHandler)
print('Server running on port 8000...')
httpd.serve_forever()