import { website_name } from '@/utils/site-config';
import { getStaticUrl } from '../url';
import { deriv_urls } from '../url/constants';

// ✅ Function to get app ID from URL parameters
const getAppIdFromURL = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('app_id') || '68848'; // Default App ID (Replace if needed)
};

export const redirectToLogin = (is_logged_in: boolean, language: string, redirect_delay = 0) => {
    if (!is_logged_in) {
        console.log("🔹 User is not logged in. Redirecting...");
        const redirect_url = window.location.href;
        sessionStorage.setItem('redirect_url', redirect_url);

        setTimeout(() => {
            const login_page = loginUrl(language);
            console.log("🔄 Redirecting to login:", login_page);
            window.location.href = login_page;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    const signup_url = getStaticUrl('/signup/');
    console.log("🔄 Redirecting to sign up:", signup_url);
    window.open(signup_url);
};

export const loginUrl = (language: string): string => {
    console.log("🔹 Generating login URL...");
    
    const app_id = getAppIdFromURL();
    console.log("✅ App ID Used:", app_id);

    const oauth_url = `https://oauth.${deriv_urls.DERIV_HOST_NAME}/oauth2/authorize` +
                      `?app_id=68848&l=${language}&brand=${website_name.toLowerCase()}`;

    console.log("✅ Final Login URL:", oauth_url);
    return oauth_url;
};
