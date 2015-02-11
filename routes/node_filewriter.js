var fs=require("fs");
var http=require("http");
var host = "192.168.43.181";
var port=4431;

/**
 * Create HTTP server to service requests
 */


var server=http.createServer(function(request,response){
    if (request.method === "GET") {
        if (request.url === "/daily.ch") {
            fs.writeFile("syncfile.txt", "Daily");
        }
        else if (request.url === "/monthly.ch") {
            fs.writeFile("syncfile.txt", "Monthly");
        }
        else if (request.url === "/daweeklyily.ch") {
            fs.writeFile("syncfile.txt", "weekly");
        }
        else if (request.url === "/single.ch") {
            fs.writeFile("syncfile.txt", "Single");
        }
        fs.watchFile("connect2mefile.txt", function (current, previous) {
            var content = fs.readFileSync("connect2mefile.txt");
            response.writeHead(200, {'Content-Type': 'json'});

            var strn = {"score": ' +avg+'};
            response.write(' { "score" :' + content.toString() + ' } ');
            console.log(content.toString());
            response.end();
        });
    }
});
server.listen(port,host,function(){
    console.log("Listening" + host + ":" + port);
});