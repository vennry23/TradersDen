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
   <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon">
<g id="Vector">
<path d="M4.86145 15.2219H7.04631C6.8442 15.4184 6.73304 15.6744 6.73304 15.944C6.7381 16.529 7.25852 16.9997 7.90525 16.9997C8.19831 16.9997 8.48125 16.8991 8.69852 16.7163C9.17346 16.3187 9.19872 15.6515 8.75915 15.2219H10.8802C11.1739 15.2219 11.412 14.9832 11.412 14.6886L11.4141 13.1466C11.621 13.3386 11.8904 13.4442 12.1743 13.4442C12.7902 13.4394 13.2857 12.9451 13.2857 12.3308C13.2857 12.0524 13.1799 11.7836 12.9874 11.5773C12.5688 11.1261 11.8664 11.1021 11.4141 11.5197L11.412 8.99984L8.75914 8.99992C9.19871 9.4295 9.17345 10.0967 8.69851 10.4943C8.48124 10.6771 8.1983 10.7777 7.90524 10.7777C7.25851 10.7777 6.73809 10.3069 6.73303 9.72199C6.73303 9.45235 6.84419 9.19643 7.0463 8.99992L4.86145 8.99984V15.2219Z" stroke="var(--fill-color1)" stroke-width="0.8"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M7.05657 2.77774C6.61699 2.34816 6.64225 1.68093 7.1172 1.28334C7.33446 1.10054 7.61741 1 7.91046 1C8.5572 1 9.07762 1.47071 9.08267 2.05568C9.08267 2.32531 8.97151 2.58123 8.76941 2.77774L11.4222 2.77774V5.29738C11.2153 5.10547 10.9459 4.99992 10.6621 4.99992C10.0462 5.00472 9.55066 5.49904 9.55066 6.11335C9.55066 6.3917 9.65651 6.66046 9.84896 6.86683C10.2675 7.31793 10.9699 7.34195 11.4222 6.92451V8.99984H8.76928C9.20886 9.42942 9.1836 10.0966 8.70865 10.4942C8.49139 10.677 8.20844 10.7776 7.91539 10.7776C7.26866 10.7776 6.74823 10.3069 6.74318 9.7219C6.74318 9.45227 6.85434 9.19635 7.05644 8.99984H4.87159L4.87159 6.92442C4.41933 7.34196 3.71688 7.31796 3.2983 6.86683C3.10585 6.66046 3 6.3917 3 6.11335C3 5.49904 3.49556 5.00472 4.11141 4.99992C4.39527 4.99992 4.66471 5.1055 4.87159 5.29747L4.87159 3.31106C4.87159 3.01652 5.10971 2.77774 5.40344 2.77774L7.05657 2.77774Z" stroke="var(--fill-color1)" stroke-width="0.8"/>
</g>
</g>
</svg>
);

const ChartsIcon = () => (
    <svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m3.5 13 3-3.5L10 13l6.5-6.5" stroke="var(--fill-color1)" stroke-linecap="round"/><path d="M1 1v15a1 1 0 0 0 1 1h15" stroke="var(--fill-color1)" stroke-linecap="round"/></svg>
);

const TutorialsIcon = () => (
   <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="icon">
<rect id="Rectangle 533" x="1" y="0.5" width="15" height="11" rx="0.5" stroke="#333333"/>
<path id="Polygon 1" d="M11.75 5.56699C12.0833 5.75944 12.0833 6.24056 11.75 6.43301L7.25 9.03109C6.91667 9.22354 6.5 8.98298 6.5 8.59808L6.5 3.40192C6.5 3.01702 6.91667 2.77646 7.25 2.96891L11.75 5.56699Z" stroke="var(--fill-color1)"/>
<line id="Line 1" x1="1" y1="14.5" x2="5" y2="14.5" stroke="var(--fill-color1)" stroke-linecap="round"/>
<line id="Line 2" x1="8" y1="14.5" x2="16" y2="14.5" stroke="var(--fill-color1)" stroke-linecap="round"/>
<circle id="Ellipse 23" cx="5" cy="14.5" r="1.5" fill="var(--fill-color1)"/>
</g>
</svg>
);

const AnalysisToolIcon = () => (
    <svg width="24" height="24" fill="var(--text-general)" viewBox="0 0 24 24">
        <path d="M3 3h2v2H3zm4 0h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM3 7h2v2H3zm16 0h2v2h-2zm-4 0h2v2h-2zm-8 8h2v2H11zm4 0h2v2h-2zm4 0h2v2h-2zm-12 0h2v2H3zm0 4h2v2H3zm4 0h2v2H7zm12-4h2v2h-2zm-4 0h2v2h-2zm4 4h2v2h-2z" />
    </svg>
);

const SignalsIcon = () => (
    <svg width="24px" height="24px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">

<g fill="none" fill-rule="evenodd">

<path d="m0 0h32v32h-32z"/>

<path d="m16 23.3333333c.7054971 0 1.3378647.3131046 1.7657251.8079361-.5364679.4639137-1.1239266.9712419-1.7657251 1.5255163-.6383398-.5591127-1.2226122-1.0708429-1.7573994-1.5392067.4304214-.4865055 1.0579721-.7942457 1.7573994-.7942457zm0-5.6666666c2.3048894 0 4.4576506 1.2009433 5.704885 3.0752846-.4130934.3552245-.9166883.7900247-1.5310671 1.3205162-.8551473-1.4455488-2.4631903-2.3958008-4.1738179-2.3958008-1.6939811 0-3.2935514.9375716-4.153541 2.3633155-.6104727-.535199-1.1109102-.9732794-1.5210712-1.3322518 1.2518588-1.8474905 3.3914515-3.0310637 5.6746122-3.0310637zm.0064666-5.8333334c3.6910267 0 7.7501479 2.2543887 9.7175152 5.4253088-.7374102.6387525-1.2199186 1.0573621-1.5362933 1.3321302-1.5123244-2.7101472-5.0642122-4.757439-8.1812219-4.757439-3.0920156 0-6.62217548 2.0244039-8.15333066 4.7080787-.3127146-.2753249-.79333049-.6962176-1.52619224-1.3382492 1.98147431-3.140502 6.0163913-5.3698295 9.6795229-5.3698295zm.0032333-5.8333333c5.4911176 0 11.2324815 3.15266123 14.167125 7.4001118-.5539993.4804544-1.0599156.9185988-1.5234281 1.3200576-2.5144049-3.7988077-7.7353145-6.7201694-12.6436969-6.7201694-4.8664206 0-10.02085911 2.8700013-12.59269965 6.655398-.45802592-.4033711-.96136471-.8444698-1.51080184-1.3259792 2.98225947-4.22806264 8.65545979-7.3294188 14.10350149-7.3294188z" fill="var(--fill-color1)"/>

</g>

</svg>
);

const TradingHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="var(--text-general)" width="24px" height="24px" viewBox="0 0 24 24"><path d="M21.49 13.926l-3.273 2.48c.054-.663.116-1.435.143-2.275.04-.89.023-1.854-.043-2.835-.043-.487-.097-.98-.184-1.467-.077-.485-.196-.982-.31-1.39-.238-.862-.535-1.68-.9-2.35-.352-.673-.786-1.173-1.12-1.462-.172-.144-.31-.248-.414-.306l-.153-.093c-.083-.05-.187-.056-.275-.003-.13.08-.175.252-.1.388l.01.02s.11.198.258.54c.07.176.155.38.223.63.08.24.14.528.206.838.063.313.114.66.17 1.03l.15 1.188c.055.44.106.826.13 1.246.03.416.033.85.026 1.285.004.872-.063 1.76-.115 2.602-.062.853-.12 1.65-.172 2.335 0 .04-.004.073-.005.11l-.115-.118-2.996-3.028-1.6.454 5.566 6.66 6.394-5.803-1.503-.677z"/><path d="M2.503 9.48L5.775 7c-.054.664-.116 1.435-.143 2.276-.04.89-.023 1.855.043 2.835.043.49.097.98.184 1.47.076.484.195.98.31 1.388.237.862.534 1.68.9 2.35.35.674.785 1.174 1.12 1.463.17.145.31.25.413.307.1.06.152.093.152.093.083.05.187.055.275.003.13-.08.175-.252.1-.388l-.01-.02s-.11-.2-.258-.54c-.07-.177-.155-.38-.223-.63-.082-.242-.14-.528-.207-.84-.064-.312-.115-.658-.172-1.027-.046-.378-.096-.777-.15-1.19-.053-.44-.104-.825-.128-1.246-.03-.415-.033-.85-.026-1.285-.004-.872.063-1.76.115-2.603.064-.853.122-1.65.174-2.334 0-.04.004-.074.005-.11l.114.118 2.996 3.027 1.6-.454L7.394 3 1 8.804l1.503.678z"/></svg>
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

    const handleBotClick = useCallback(async (bot: { filePath: string; xmlContent: string }) => {
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        try {
            if (typeof load_modal.loadFileFromContent === 'function') {
                await load_modal.loadFileFromContent(bot.xmlContent);
            } else {
                console.error("loadFileFromContent is not defined on load_modal");
            }
            updateWorkspaceName(bot.xmlContent);
        } catch (error) {
            console.error("Error loading bot file:", error);
        }
    }, [setActiveTab, updateWorkspaceName, load_modal]);

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.BOT_BUILDER);
        // rudderStackSendDashboardClickEvent({ dashboard_click_name: 'open', subpage_name: 'bot_builder' });
    }, [load_modal, setActiveTab]);

    return (
        <React.Fragment>
            <div className='main'>
                <div className='main__container'>
                    <Tabs active_index={active_tab} className='main__tabs' onTabItemChange={onEntered} onTabItemClick={handleTabChange} top>
                        <div label={<><DashboardIcon /><Localize i18n_default_text='Dashboard' /></>} id='id-dbot-dashboard'>
                            <Dashboard handleTabChange={handleTabChange} />
                            <button onClick={handleOpen}>Load Bot</button>
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
                                        <li className='free-bot' key={index} onClick={() => {
                                            handleBotClick(bot);
                                        }}>
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
