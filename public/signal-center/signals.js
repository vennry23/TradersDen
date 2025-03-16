const ticksStorage = {
    R_10: [],
    R_25: [],
    R_50: [],
    R_75: [],
    R_100: []
};

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=52152');

let selectedSymbol = null; // Active volatility index

// OAuth Settings
const clientId = "52152";
const redirectUri = encodeURIComponent(window.location.origin + "/auth");
const loginUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${clientId}&redirect_uri=${redirectUri}`;

document.getElementById("loginBtn").addEventListener("click", () => {
    window.location.href = loginUrl;
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("deriv_token");
    location.reload();
});

// Check OAuth token on load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("token")) {
    localStorage.setItem("deriv_token", urlParams.get("token"));
    window.history.replaceState({}, document.title, "/");
}

const getAuthToken = () => localStorage.getItem("deriv_token");

// WebSocket Subscription
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
    Object.keys(ticksStorage).forEach(subscribeTicks);
};

// Calculate Trend Percentages
const calculateTrendPercentage = (symbol, ticksCount) => {
    const ticks = ticksStorage[symbol].slice(-ticksCount);
    if (ticks.length < 2) return { risePercentage: 0, fallPercentage: 0 };

    let riseCount = 0, fallCount = 0;

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

// WebSocket Message Handling
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.history && data.history.prices) {
        const symbol = data.echo_req.ticks_history;
        ticksStorage[symbol] = data.history.prices.map(price => parseFloat(price));
    } else if (data.tick) {
        const symbol = data.tick.symbol;
        ticksStorage[symbol].push(parseFloat(data.tick.quote));
        if (ticksStorage[symbol].length > 255) ticksStorage[symbol].shift();
    }
};

// Handle Selection of Volatility Index
function selectVolatility(symbol) {
    selectedSymbol = symbol;

    // Highlight selected row
    document.querySelectorAll(".volatility-row").forEach(row => row.classList.remove("selected"));
    document.getElementById(`row-${symbol}`).classList.add("selected");
}

// Update Tables
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

        // Determine Buy/Sell Signals
        const isBuy = rise255 > 57 && rise55 > 55;
        const isSell = fall255 > 57 && fall55 > 55;

        const riseClass = isBuy ? "rise" : "neutral";
        const fallClass = isSell ? "fall" : "neutral";

        // Update Rise/Fall Table
        riseFallTable.innerHTML += `<tr id="row-${symbol}" class="volatility-row" onclick="selectVolatility('${symbol}')">
            <td>Volatility ${symbol.replace("R_", "")} index</td>
            <td><span class="signal-box ${riseClass}">${isBuy ? "BUY" : "----"}</span></td>
            <td><span class="signal-box ${fallClass}">${isSell ? "SELL" : "----"}</span></td>
        </tr>`;

        // Last Digit Analysis for Over/Under
        const digitCounts = new Array(10).fill(0);
        ticks.forEach(tick => {
            const lastDigit = parseInt(tick.toString().slice(-1));
            digitCounts[lastDigit]++;
        });

        const totalTicks = ticks.length;
        const digitPercentages = digitCounts.map(count => (count / totalTicks) * 100);

        const overClass = digitPercentages[7] < 10 && digitPercentages[8] < 10 && digitPercentages[9] < 10 ? "over" : "neutral";
        const underClass = digitPercentages[0] < 10 && digitPercentages[1] < 10 && digitPercentages[2] < 10 ? "under" : "neutral";

        // Update Over/Under Table
        overUnderTable.innerHTML += `<tr id="row-${symbol}" class="volatility-row" onclick="selectVolatility('${symbol}')">
            <td>Volatility ${symbol.replace("R_", "")} index</td>
            <td><span class="signal-box ${overClass}">${overClass === "over" ? "Over 2" : "----"}</span></td>
            <td><span class="signal-box ${underClass}">${underClass === "under" ? "Under 7" : "----"}</span></td>
        </tr>`;
    });
}

// Execute Trade Based on Active Signal
const placeTrade = () => {
    if (!selectedSymbol) {
        alert("Please select a volatility index.");
        return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
        alert("You must log in to trade.");
        return;
    }

    const { risePercentage: rise255, fallPercentage: fall255 } = calculateTrendPercentage(selectedSymbol, 255);
    const { risePercentage: rise55, fallPercentage: fall55 } = calculateTrendPercentage(selectedSymbol, 55);

    let contractType = null;
    if (rise255 > 57 && rise55 > 55) contractType = "CALL";
    if (fall255 > 57 && fall55 > 55) contractType = "PUT";

    if (!contractType) {
        alert("No strong signal for trading.");
        return;
    }

    const tradeRequest = {
        buy: 1,
        price: 10,
        parameters: {
            amount: 10,
            basis: "stake",
            contract_type: contractType,
            currency: "USD",
            duration: 1,
            duration_unit: "t",
            symbol: selectedSymbol
        },
        authorize: authToken
    };

    ws.send(JSON.stringify(tradeRequest));
    alert(`Trade placed: ${contractType} on ${selectedSymbol}`);
};

// Run Trade Button
document.getElementById("runTradeBtn").addEventListener("click", placeTrade);

// Auto-refresh Tables
setInterval(updateTables, 1000);
