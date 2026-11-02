export type LanguageCode = 'en' | 'hi';

export interface Translations {
  // Navigation & Tabs
  home: string;
  chats: string;
  sell: string;
  myAds: string;
  account: string;

  // Header & Search
  tagline: string;
  searchPlaceholder: string;
  recentSearches: string;
  clear: string;
  browseCategories: string;
  freshRecommendations: string;
  wantBetterRecommendations: string;
  turnOnLocation: string;
  detecting: string;

  // Account Screen
  welcomeToUlist: string;
  loginSubtitle: string;
  loginRegister: string;
  favourites: string;
  helpAndSupport: string;
  inviteFriends: string;
  inviteSubtitle: string;
  selectLanguage: string;
  privacyPolicy: string;
  termsOfService: string;
  aboutUs: string;
  logOut: string;
  deleteAccount: string;

  // Language Screen
  chooseLanguage: string;
  continueBtn: string;
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    home: 'Home',
    chats: 'Chats',
    sell: 'Sell',
    myAds: 'My Ads',
    account: 'Account',

    tagline: 'List It. Sell It. Cash It!',
    searchPlaceholder: 'Find Cars, Mobile Phones and more...',
    recentSearches: 'RECENT SEARCHES',
    clear: 'Clear',
    browseCategories: 'Browse Categories',
    freshRecommendations: 'Fresh recommendations',
    wantBetterRecommendations: "Want better recommendations? Turn on your location & we'll show ads nearby.",
    turnOnLocation: 'Turn on location',
    detecting: 'Detecting...',

    welcomeToUlist: 'Welcome to Ulist',
    loginSubtitle: 'Log in to manage ads and chat',
    loginRegister: 'Log In / Register',
    favourites: 'Favourites',
    helpAndSupport: 'Help & Support',
    inviteFriends: 'Invite friends to Ulist',
    inviteSubtitle: 'Invite your friends to buy and sell',
    selectLanguage: 'Select Language',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    aboutUs: 'About Us',
    logOut: 'Log Out',
    deleteAccount: 'Delete Account',

    chooseLanguage: 'भाषा चुनें / SELECT LANGUAGE',
    continueBtn: 'आगे बढ़ें / CONTINUE',
  },
  hi: {
    home: 'होम',
    chats: 'चैट्स',
    sell: 'बेचें',
    myAds: 'मेरे विज्ञापन',
    account: 'खाता',

    tagline: 'List It. Sell It. Cash It!',
    searchPlaceholder: 'गाड़ियाँ, मोबाइल फोन और अन्य खोजें...',
    recentSearches: 'हाल की खोजें',
    clear: 'साफ़ करें',
    browseCategories: 'श्रेणियाँ ब्राउज़ करें',
    freshRecommendations: 'ताज़ा सिफ़ारिशें',
    wantBetterRecommendations: 'बेहतर सुझाव चाहिए? लोकेशन चालू करें और आस-पास के विज्ञापन देखें।',
    turnOnLocation: 'लोकेशन चालू करें',
    detecting: 'पता लगाया जा रहा है...',

    welcomeToUlist: 'यू-लिस्ट में आपका स्वागत है',
    loginSubtitle: 'विज्ञापन प्रबंधित करने और चैट के लिए लॉगिन करें',
    loginRegister: 'लॉग इन / रजिस्टर',
    favourites: 'पसंदीदा',
    helpAndSupport: 'सहायता एवं संपर्क',
    inviteFriends: 'दोस्तों को यू-लिस्ट पर आमंत्रित करें',
    inviteSubtitle: 'खरीदने और बेचने के लिए दोस्तों को जोड़ें',
    selectLanguage: 'भाषा चुनें',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
    aboutUs: 'हमारे बारे में',
    logOut: 'लॉग आउट',
    deleteAccount: 'खाता हटाएं',

    chooseLanguage: 'भाषा चुनें / SELECT LANGUAGE',
    continueBtn: 'आगे बढ़ें / CONTINUE',
  },
};
