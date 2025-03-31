const ticksStorage = {
    R_10: [],
    R_25: [],
    R_50: [],
    R_75: [],
    R_100: []
};

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=52152');

const subscribeTicks = (symbol) => {
    ws.send(JSON.stringify({
        ticks_history: symbol,
        count: 255,
        end: 'latest',
        style: 'ticks',
        subscribe: 1
    }));
};

ws.onopen = () => {
    ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'].forEach(subscribeTicks);
};

const calculateTrendPercentage = (symbol, ticksCount) => {
    const ticks = ticksStorage[symbol].slice(-ticksCount);
    if (ticks.length < 2) return { risePercentage: 0, fallPercentage: 0 };

    let riseCount = 0;
    let fallCount = 0;

    for (let i = 1; i < ticks.length; i++) {
        if (ticks[i] > ticks[i - 1]) riseCount++;
        else if (ticks[i] < ticks[i - 1]) fallCount++;
    }

    const total = riseCount + fallCount;
    return {
        risePercentage: total > 0 ? (riseCount / total) * 100 : 0,
        fallPercentage: total > 0 ? (fallCount / total) * 100 : 0
    };
};

let auth_token = ''; // Store the authorization token
let last_digit_trades = {}; // Track active trades per symbol

const initializeAPI = () => {
    ws.send(JSON.stringify({
        authorize: auth_token
    }));
};

const executeTrade = async (symbol, action) => {
    if (!isTrading || !auth_token) return;

    // Prevent multiple trades for the same symbol/action
    const tradeKey = `${symbol}_${action}`;
    if (last_digit_trades[tradeKey]) return;

    let contractType, barrier;
    switch (action) {
        case 'over':
            contractType = 'DIGITOVER';
            barrier = '2';
            break;
        case 'under':
            contractType = 'DIGITUNDER';
            barrier = '7';
            break;
        case 'rise':
            contractType = 'CALL';
            break;
        case 'fall':
            contractType = 'PUT';
            break;
        default:
            return;
    }

    const params = {
        proposal: 1,
        amount: stake,
        basis: "stake",
        contract_type: contractType,
        currency: "USD",
        symbol: symbol,
        duration: 1,
        duration_unit: "t"
    };

    // Add barrier for digit trades only
    if (barrier) {
        params.barrier = barrier;
    }

    last_digit_trades[tradeKey] = true;

    ws.send(JSON.stringify({
        buy: 1,
        price: stake,
        parameters: params
    }));
};

let isTrading = false;
let stake = 1;
let martingaleFactor = 2;
let activeContract = null;
let shouldRestartAfterComplete = false;

const proposalRequest = {
    proposal: 1,
    amount: 1,
    basis: "stake",
    contract_type: "DIGITOVER",
    currency: "USD",
    symbol: "R_10",
    duration: 1,
    duration_unit: "t",
    barrier: "2"
};

const tradeContract = (proposal_id) => {
    if (!isTrading) return;

    ws.send(JSON.stringify({
        buy: proposal_id,
        price: proposalRequest.amount
    }));
};

const initializeTradeSubscription = () => {
    // Subscribe to proposal
    ws.send(JSON.stringify(proposalRequest));
};

const updateProposal = () => {
    if (!isTrading) return;
    proposalRequest.amount = stake;
    ws.send(JSON.stringify(proposalRequest));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.msg_type === 'proposal') {
        if (data.error) {
            console.error('Proposal error:', data.error.message);
            return;
        }
        if (isTrading && !activeContract) {
            tradeContract(data.proposal.id);
        }
    }

    if (data.msg_type === 'buy') {
        if (data.error) {
            console.error('Buy error:', data.error.message);
            return;
        }
        activeContract = data.buy.contract_id;
        subscribeToContract(activeContract);
    }

    if (data.msg_type === 'proposal_open_contract') {
        const contract = data.proposal_open_contract;
        
        if (contract.is_sold) {
            const profit = contract.profit;
            console.log(`Contract completed. Profit: ${profit}`);
            
            if (profit < 0) {
                stake *= martingaleFactor;
            } else {
                stake = window.initialStake || 1;
            }
            
            activeContract = null;
            updateProposal();
            
            // Start new trade if trading should continue
            if (shouldRestartAfterComplete && isTrading) {
                initializeTradeSubscription();
            }
        }
    }

    // Handle authorizations
    if (data.msg_type === 'authorize') {
        console.log('Successfully authorized');
    }
    
    // Handle buy responses
    if (data.msg_type === 'buy') {
        if (data.error) {
            console.error('Trade error:', data.error.message);
            return;
        }
        const contract_id = data.buy.contract_id;
        console.log(`Trade executed: ${contract_id}`);
        monitorTrade(contract_id);
    }

    // Handle contract updates
    if (data.msg_type === 'proposal_open_contract') {
        const contract = data.proposal_open_contract;
        if (contract.is_sold) {
            handleTradeResult(contract);
        }
    }

    // Handle tick data
    if (data.history || data.tick) {
        if (data.history && data.history.prices) {
            const symbol = data.echo_req.ticks_history;
            ticksStorage[symbol] = data.history.prices.map(price => parseFloat(price));
        } else if (data.tick) {
            const symbol = data.tick.symbol;
            ticksStorage[symbol].push(parseFloat(data.tick.quote));
            if (ticksStorage[symbol].length > 255) ticksStorage[symbol].shift();
        }
    }
};

const handleTradeResult = (contract) => {
    const profit = contract.profit;
const stopTrading = () => {
    isTrading = false;
    console.log('Trading stopped.');
};

const executeTradeOld = (symbol, action) => {
    if (!isTrading) return; // Ensure trading is active

    console.log(`Executing ${action} trade on ${symbol} with stake ${stake}`);
    // Simulate trade execution
    // TODO: Replace with actual trading API logic
    const tradeResult = Math.random() > 0.5 ? 'win' : 'loss';
    console.log(`Trade result: ${tradeResult}`);

    if (tradeResult === 'loss') {
        stake *= martingaleFactor; // Apply martingale
    } else {
        stake = 1; // Reset stake on win
    }
};

function updateTables() {
    const riseFallTable = document.getElementById("riseFallTable");
    const overUnderTable = document.getElementById("overUnderTable");

    riseFallTable.innerHTML = "";
    overUnderTable.innerHTML = "";

    Object.keys(ticksStorage).forEach(symbol => {
        const ticks = ticksStorage[symbol];
        if (ticks.length < 255) return;

        // Calculate rise/fall percentages for 255 and 55 ticks
        const { risePercentage: rise255, fallPercentage: fall255 } = calculateTrendPercentage(symbol, 255);
        const { risePercentage: rise55, fallPercentage: fall55 } = calculateTrendPercentage(symbol, 55);

        // Check if both conditions are met for a buy/sell signal
        const isBuy = rise255 > 57 && rise55 > 55;
        const isSell = fall255 > 57 && fall55 > 55;

        // Execute trades based on signals
        if (isTrading) { // Ensure trading is active
            if (isBuy) executeTradeOld(symbol, 'buy');
            if (isSell) executeTradeOld(symbol, 'sell');
        }

        // Define status classes for signals
        const riseClass = isBuy ? "rise" : "neutral";
        const fallClass = isSell ? "fall" : "neutral";

        // Generate rise/fall table row
        riseFallTable.innerHTML += `<tr>
            <td>Volatility ${symbol.replace("R_", "")} index</td>
            <td><span class="signal-box ${riseClass}">${isBuy ? "Rise" : "----"}</span></td>
            <td><span class="signal-box ${fallClass}">${isSell ? "Fall" : "----"}</span></td>
        </tr>`;

        // Last digit analysis
        const digitCounts = new Array(10).fill(0);
        ticks.forEach(tick => {
            const lastDigit = parseInt(tick.toString().slice(-1));
            digitCounts[lastDigit]++;
        });

        const totalTicks = ticks.length;
        const digitPercentages = digitCounts.map(count => (count / totalTicks) * 100);

        const overClass = digitPercentages[7] < 10 && digitPercentages[8] < 10 && digitPercentages[9] < 10 ? "over" : "neutral";
        const underClass = digitPercentages[0] < 10 && digitPercentages[1] < 10 && digitPercentages[2] < 10 ? "under" : "neutral";

        // Generate over/under table row
        overUnderTable.innerHTML += `<tr>
            <td>Volatility ${symbol.replace("R_", "")} index</td>
            <td><span class="signal-box ${overClass}">${overClass === "over" ? "Over 2" : "----"}</span></td>
            <td><span class="signal-box ${underClass}">${underClass === "under" ? "Under 7" : "----"}</span></td>
        </tr>`;

        // Modify the trade execution part
        if (isTrading && !activeContract) {
            if (symbol === 'R_10' && overClass === 'over') {
                proposalRequest.symbol = symbol;
                initializeTradeSubscription();
            }
        }
    });
}

setInterval(updateTables, 1000); // Update every second

const subscribeToContract = (contract_id) => {
    ws.send(JSON.stringify({
        proposal_open_contract: 1,
        contract_id: contract_id,
        subscribe: 1
    }));
};

// Expose startTrading and stopTrading globally
window.startTrading = (initialStake, martingale) => {
    isTrading = true;
    stake = initialStake;
    window.initialStake = initialStake; // Store initial stake
    martingaleFactor = martingale;
    shouldRestartAfterComplete = true;
    
    // Get token from localStorage or another source
    auth_token = localStorage.getItem('deriv_token') || '';
    if (auth_token) {
        initializeAPI();
    } else {
        console.error('No authorization token found');
        isTrading = false;
    }
};

window.stopTrading = () => {
    isTrading = false;
    shouldRestartAfterComplete = false;
    
    // If there's an active contract, wait for it to complete
    if (!activeContract) {
        console.log('Trading stopped.');
    } else {
        console.log('Waiting for active contract to complete...');
    }
};
