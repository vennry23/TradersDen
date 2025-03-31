import React, { useState } from 'react';
import { startTrading, stopTrading } from '../../../public/signals/signals';

const RunPanel = () => {
    const [stake, setStake] = useState(1);
    const [martingale, setMartingale] = useState(2);
    const [isRunning, setIsRunning] = useState(false);
    const [useSignals, setUseSignals] = useState(false); // Toggle for trading source

    const handleRunClick = () => {
        if (!isRunning) {
            if (useSignals) {
                startTrading(stake, martingale); // Start trading from signals
            } else {
                console.log('Trading from bot builder logic'); // Placeholder for bot builder trading logic
                // TODO: Add logic to start trading from the bot builder
            }
            setIsRunning(true);
        } else {
            stopTrading(); // Stop trading from signals
            console.log('Stopping bot builder trading'); // Placeholder for stopping bot builder trading
            // TODO: Add logic to stop trading from the bot builder
            setIsRunning(false);
        }
    };

    return (
        <div className="run-panel">
            <div className="settings">
                <label>
                    Stake:
                    <input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(Number(e.target.value))}
                    />
                </label>
                <label>
                    Martingale Factor:
                    <input
                        type="number"
                        value={martingale}
                        onChange={(e) => setMartingale(Number(e.target.value))}
                    />
                </label>
                <label>
                    Use Signals:
                    <input
                        type="checkbox"
                        checked={useSignals}
                        onChange={(e) => setUseSignals(e.target.checked)}
                    />
                </label>
            </div>
            <button onClick={handleRunClick}>
                {isRunning ? 'Stop' : 'Run'}
            </button>
        </div>
    );
};

export default RunPanel;
