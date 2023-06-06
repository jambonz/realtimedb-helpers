const { spawn } = require('child_process');
const debug = require('debug')('test:node');
let network;
const obj = {};
let output = '';
let idx = 1;

function clearOutput() {
  output = '';
}

function addOutput(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) < 128) output += str.charAt(i);
  }
}

module.exports = (networkName) => {
  network = networkName ;
  return obj;
};

obj.output = () => {
  return output;
};

obj.nodeMachine = (bindAddress, commands = ['/realtimedb-helpers/test/sentinel.sh']) => {
  const cmd = 'docker';
  const args = [
    'run', '-t', '--rm', '--net', `${network}`,
    '-v', `${__dirname}/..:/realtimedb-helpers`,
    'node:18',
    ...commands
  ]

  if (bindAddress) args.splice(5, 0, '--ip', bindAddress);

  clearOutput();

  return new Promise((resolve, reject) => {
    const child_process = spawn(cmd, args, {stdio: ['inherit', 'pipe', 'pipe']});

    child_process.on('exit', (code, signal) => {
      if (code === 0) {
        return resolve();
      }
      console.log(`node machine exited with non-zero code ${code} signal ${signal}`);
      reject(code);
    });
    child_process.on('error', (error) => {
      console.log(`error spawing child process for docker: ${args}`);
    });

    child_process.stdout.on('data', (data) => {
      //console.log(`stdout: ${data}`);
      addOutput(data.toString());
    });
    child_process.stdout.on('data', (data) => {
      // console.log(`stdout: ${data}`);
      addOutput(data.toString());
    });
  });
} 