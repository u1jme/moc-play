const express = require('express');
const path = require('path');
const { exec } = require('node:child_process');

const app = express();
const port = process.env.PORT || 8080;

// get an instance of router
const router = express.Router();

const init_music_dir = process.env.MOC_INIT_DIR || '/home/jmemoc/Music/all';
var current_music_dir = init_music_dir;

function build_find_cmd(dir, is_directory) {
  var cmd, type;
  type = (is_directory) ? '-type d' : '-type f';
  cmd = 'find ' + dir + ' -maxdepth 1 ' + type + ' -printf \'%f\n\'';
  return cmd;
}

function find_entries(stdout) {
    var stdout_find_array = stdout.split(/\r?\n|\r|\n/g);
    return JSON.stringify(stdout_find_array);
}

// main index page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

router.get('/mocplay', function(req, res) {
  exec('mocp --unpause', (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
  });
  res.send('play');
});

router.get('/mocstop', function(req, res) {
  exec('mocp --pause', (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
  });
  res.send('stop');
});

router.get('/moclist', function(req, res) {
  var find_cmd = build_find_cmd(current_music_dir, true);
  var files = [];
  exec(find_cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    res.send(find_entries(stdout));
  });
});

router.get('/mocdirs', function(req, res) {
  var find_cmd = build_find_cmd(current_music_dir, true);
  exec(find_cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    res.send(find_entries(stdout));
  });
});

router.post('/mocfolder', function(req, res) {
   console.log(req.body);
});

// apply the routes to our application
app.use('/', router);
// add for public artifacts, e.g. stylesheets
app.use(express.static(__dirname + '/public'));

app.listen(port);
console.log('Server started at http://mocdal:' + port);
