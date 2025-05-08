# Ping Network Auto Bot

This bot automates interactions with the Ping Network testnet, facilitating WebSocket connections and points tracking to help users participate in the CogumellumDROPS activity.

## Features

- Establishes WebSocket connection to Ping Network
- Sends periodic pings to maintain connection
- Tracks client and referral points in real-time
- Dynamic terminal UI with status and logs
- Random zone selection for proxy configuration
- Detailed logging with status emojis

## Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- A user ID for Ping Network (set in .env file)

## Register NOW : https://bit.ly/3ELpIWB
Use REF: IALANP .. to encourage more content like this!!

## Installation

First, OPEN the TERMINAL, the famous CMD

IMAGE

NOW just copy and PASTE 🥵

1. Clone the repository:

```bash
git clone https://github.com/cogumellumdao/COGUPING-NETWORK.git
cd COGUPING-NETWORK
```

2. Install dependencies:

```bash
npm install axios ws uuid user-agents dotenv blessed
```
3. OPEN your browser where you have the extension installed
Right click on the **EXTENSION** and look for "**INSPECT POP-UP**"
![image](https://github.com/user-attachments/assets/990ab1f9-bd4b-43f5-9ef3-fa5a9eb6381b)

Now click on "**APPLICATION**" then on Extesion storage, look for "**LOCAL**", Now click on "**persist:auth**" and just below you will have your **User_id** and **Device_ID**, copy and paste them into the .env file in the BOT folder
![image](https://github.com/user-attachments/assets/b3a52868-766f-4ad5-acf3-0be66fa4228a)


## Usage

Run the bot with:
```bash
node index.js
```

in the TERMINAL add your USER ID in the .env filethe bot will automatically generate a DEVICE ID if not present
The bot will:

Establish a WebSocket connection to the Ping Network
Send analytics events and track points updates
Show real-time status and logs in the terminal UI


Security Notice

Keep your user ID and device ID safe
This bot is for testnet only
Never share sensitive information publicly

Disclaimer
This project is for educational purposes only. Use at your own risk. The developers are not responsible for any potential issues or loss of points.
License
MIT
