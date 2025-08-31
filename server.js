const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('ok');
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
});

// Ensure server listens on 0.0.0.0 for Render
if (require.main === module) {
    const port = process.env.PORT || 3000;
    server.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = server;
