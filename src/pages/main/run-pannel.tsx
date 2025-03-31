import React, { useState } from 'react';
import { startTrading, stopTrading } from '../../../public/signals/signals';

const RunPanel = () => {
    const [stake, setStake] = useState(1);
    const [martingale, setMartingale] = useState(2);
    const [isRunning, setIsRunning] = useState(false);

    const handleRunClick = () => {
        if (!isRunning) {
            startTrading(stake, martingale);
            setIsRunning(true);
        } else {
            stopTrading();
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
            </div>
            <button onClick={handleRunClick}>
                {isRunning ? 'Stop' : 'Run'}
            </button>
        </div>
    );
};

export default RunPanel;
