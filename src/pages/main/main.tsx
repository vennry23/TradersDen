import React, { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const DashboardIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
);

const BotBuilderIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 16h3v8h5z" />
    </svg>
);

const ChartsIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 17h4v-6H3v6zm6 0h4v-10H9v10zm6 0h4v-4h-4v4zm6 0h4v-14h-4v14z" />
    </svg>
);

const TutorialsIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M10 6L8.59 7.41 13.17 12 8.59 16.59 10 18l8-8z" />
    </svg>
);

const AnalysisToolIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 3h2v2H3zm4 0h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM3 7h2v2H3zm16 0h2v2h-2zm-4 0h2v2h-2zm-8 8h2v2H11zm4 0h2v2h-2zm4 0h2v2h-2zm-12 0h2v2H3zm0 4h2v2H3zm4 0h2v2H7zm12-4h2v2h-2zm-4 0h2v2h-2zm4 4h2v2h-2z" />
    </svg>
);

const SignalsIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M2 21h19v-3H2v3zm2-6h15v-3H4v3zm2-5h11V7H6v3z" />
    </svg>
);

const TradingHubIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M12 2L2 7v13h20V7L12 2zm0 2.18l7 3.82v1.64l-7-3.82-7 3.82V8l7-3.82zM4 10.27l8 4.36 8-4.36v7.73H4V10.27z" />
    </svg>
);

const FreeBotsIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M2 21h19v-3H2v3zM20 3H4v10l8 5 8-5V3zm-8 4.5c-1.11 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2z" />
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, quick_strategy, summary_card } = useStore();
    const {
        active_tab,
        is_chart_modal_visible,
        is_trading_view_modal_visible,
        setActiveTab,
    } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    const [bots, setBots] = useState([]);

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
            }
        }
    }, [clear, connectionStatus, stopBot]);

    useEffect(() => {
        // Fetch the XML files and parse them
        const fetchBots = async () => {
            const botFiles = [
                'test1.xml',
                'test2.xml',
                // Add more paths to your XML files
            ];
            const botPromises = botFiles.map(async (file) => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(), // Use the file name as the title
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                        xmlContent: text, // Store the XML content
                    };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const bots = (await Promise.all(botPromises)).filter(Boolean);
            setBots(bots);
        };

        fetchBots();
    }, []);

    const runBot = (xmlContent: string) => {
        // Load the strategy into the bot builder
        updateWorkspaceName(xmlContent);
        console.log('Running bot with content:', xmlContent);
    };

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
        },
        [setActiveTab]
    );

    const handleBotClick = useCallback(
        (bot: { filePath: string; xmlContent: string }) => {
            // Load the strategy into the bot builder
            updateWorkspaceName(bot.xmlContent);
            // Switch to the bot builder tab
            setActiveTab(TAB_IDS.BOT_BUILDER);
        },
        [setActiveTab]
    );

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} onTabItemClick={handleTabChange} top>
                        <div label={<><DashboardIcon /><Localize i18n_default_text='Dashboard' /></>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                        </div>
                        <div label={<><BotBuilderIcon /><Localize i18n_default_text='Bot Builder' /></>} id='id-bot-builder' />
                        <div label={<><ChartsIcon /><Localize i18n_default_text='Charts' /></>} id='id-charts'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        <div label={<><TutorialsIcon /><Localize i18n_default_text='Tutorials' /></>} id='id-tutorials'>
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}>
                                <Tutorial handleTabChange={handleTabChange} />
                            </Suspense>
                        </div>
                        <div label={<><AnalysisToolIcon /><Localize i18n_default_text='Analysis Tool' /></>} id='id-analysis-tool'>
                            <iframe src='https://binaryfx.site/api_binaryfx' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><SignalsIcon /><Localize i18n_default_text='Signals' /></>} id='id-signals'>
                            <iframe src='signals' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><TradingHubIcon /><Localize i18n_default_text='Trading Hub' /></>} id='id-Trading-Hub'>
                            <iframe src='https://binaryfx.site/acc-center' width='100%' height='500px' frameBorder='0'></iframe>
                        </div>
                        <div label={<><FreeBotsIcon /><Localize i18n_default_text='Free Bots' /></>} id='id-free-bots'>
                            <div className='free-bots'>
                                <h2 className='free-bots__heading'><Localize i18n_default_text='Free Bots' /></h2>
                                <ul className='free-bots__content'>
                                    {bots.map((bot, index) => (
                                        <li className='free-bot' key={index} onClick={() => handleBotClick(bot)}>
                                            <img src={bot.image} alt={bot.title} className='free-bot__image' />
                                            <div className='free-bot__details'>
                                                <h3 className='free-bot__title'>{bot.title}</h3>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    <RunPanel />
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog cancel_button_text={cancel_button_text || localize('Cancel')} confirm_button_text={ok_button_text || localize('Ok')} has_close_icon is_visible={is_dialog_open} onCancel={onCancelButtonClick} onClose={onCloseDialog} onConfirm={onOkButtonClick || onCloseDialog} title={title}>
                {message}
            </Dialog>
        </React.Fragment>
    );
});

export default AppWrapper;
