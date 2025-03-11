import React, { lazy, Suspense, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import Dashboard from '../dashboard';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const location = useLocation();
    const navigate = useNavigate();
    const { isDesktop } = useDevice();

    const hash = ['dashboard', 'bot_builder', 'chart', 'tutorial', 'analysis_tool', 'signals'];
    const GetHashedValue = (tab) => {
        let tab_value = location.hash?.split('#')[1];
        return tab_value ? Number(hash.indexOf(tab_value)) : tab;
    };
    const active_hash_tab = GetHashedValue(active_tab);

    useEffect(() => {
        setActiveTab(Number(active_hash_tab));
        navigate(`#${hash[active_tab] || hash[0]}`);
    }, [active_tab]);

    return (
        <div className='main'>
            <div className='main__container'>
                <Tabs
                    active_index={active_tab}
                    className='main__tabs'
                    onTabItemClick={setActiveTab}
                    top
                >
                    <div label={<Localize i18n_default_text='Dashboard' />} id='id-dbot-dashboard'>
                        <Dashboard />
                    </div>
                    <div label={<Localize i18n_default_text='Bot Builder' />} id='id-bot-builder' />
                    <div label={<Localize i18n_default_text='Charts' />} id='id-charts'>
                        <Suspense fallback={<ChunkLoader message={localize('Loading chart...')} />}>
                            <Chart show_digits_stats={false} />
                        </Suspense>
                    </div>
                    <div label={<Localize i18n_default_text='Tutorials' />} id='id-tutorials'>
                        <Suspense fallback={<ChunkLoader message={localize('Loading tutorials...')} />}>
                            <Tutorial />
                        </Suspense>
                    </div>
                    <div label={<Localize i18n_default_text='Analysis Tool' />} id='id-analysis-tool'>
                        <iframe src='https://your-analysis-tool-url.com' width='100%' height='600px' frameBorder='0'></iframe>
                    </div>
                    <div label={<Localize i18n_default_text='Signals' />} id='id-signals'>
                        <iframe src='https://your-signals-url.com' width='100%' height='600px' frameBorder='0'></iframe>
                    </div>
                </Tabs>
            </div>
        </div>
    );
});

export default AppWrapper;
