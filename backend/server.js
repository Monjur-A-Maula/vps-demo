const http = require("http");

const PORT = process.env.PORT || 4060;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(
    JSON.stringify({
      status: "ok",
      database: "up",
      message: "VPS Demo is Online!",
      roll: process.env.ROLL || process.env.DB_USER || "s20230204060",
    })
  );
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

