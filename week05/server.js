const http = require('http')

http.createServer((req,res)=>{
  console.log(req.headers, 'req.headers')
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok')
}).listen('8888')