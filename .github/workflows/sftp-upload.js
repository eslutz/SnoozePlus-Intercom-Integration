const fs = require('fs');
const path = require('path');

function sftpFileUpload(host, port, username, password, localPath, remotePath) {
  const Client = require('ssh2-sftp-client');
  let sftp = new Client();

  sftp
    .connect({
      host: host,
      port: port,
      username: username,
      password: password,
    })
    .then(async () => {
      console.log(`Connection established to ${host}`);
      console.log(`Current working directory: ${await sftp.cwd()}`);
      await processPath(localPath, remotePath);
    })
    .then(() => {
      console.log('Upload finished');
      return sftp.end();
    })
    .catch((error) => {
      core.setFailed(`Action failed with error ${error}`);
      process.exit(1);
    });

  async function processPath(local, remote) {
    console.log(`Uploading: ${local} to ${remote}`);
    if (fs.lstatSync(local).isDirectory()) {
      return sftp.uploadDir(local, remote);
    } else {
      var directory = await sftp.realPath(path.dirname(remote));
      if (!(await sftp.exists(directory))) {
        await sftp.mkdir(directory, true);
        console.log(`Created directory ${directory}`);
      }
      var modifiedPath = remote;
      if (await sftp.exists(remote)) {
        if ((await sftp.stat(remote)).isDirectory) {
          var modifiedPath = modifiedPath + path.basename(local);
        }
      }
      return sftp.put(fs.createReadStream(local), modifiedPath);
    }
  }
}

export default sftpFileUpload;
