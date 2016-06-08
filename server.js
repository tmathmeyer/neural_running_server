var express =   require("express");
var multer  =   require('multer');
var uuid = require('uuid');
var fs = require("fs");
var spawn = require('child_process').spawn;
var path = require('path');

var app         =   express();

neuralRunner = spawn('java', ['-jar', 'neuralrunner.jar', '/home/ted/git/neural-style/']);

neuralRunner.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

neuralRunner.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

app.get('/create',function(req,res){
    res.sendFile(__dirname + "/upload.html");
});

app.post('/api/photoup',function(req,res){
    var u = uuid.v4();
    fs.mkdir("./processing/"+u, function() {
        var storage = multer.diskStorage({
            destination: function (req, file, callback) {
                callback(null, './processing/'+u);
            },
            filename: function (req, file, callback) {
                callback(null, file.fieldname);
            }
        });

        multer({storage:storage}).fields([
                {name: 'source.jpg', maxCount: 1},
                {name: 'style.jpg', maxCount: 1}
        ])(req, res, function(err) {
            if (err) {
                console.log(err);
                return res.end("ERROR WITH FILES");
            }
            fs.mkdir("./processing/"+u+"/results/", function() {
                var x = makecmd(u);
                console.log(x);
                neuralRunner.stdin.write(x+"\n");
                res.redirect("/click/"+u);
            });
        });
    });
});

var getDirectories = function(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

app.get('/img/:uuid/source.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/source.jpg');
});

app.get('/img/:uuid/style.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/style.jpg');
});

app.get('/img/:uuid/output.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/results/output.jpg');
});

app.get('/img/:uuid/output_100.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/results/output_100.jpg');
});

app.get('/img/:uuid/output_200.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/results/output_100.jpg');
});

app.get('/img/:uuid/output_300.jpg', function(req, res) {
    res.sendFile(__dirname + '/processing/' + req.params.uuid + '/results/output_100.jpg');
});

app.get('/', function(req, res) {
    var dirs = getDirectories("./processing");
    res.write("<html><body><h1><a href='/create'>Create an image mix</a></h1><table>");
    dirs.forEach(function(each) {
        res.write("<tr>");
        res.write("<td><img style='max-width:300px' src='"+"img/"+each+"/source.jpg"+"'></td>");
        res.write("<td><img style='max-width:300px' src='"+"img/"+each+"/style.jpg"+"'></td>");
        res.write("<td><img style='max-width:300px' src='"+"img/"+each+"/output.jpg"+"'></td>");
        res.write("</tr>");
    });
    res.end("</table></body></html>");
});

app.get('/click/:uuid', function(req, res) {
    res.end("<h1><a href='/task/"+req.params.uuid+"'>CLICK HERE TO SEE PIX</a></h1>");
});

app.get('/task/:uuid', function(req, res) {
    res.write("<html><body><h1>Refresh this page to see results, it takes a bit. 4 images will eventually appear</h1><a href='/'>home</a><table>");
    fs.readdirSync('./processing/'+req.params.uuid+'/results').filter(function(fule) {
        return !fs.statSync('./processing/'+req.params.uuid+'/results/'+fule).isDirectory();
    }).forEach(function(each) {
        res.write("<tr>");
        res.write("<td><img style='max-width:300px' src='"+"/img/"+req.params.uuid+"/"+each+"'></td>");
        res.write("</tr>");
    });
    res.end("</table></body></html>");
});


var makecmd = function(uuid) {
    var prefix = "/home/ted/git/neural_running_server/processing/"+uuid+"/";
    var content = prefix+"source.jpg";
    var style = prefix+"style.jpg";
    var output = prefix+"results/output.jpg";
    var string = "./run.sh th neural_style.lua -content_image " + content + " -style_image " + style + " -output_image " + output + " ";
    var args = "-backend clnn -image_size 256 -num_iterations 400";
    return string + args;
}

app.listen(3000,function(){
    console.log("Working on port 3000");
});
