import React, { lazy, Suspense, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';
import RunPanel from '../../components/run-panel';
import Dashboard from '../dashboard';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AppWrapper = observer(() => {
    const { dashboard, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showSignals, setShowSignals] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (showAnalysis || showSignals) {
            clear();
        }
    }, [showAnalysis, showSignals, clear]);

    const handleTabChange = (tab_index) => {
        setActiveTab(tab_index);
        navigate(`#${TAB_IDS[tab_index] || TAB_IDS[0]}`);
    };

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} onTabItemClick={handleTabChange}>
                        <div label={<Localize i18n_default_text='Dashboard' />} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>
                        <div label={<Localize i18n_default_text='Bot Builder' />} id='id-bot-builder' />
                        <div label={<Localize i18n_default_text='Analysis Tool' />} id='id-analysis-tool'>
                            <iframe src='https://your-analysis-tool-url.com' width='100%' height='500px' title='Analysis Tool'></iframe>
                        </div>
                        <div label={<Localize i18n_default_text='Signals' />} id='id-signals'>
                            <iframe src='https://your-signals-url.com' width='100%' height='500px' title='Signals'></iframe>
                        </div>
                        <div label={<Localize i18n_default_text='Charts' />} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message='Loading chart...' />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<Localize i18n_default_text='Tutorials' />} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message='Loading tutorials...' />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                    </Tabs>
                </div>
            </div>
            <div className='main__run-strategy-wrapper'>
                <RunPanel />
            </div>
        </>
    );
});

export default AppWrapper;
