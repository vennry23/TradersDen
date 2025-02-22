import { website_name } from '@/utils/site-config';
import { getAppId } from '../config/config'; // ✅ Ensure this import is working
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getStaticUrl, urlForCurrentDomain } from '../url';
import { deriv_urls } from '../url/constants';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);

        setTimeout(() => {
            const new_href = loginUrl({ language });
            console.log("🔄 Redirecting to login URL:", new_href);
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    window.open(getStaticUrl('/signup/'));
};

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    let app_id = getAppId(); // 🔥 Fetch App ID
    const server_url = LocalStore.get('config.server_url');

    console.log("🔍 [login.ts] Retrieved App ID:", app_id);

    // 🔥 Ensure correct App ID if still incorrect
    if (!app_id || app_id === '36300') {
        console.warn("⚠️ App ID is incorrect, manually fixing...");
        app_id = '68848'; // ✅ Replace with your correct App ID
        localStorage.setItem('config.app_id', app_id);
    }

    console.log("📌 [login.ts] Final App ID Used:", app_id);

    const signup_device_cookie = new (CookieStorage as any)('signup_device');
    const signup_device = signup_device_cookie.get('signup_device');
    const date_first_contact_cookie = new (CookieStorage as any)('date_first_contact');
    const date_first_contact = date_first_contact_cookie.get('date_first_contact');
    const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${
        date_first_contact ? `&date_first_contact=${date_first_contact}` : ''
    }`;

    const getOAuthUrl = () => {
        return `https://oauth.${
            deriv_urls.DERIV_HOST_NAME
        }/oauth2/authorize?app_id=${app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    };

    if (server_url && /qa/.test(server_url)) {
        return `https://${server_url}/oauth2/authorize?app_id=${app_id}&l=${language}${marketing_queries}&brand=${website_name.toLowerCase()}`;
    }

    return urlForCurrentDomain(getOAuthUrl());
};
