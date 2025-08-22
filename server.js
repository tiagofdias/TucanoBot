const http = require('http');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('TucanoBot is running!');
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
});

module.exports = server;
