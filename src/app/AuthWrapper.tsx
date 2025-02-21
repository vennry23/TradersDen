import React from 'react';
import ChunkLoader from '@/components/loader/chunk-loader';
import DerivAPI from '@deriv/api';
import { localize } from '@deriv-com/translations';
import { URLUtils } from '@deriv-com/utils';
import App from './App';

const APP_ID = 68848; // ✅ Your Deriv App ID

const setLocalStorageToken = async (loginInfo: URLUtils.LoginInfo[], paramsToDelete: string[]) => {
    if (!loginInfo.length) return;

    try {
        const defaultActiveAccount = URLUtils.getDefaultActiveAccount(loginInfo);
        if (!defaultActiveAccount) return;

        const accountsList: Record<string, string> = {};
        const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

        loginInfo.forEach((account: { loginid: string; token: string; currency: string }) => {
            accountsList[account.loginid] = account.token;
            clientAccounts[account.loginid] = account;
        });

        localStorage.setItem('accountsList', JSON.stringify(accountsList));
        localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

        URLUtils.filterSearchParams(paramsToDelete);

        // ✅ Initialize Deriv API inside this function
        const api = new DerivAPI({
            app_id: APP_ID,
            ws: new WebSocket(`wss://ws.deriv.com/websockets/v3?app_id=${APP_ID}`),
        });

        console.log('🔄 Authorizing user...');
        const { authorize, error } = await api.authorize(loginInfo[0].token);
        api.disconnect();

        if (error) {
            console.error('❌ Authorization Error:', error);
            throw new Error(error.message);
        }

        console.log('✅ Authorized successfully:', authorize);

        const firstId = authorize?.account_list?.[0]?.loginid;
        const filteredTokens = loginInfo.filter(token => token.loginid === firstId);

        if (filteredTokens.length) {
            localStorage.setItem('authToken', filteredTokens[0].token);
            localStorage.setItem('active_loginid', filteredTokens[0].loginid);
            return;
        }

        localStorage.setItem('authToken', loginInfo[0].token);
        localStorage.setItem('active_loginid', loginInfo[0].loginid);
    } catch (error) {
        console.error('❌ Error setting up login info:', error);
    }
};

export const AuthWrapper = () => {
    const [isAuthComplete, setIsAuthComplete] = React.useState(false);
    const { loginInfo, paramsToDelete } = URLUtils.getLoginInfoFromURL();

    React.useEffect(() => {
        const initializeAuth = async () => {
            await setLocalStorageToken(loginInfo, paramsToDelete);
            URLUtils.filterSearchParams(['lang']);
            setIsAuthComplete(true);
        };

        initializeAuth();
    }, [loginInfo, paramsToDelete]);

    if (!isAuthComplete) {
        return <ChunkLoader message={localize('Initializing...')} />;
    }

    return <App />;
};
