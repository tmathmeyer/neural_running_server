var express =   require("express");
var multer  =   require('multer');
var uuid = require('uuid');
var fs = require("fs");
var spawn = require('child_process').spawn;

var app         =   express();

neuralRunner = spawn('java', ['-jar', 'neuralrunner.jar', '/home/ted']);

neuralRunner.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

neuralRunner.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

app.get('/create',function(req,res){
    res.sendFile(__dirname + "/index.html");
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
                {name: 'source', maxCount: 1},
                {name: 'style', maxCount: 1}
        ])(req, res, function(err) {
            if (err) {
                console.log(err);
                return res.end("ERROR WITH FILES");
            }
            res.end("files uploadded, redirecting to: " + u);
            fs.mkdir("./processing/"+u+"/results/", function() {
                neuralRunner.stdin.write("tree ./git/neural_style_server/processing/\n");
            });
        });
    });
});

app.listen(3000,function(){
    console.log("Working on port 3000");
});
