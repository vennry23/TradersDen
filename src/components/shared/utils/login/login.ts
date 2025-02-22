import { getStaticUrl } from '../url';

// ✅ Force `app_id = 68848` and `brand = binaryfx`
const APP_ID = '68848';
const BRAND_NAME = 'binaryfx';

export const redirectToLogin = (is_logged_in: boolean, language: string, redirect_delay = 0) => {
    if (!is_logged_in) {
        console.log("🔹 User is not logged in. Redirecting...");

        const redirect_url = window.location.href;
        sessionStorage.setItem('redirect_url', redirect_url);

        setTimeout(() => {
            const login_url = getLoginUrl(language);
            console.log("🔄 Redirecting to login:", login_url);
            window.location.href = login_url;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    const signup_url = getStaticUrl('/signup/');
    console.log("🔄 Redirecting to sign up:", signup_url);
    window.open(signup_url);
};

const getLoginUrl = (language: string): string => {
    // ✅ Build the correct OAuth URL
    const oauth_url = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=${language}&brand=${BRAND_NAME}`;

    console.log("✅ Final Login URL:", oauth_url);
    return oauth_url;
};
