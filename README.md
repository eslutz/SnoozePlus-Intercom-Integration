# SnoozePlus-Intercom-Integration

Snooze+ is an inbox app for Intercom to used to automate delayed responses to customers.

## Local Development

Navigate to the root folder of the application and run the below command.

`npm run start:dev`

## Steps To Deploy Application

1. Clone this repo to your local machine.
1. Run the command `npm run build` to get the application files ready for deployment.
1. Start a SSH session with the server.
1. Run the [stop script](#stopping-your-app).
1. Start a SFTP session with the server.
1. Upload files from your local machine to the server.
   - local file path: `/SnoozePlus-Intercom-Integration/dist/`
   - remote server path: `/home/activelabs/apps/snoozeplus/`
1. Go back to the SSH session and run the [start script](#starting-your-app).

## Application Hosting - Opalstack Node.js

### Controlling your app

#### Starting your app

Start your app by running:
`/home/activelabs/apps/snoozeplus/start`

#### Stopping your app

Stop your app by running:
`/home/activelabs/apps/snoozeplus/stop`

### Installing modules

If you want to install Node modules in your app directory:

```bash
cd /home/activelabs/apps/snoozeplus
npm install modulename
```
