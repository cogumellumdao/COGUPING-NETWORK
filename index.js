const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const UserAgent = require('user-agents');
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Color definitions
const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m"
};

// Original banner
const BANNER = [
  `${COLORS.cyan}╭───────────────────────────────────────────────────────────────────────────────────────╮${COLORS.reset}`,
  `${COLORS.cyan}│                                                                                       │${COLORS.reset}`,
  `${COLORS.green}│      ██████╗ ██████╗  ██████╗ ██╗   ██╗     ██████╗ ██████╗  ██████╗ ██████╗ ███████╗ │${COLORS.reset}`,
  `${COLORS.green}│     ██╔════╝██╔═══██╗██╔════╝ ██║   ██║    ██╔═══██╗██╔══██╗██╔═══██╗██╔══██╗██╔════╝ │${COLORS.reset}`,
  `${COLORS.green}│     ██║     ██║   ██║██║  ███╗██║   ██║    ██║   ██║██████╔╝██║   ██║██████╔╝███████╗ │${COLORS.reset}`,
  `${COLORS.green}│     ██║     ██║   ██║██║   ██║██║   ██║    ██║   ██║██╔══██╗██║   ██║██╔═══╝ ╚════██║ │${COLORS.reset}`,
  `${COLORS.green}│     ╚██████╗╚██████╔╝╚██████╔╝╚██████╔╝    ╚██████╔╝██║  ██║╚██████╔╝██║     ███████║ │${COLORS.reset}`,
  `${COLORS.green}│      ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝ │${COLORS.reset}`,
  `${COLORS.green}│                 PING NETWORK - CogumellumDROPS                                     │${COLORS.reset}`,
  `${COLORS.cyan}│                                                                                       │${COLORS.reset}`,
  `${COLORS.cyan}╰───────────────────────────────────────────────────────────────────────────────────────╯${COLORS.reset}`
];

// Function to prompt user input
async function promptUser(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Initialize configuration
let USER_ID = process.env.USER_ID || '';
let DEVICE_ID = process.env.DEVICE_ID || '';

async function initializeConfig() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const envPath = path.resolve(__dirname, '.env');
  let envContent = {};

  // Load existing .env content if it exists
  if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf8');
    envData.split('\n').forEach(line => {
      const [key, value] = line.split('=').map(s => s.trim());
      if (key && value) envContent[key] = value;
    });
  }

  if (!USER_ID) {
    console.log(`${COLORS.cyan}No USER_ID found in .env file.${COLORS.reset}`);
    console.log(`${COLORS.green}You can provide a USER_ID now. This only needs to be done once as it will be saved to the .env file.${COLORS.reset}`);
    const addUserId = await promptUser(rl, `${COLORS.yellow}Would you like to add a USER_ID? (yes/no): ${COLORS.reset}`);
    
    if (addUserId.toLowerCase() === 'yes') {
      USER_ID = await promptUser(rl, `${COLORS.yellow}Enter your USER_ID: ${COLORS.reset}`);
      if (!USER_ID) {
        USER_ID = '00000';
        console.log(`${COLORS.red}No USER_ID provided, using default: ${USER_ID}${COLORS.reset}`);
      }
      envContent.USER_ID = USER_ID;
      console.log(`${COLORS.green}USER_ID saved to .env file. You won't need to enter it again.${COLORS.reset}`);
    } else {
      USER_ID = '00000';
      envContent.USER_ID = USER_ID;
      console.log(`${COLORS.yellow}Using default USER_ID: ${USER_ID}${COLORS.reset}`);
    }
  } else {
    console.log(`${COLORS.green}USER_ID found in .env: ${USER_ID}${COLORS.reset}`);
    envContent.USER_ID = USER_ID;
  }

  if (!DEVICE_ID) {
    DEVICE_ID = uuidv4();
    envContent.DEVICE_ID = DEVICE_ID;
    console.log(`${COLORS.green}Generated new DEVICE_ID: ${DEVICE_ID}${COLORS.reset}`);
  } else {
    envContent.DEVICE_ID = DEVICE_ID;
  }

  // Write updated .env file
  const envString = Object.entries(envContent)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  try {
    fs.writeFileSync(envPath, envString.trim() + '\n');
    console.log(`${COLORS.green}Successfully updated .env file with USER_ID and DEVICE_ID${COLORS.reset}`);
  } catch (error) {
    console.error(`${COLORS.red}Failed to write .env file: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }

  rl.close();
}

// Initialize blessed screen only after config
function initializeScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Ping Network Auto Bot - CogumellumDROPS',
    fullUnicode: true
  });

  // Create banner box (fixed at top)
  const bannerBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: BANNER.length + 1,
    content: BANNER.join('\n'),
    tags: true,
    style: {
      fg: 'white',
      bg: 'black'
    }
  });

  // Create status box
  const statusBox = blessed.box({
    top: BANNER.length + 1,
    left: 0,
    width: '30%',
    height: 10,
    border: { type: 'line', fg: 'cyan' },
    label: ' {cyan-fg}Status{/cyan-fg} ',
    tags: true,
    style: {
      fg: 'white',
      bg: 'black',
      border: { fg: 'cyan' }
    }
  });

  // Create log box
  const logBox = blessed.log({
    top: BANNER.length + 1,
    left: '30%',
    width: '70%',
    height: 10,
    border: { type: 'line', fg: 'cyan' },
    label: ' {cyan-fg}Logs{/cyan-fg} ',
    tags: true,
    scrollable: true,
    scrollbar: { bg: 'cyan', fg: 'white' },
    style: {
      fg: 'white',
      bg: 'black',
      border: { fg: 'cyan' }
    }
  });

  // Append elements to screen
  screen.append(bannerBox);
  screen.append(statusBox);
  screen.append(logBox);

  // Handle keypress to exit
  screen.key(['escape', 'q', 'C-c'], () => {
    screen.destroy();
    process.exit(0);
  });

  return { screen, statusBox, logBox };
}

// Logger to output to logBox
function createLogger(logBox) {
  return {
    info: (msg) => logBox.add(`{green-fg}[✓]{/} ${msg}{/}`),
    warn: (msg) => logBox.add(`{yellow-fg}[⚠]{/} ${msg}{/}`),
    error: (msg) => logBox.add(`{red-fg}[✗]{/} ${msg}{/}`),
    success: (msg) => logBox.add(`{green-fg}[✅]{/} ${msg}{/}`),
    loading: (msg) => logBox.add(`{cyan-fg}[⟳]{/} ${msg}{/}`),
    step: (msg) => logBox.add(`{white-fg}[➤]{/} ${msg}{/}`),
    banner: () => {}
  };
}

// State to track status
let status = {
  connection: 'Disconnected',
  userId: '',
  deviceId: '',
  zoneId: '',
  points: 'N/A',
  lastTransaction: 'N/A'
};

// Update status box
function updateStatus(statusBox) {
  statusBox.setContent(
    `{cyan-fg}Connection:{/} ${status.connection}\n` +
    `{cyan-fg}User ID:{/} ${status.userId}\n` +
    `{cyan-fg}Device ID:{/} ${status.deviceId}\n` +
    `{cyan-fg}Zone ID:{/} ${status.zoneId}\n` +
    `{cyan-fg}Points:{/} ${status.points}\n` +
    `{cyan-fg}Last Transaction:{/} ${status.lastTransaction}`
  );
}

async function startBot() {
  // Run config initialization first
  await initializeConfig();

  // Initialize screen and UI components
  const { screen, statusBox, logBox } = initializeScreen();
  const logger = createLogger(logBox);

  const getRandomZoneId = () => Math.floor(Math.random() * 6).toString();
  const ZONE_ID = getRandomZoneId();

  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  const UA_STRING = userAgent.toString();

  const CONFIG = {
    wsUrl: `wss://ws.pingvpn.xyz/pingvpn/v1/clients/${USER_ID}/events`,
    user_id: USER_ID,
    device_id: DEVICE_ID,
    proxy: { zoneId: ZONE_ID },
    headers: {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9,id;q=0.8',
      'content-type': 'text/plain;charset=UTF-8',
      'sec-ch-ua': userAgent.data.userAgent,
      'sec-ch-ua-mobile': userAgent.data.isMobile ? '?1' : '?0',
      'sec-ch-ua-platform': `"${userAgent.data.platform}"`,
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'none',
      'sec-fetch-storage-access': 'active',
      'sec-gpc': '1'
    }
  };

  const WS_HEADERS = {
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'user-agent': UA_STRING
  };

  // Update status with initial values
  status.userId = USER_ID;
  status.deviceId = DEVICE_ID;
  status.zoneId = ZONE_ID;
  updateStatus(statusBox);
  screen.render();

  async function sendAnalyticsEvent() {
    try {
      logger.loading('Sending analytics event...');
      const payload = {
        client_id: CONFIG.device_id,
        events: [{
          name: 'connect_clicked',
          params: {
            session_id: Date.now().toString(),
            engagement_time_msec: 100,
            zone: CONFIG.proxy.zoneId
          }
        }]
      };
      await axios.post('https://www.google-analytics.com/mp/collect?measurement_id=G-M0F9F7GGW0&api_secret=tdSjjplvRHGSEpXPfPDalA', payload, {
        headers: CONFIG.headers
      });
      logger.success('Analytics event sent successfully');
    } catch (error) {
      logger.error(`Failed to send analytics: ${error.message}`);
    }
  }

  function connectWebSocket() {
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 5000;
    let isAlive = false;

    function establishConnection() {
      logger.loading('Establishing WebSocket connection...');
      status.connection = 'Connecting';
      updateStatus(statusBox);
      screen.render();
      ws = new WebSocket(CONFIG.wsUrl, { headers: WS_HEADERS });

      ws.on('open', () => {
        logger.success(`WebSocket connected to ${CONFIG.wsUrl}`);
        status.connection = 'Connected';
        reconnectAttempts = 0;
        isAlive = true;
        updateStatus(statusBox);
        screen.render();
        sendAnalyticsEvent();
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          logger.info(`Received message: ${JSON.stringify(message)}`);
          isAlive = true;
          if (message.type === 'client_points') {
            status.points = message.data.amount;
            status.lastTransaction = message.data.last_transaction_id;
            logger.success(`Points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`);
            updateStatus(statusBox);
            screen.render();
          } else if (message.type === 'referral_points') {
            status.points = message.data.amount;
            status.lastTransaction = message.data.last_transaction_id;
            logger.success(`Referral points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`);
            updateStatus(statusBox);
            screen.render();
          }
        } catch (error) {
          logger.error(`Error parsing WebSocket message: ${error.message}`);
          screen.render();
        }
      });

      ws.on('close', () => {
        logger.warn('WebSocket disconnected');
        status.connection = 'Disconnected';
        isAlive = false;
        updateStatus(statusBox);
        screen.render();
        attemptReconnect();
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`);
        status.connection = 'Error';
        isAlive = false;
        updateStatus(statusBox);
        screen.render();
      });
    }

    function sendPing() {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
        logger.step('Sent ping to server');
        screen.render();
      }
    }

    setInterval(() => {
      if (!isAlive && ws && ws.readyState !== WebSocket.CLOSED) {
        logger.warn('No messages received, closing connection...');
        ws.close();
      } else {
        sendPing();
      }
    }, 60000);

    function attemptReconnect() {
      if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached. Stopping reconnection.');
        status.connection = 'Failed';
        updateStatus(statusBox);
        screen.render();
        return;
      }
      const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
      logger.warn(`Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      screen.render();
      setTimeout(() => {
        reconnectAttempts++;
        establishConnection();
      }, delay);
    }

    establishConnection();
    return ws;
  }

  logger.step(`Starting bot with user_id: ${CONFIG.user_id}, device_id: ${CONFIG.device_id}`);
  logger.info(`Using User-Agent: ${UA_STRING}`);
  logger.info(`Selected random zoneId: ${CONFIG.proxy.zoneId}`);
  connectWebSocket();
  screen.render();
}

process.on('SIGINT', () => {
  console.log(`${COLORS.yellow}Shutting down bot...${COLORS.reset}`);
  process.exit(0);
});

startBot().catch((error) => {
  console.error(`${COLORS.red}Bot startup failed: ${error.message}${COLORS.reset}`);
  process.exit(1);
});