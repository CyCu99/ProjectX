from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
from urllib.parse import parse_qs, urlparse

class CustomHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        
        # If this is a save-data request
        if parsed_path.path == '/save-data':
            try:
                # Get the data from query parameters
                query_components = parse_qs(parsed_path.query)
                data_str = query_components['data'][0]
                
                # Parse the JSON data
                data = json.loads(data_str)
                
                # Save to file
                with open('data.json', 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode())
                return
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
                return
        
        # For all other requests, use the default handler
        return SimpleHTTPRequestHandler.do_GET(self)

# Start the server
server_address = ('', 8000)  # '' means localhost, 8000 is the port number
httpd = HTTPServer(server_address, CustomHandler)
print('Server running on port 8000...')
httpd.serve_forever()