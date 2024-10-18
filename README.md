# SnoozePlus-Intercom-Integration

Snooze+ is an inbox app for Intercom used to automate sending delayed responses to customers.

## Local Development

1. Clone this repo to your local machine
1. Navigate to the root directory of the application
1. Create a **.env.local** file with the [required environment variables](#required-environment-variables)
1. Run the command `npm run dev` to start the application

## Steps To Deploy Application

1. Clone this repo to your local machine
1. Navigate to the root directory of the application
1. Create a **.env.production** file with the [required environment variables](#required-environment-variables)
1. Run the command `npm run build` to get the application files ready for deployment
1. Start a SSH session with the server
1. On the server run the [stop script](#stopping-your-app)
1. Start a SFTP session with the server
1. Upload files from your local machine to the server
   - local file path: `./SnoozePlus-Intercom-Integration/dist/`
   - remote server path: `/home/activelabs/apps/snoozeplus/`
1. Go back to the SSH session and on the server run the [start script](#starting-your-app)

## Application Hosting - Opalstack Node.js

Application server: `opal7.opalstack.com`

### Controlling your app

#### Starting your app

Start your app by running:
`/home/activelabs/apps/snoozeplus/start`

#### Stopping your app

Stop your app by running:
`/home/activelabs/apps/snoozeplus/stop`

## Required Environment Variables

The environment variables for this application can be found in the **[.env.sample](.env.sample)** file.

_NODE_ENV_ must be set to _production_ int the **.env.production** file.

- `NODE_ENV=production`
