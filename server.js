
const express = require('express');
const path = require('path');
const { spawn } = require('node:child_process');
//const { exec } = require('node:child_process');

const app = express();
const port = process.env.PORT || 8080;

// get an instance of router
const router = express.Router();

const init_music_dir = process.env.MOC_INIT_DIR || '/home/jmemoc/Music/all';
const init_scripts_dir = process.env.MOC_SCRIPTS_DIR || '/home/jmemoc/programming/moc-play/scripts'

var current_music_dir = init_music_dir;
var current_music_dict = {};
var current_music_volume = 60;

var find_stdout = '';
var moc_cmd_stdout = '';
var cmd_stdout = '';

function build_payload(stdout_dirs, stdout_files, status_info) {
  let idx, stdout_dirs_array, stdout_files_array, folder_arr = [], payload = {};

  current_music_dict = {};

  stdout_dirs_array = stdout_dirs.split(/\r?\n|\r|\n/g);
  append_music_dict(stdout_dirs_array, 1);
  stdout_files_array = stdout_files.split(/\r?\n|\r|\n/g);
  append_music_dict(stdout_files_array, 0);

  for (const [key, value] of Object.entries(current_music_dict)) {
    folder_arr.push(value);
  }
  payload = { 'music_dirs' : folder_arr, 'current_dir' : current_music_dir, 'status_info' : status_info };
  return JSON.stringify(payload);
}

function jsonize_music_dict() {
  let folder_arr = [];
  for (const [key, value] of Object.entries(current_music_dict)) {
    let folder = { 'name': value, 'id': key, 'is_dir': (is_for_dirs ? 'true' : 'false') };
    folder_arr.push(folder);
  }
  return JSON.stringify(folder_arr);
}

function run_moc_cmd(script, script_args) {
  let mocp_cmd, spawn_proc;
  mocp_cmd = init_scripts_dir + script;

  moc_cmd_stdout = '';
  spawn_proc = spawn(mocp_cmd, script_args);
  return new Promise((resolveFunc) => {
    spawn_proc.stdout.on("data", (x) => {
      moc_cmd_stdout = x.toString();
      //process.stdout.write(x.toString());
    });
    spawn_proc.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    spawn_proc.on("exit", (code) => {
      resolveFunc(code);
    });
  });
}

async function async_run_moc_cmd(script, script_args) {
  await run_moc_cmd(script, script_args);
}

function run_cmd(script_args) {
  let exec_cmd, spawn_proc;
  exec_cmd = init_scripts_dir + '/cmd.sh';

  cmd_stdout = '';
  spawn_proc = spawn(exec_cmd, script_args);
  return new Promise((resolveFunc) => {
    spawn_proc.stdout.on("data", (x) => {
      cmd_stdout = x.toString();
      // process.stdout.write(x.toString());
    });
    spawn_proc.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    spawn_proc.on("exit", (code) => {
      resolveFunc(code);
    });
  });
}

async function async_run_cmd(script_args) {
  await run_cmd(script_args);
}

function normalize_name(name) {
  let rtn = name.trim();
  rtn = rtn.replace('?', '.');
  rtn = rtn.replace('/', '');
  return rtn;
}

function append_music_dict(folder_arr, is_for_dir) {
  let idx, dict_entry;
  for (idx = 0; idx < folder_arr.length; idx++) {
     let normalized = normalize_name(folder_arr[idx]);
     if (normalized && normalized.length > 0) {
       dict_entry = { name : normalized, id : "entry_" + idx, is_dir : ((is_for_dir == 1) ? "true" : "false") };
       current_music_dict[dict_entry.id] = dict_entry;
     }
  }
}

function do_find_cmd(is_for_dirs) {
  var find_cmd, spawn_proc, is_for_var = is_for_dirs ? 'is_dirs' : 'is_files';
  find_cmd = init_scripts_dir + '/find_cmd.sh';

  find_stdout = '';
  spawn_proc = spawn(find_cmd, [ current_music_dir, is_for_var ]);
  return new Promise((resolveFunc) => {
    spawn_proc.stdout.on("data", (x) => {
      find_stdout = x.toString();
      // process.stdout.write(x.toString());
    });
    spawn_proc.stderr.on("data", (x) => {
      find_stdout = '';
      process.stderr.write(x.toString());
    });
    spawn_proc.on("exit", (code) => {
      resolveFunc(code);
    });
  });
}

async function send_moc_info(res) {
  let moc_info_array, idx, status_info = {};
  await run_moc_cmd('/moc_cmd.sh', [ '--info' ]);
  if (moc_cmd_stdout == '') {
    console.log('No moc_info_stdout value');
    res.send(JSON.stringify({ 'success' : false }));
    return;
  }
  moc_info_array = moc_cmd_stdout.split(/\r?\n|\r|\n/g);
  for (idx = 0; idx < moc_info_array.length; idx++) {
    let info_line, file_ent_idx, file_entry, last;
    info_line = moc_info_array[idx];
    file_ent_idx = info_line.indexOf('File: ');
    if (file_ent_idx >= 0) {
       file_entry = info_line.substring(file_ent_idx + 6, info_line.length);
       last = file_entry.lastIndexOf('/');
       if (last == -1) {
         console.log("Cannot find last slash: " + file);
       }
       else {
         current_music_dir = file_entry.slice(0, last);
         status_info['file'] = file_entry.slice(last+1, file_entry.length);
       }
       break;
    }
  }
  if ('file' in status_info) {
    if (current_music_dir.indexOf(init_music_dir) == -1) {
      console.log("Invalid current music_dir: " + current_music_dir);
    }
  }
  send_current_dir_contents(res, null);
}

async function send_current_dir_contents(res, status_info) {
  let find_dirs_stdout, find_files_stdout;
  await do_find_cmd(true);
  find_dirs_stdout = find_stdout;
  await do_find_cmd(false);
  find_files_stdout = find_stdout;
  res.send(build_payload(find_dirs_stdout, find_files_stdout, status_info));
}

// main index page
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

router.get('/mocplay', function(req, res) {
  async_run_moc_cmd('/moc_cmd.sh', [ '--unpause' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocstop', function(req, res) {
  async_run_moc_cmd('/moc_cmd.sh', [ '--pause' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocnext', function(req, res) {
  async_run_moc_cmd('/moc_cmd.sh', [ '--next' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocprev', function(req, res) {
  async_run_moc_cmd('/moc_cmd.sh', [ '--previous' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocvolup', function(req, res) {
  current_music_volume += 3;
  async_run_cmd([ 'amixer', 'set', 'PCM', current_music_volume.toString()+'%' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocvoldown', function(req, res) {
  current_music_volume -= 3;
  async_run_cmd([ 'amixer', 'set', 'PCM', current_music_volume.toString()+'%' ]);
  res.send(JSON.stringify({ success : true }));
});

router.get('/mocrefresh', function(req, res) {
  send_moc_info(res);
});

router.get('/mocinit', function(req, res) {
  send_current_dir_contents(res, null);
});

router.get('/mocplayfolder', function(req, res) {
  let id = req.query.folder_id, dir_entry;
  dir_entry = current_music_dict[id];
  if (!dir_entry) {
    console.log("Cannot find entry with id " + id);
    return;
  }
  current_music_dir += "/";
  current_music_dir += dir_entry.name;
  send_current_dir_contents(res, null);
});

router.get('/mocmoveup', function(req, res) {
  let last = current_music_dir.lastIndexOf("/");
  if (last == -1) {
    console.log("Cannot find last slash " + current_music_dir);
    return;
  }
  // Check if not reached the top level init directory.
  if (current_music_dir != init_music_dir) {
    current_music_dir = current_music_dir.slice(0, last);
  }
  send_current_dir_contents(res, null);
});

router.get('/mocsetplaylist', function(req, res) {
  // Check if not reached the top level init directory.
  if (current_music_dir != init_music_dir) {
    async_run_moc_cmd('/moc_append_play.sh', [ current_music_dir ]);
  }
  res.send(JSON.stringify({ success : true }));
});

// apply the routes to our application
app.use('/', router);
// add for public artifacts, e.g. stylesheets
app.use(express.static(__dirname + '/public'));

app.listen(port);
console.log('Server started at http://mocdal:' + port);
