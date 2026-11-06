import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';
import apiRoutes from './routes/api';
import { runSeed } from './scripts/seed';
import { Ad } from './models/Ad';
import { initExpiryCron } from './services/expiryCron';
import { generalApiLimiter } from './middleware/rateLimiters';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', generalApiLimiter);

// Robust static folder resolution whether running via tsx in root/backend or node in dist
const findFolder = (folderName: string): string => {
  const candidates = [
    path.join(process.cwd(), folderName),
    path.join(process.cwd(), 'backend', folderName),
    path.join(__dirname, '..', folderName),
    path.join(__dirname, '../..', folderName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.join(process.cwd(), folderName);
};

const adminDistDir = findFolder('admin-dist');
const appPublicDir = findFolder('public');
const uploadsDir = findFolder('uploads');

console.log('[Server Paths] adminDistDir:', adminDistDir, 'exists:', fs.existsSync(adminDistDir));
console.log('[Server Paths] appPublicDir:', appPublicDir, 'exists:', fs.existsSync(appPublicDir));

// Serve uploaded static assets
app.use('/uploads', express.static(uploadsDir));

// Serve Admin Web Panel build
app.use('/admin', express.static(adminDistDir));
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(adminDistDir, 'index.html'));
});
app.get('/admin/{*splat}', (_req, res) => {
  res.sendFile(path.join(adminDistDir, 'index.html'));
});

// Debug endpoint to verify live server filesystem and database type on Render
app.get('/api/debug-paths', async (_req, res) => {
  const { User } = await import('./models/User');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ulist.in').toLowerCase();
  const foundAdmin = await User.findOne({ email: adminEmail });
  const totalUsers = await User.countDocuments();
  const totalAds = await Ad.countDocuments();
  
  res.json({
    cwd: process.cwd(),
    __dirname,
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'none (fallback in-memory)',
    isUsingExternalMongo: !!process.env.MONGODB_URI,
    totalUsers,
    totalAds,
    adminDistDir,
    adminExists: fs.existsSync(adminDistDir),
    adminFiles: fs.existsSync(adminDistDir) ? fs.readdirSync(adminDistDir) : [],
    appPublicDir,
    publicExists: fs.existsSync(appPublicDir),
    publicFiles: fs.existsSync(appPublicDir) ? fs.readdirSync(appPublicDir) : [],
    adminEmail,
    adminInDb: !!foundAdmin,
    adminRole: foundAdmin?.role,
    envAdminPasswordLength: (process.env.ADMIN_PASSWORD || 'AdminUlist#2026').length,
    envAdminEmail: process.env.ADMIN_EMAIL || 'admin@ulist.in',
  });
});

// Serve Main Marketplace Web App directly from backend
app.use(express.static(appPublicDir));

// API version 1 routing
app.use('/api/v1', apiRoutes);

// Static compliance pages for Google Play Store requirements
app.get('/privacy', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ULIST – BY WISHCRAFT | PRIVACY POLICY</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 840px; margin: 30px auto; line-height: 1.7; padding: 0 20px; color: #1f2937; }
        .header { border-bottom: 2px solid #D9480F; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 14px; font-weight: 800; color: #D9480F; letter-spacing: 1.5px; }
        h1 { font-size: 26px; font-weight: 800; color: #111827; margin: 6px 0; }
        .meta { font-size: 13px; color: #6b7280; font-weight: 500; }
        h2 { font-size: 17px; font-weight: 700; color: #0F2942; margin-top: 28px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        h3 { font-size: 15px; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 4px; }
        p { font-size: 14px; margin: 8px 0; color: #374151; }
        ul { margin: 6px 0 12px 20px; padding: 0; }
        li { font-size: 14px; color: #4b5563; margin-bottom: 4px; }
        .highlight { font-weight: 700; color: #D9480F; }
        .bold { font-weight: 700; }
        .contact-box { background: #f8fafc; border-left: 4px solid #0F2942; padding: 14px 18px; border-radius: 6px; margin-top: 12px; }
        .disclaimer-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 20px; margin-top: 36px; }
        .disclaimer-title { font-size: 17px; font-weight: 800; color: #b45309; margin-bottom: 4px; }
        .disclaimer-sub { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 14px; }
        .disclaimer-box ol { margin: 0 0 14px 20px; padding: 0; }
        .disclaimer-box li { font-size: 13px; color: #78350f; line-height: 1.6; margin-bottom: 8px; }
        .ack { font-size: 13px; font-weight: 700; color: #92400e; border-top: 1px solid #fde68a; padding-top: 12px; margin-top: 12px; }
        .footer-brand { text-align: center; margin-top: 24px; padding-top: 14px; }
        .footer-brand h4 { margin: 0; font-size: 16px; color: #0F2942; font-weight: 800; }
        .footer-brand p { margin: 4px 0 0; font-size: 14px; color: #D9480F; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">ULIST – BY WISHCRAFT</div>
        <h1>PRIVACY POLICY</h1>
        <div class="meta"><strong>Effective Date:</strong> 2 November 2026 | <strong>Last Updated:</strong> 2 November 2026</div>
      </div>

      <h2>1. INTRODUCTION</h2>
      <p>Welcome to ULIST, a digital classifieds and marketplace platform operated under the brand name <strong>ULIST – by WishCraft</strong> ("ULIST", "we", "our" or "us").</p>
      <p>ULIST provides an online platform that enables independent individuals, sellers, buyers and businesses to post advertisements, list products, discover available products and connect with one another for potential transactions.</p>
      <p>Our objective is to provide a platform where people can list their old, unused, pre-owned, surplus or extra products and connect with others who may be interested in purchasing them.</p>
      <p>By accessing or using our website, mobile application or services, you agree to the practices described in this Privacy Policy.</p>

      <h2>2. INDEPENDENT ADVERTISEMENTS AND SELLERS</h2>
      <p class="highlight">ULIST IS A LISTING AND CONNECTING PLATFORM.</p>
      <p>All advertisements, product listings, descriptions, photographs, videos, prices and other information posted by users are independently submitted by individual advertisers, sellers or third parties.</p>
      <p>ULIST does not own, manufacture, stock, sell, inspect, verify, certify or directly offer the products advertised by independent users.</p>
      <p><strong>The advertiser or seller is solely responsible for:</strong></p>
      <ul>
        <li>The accuracy and authenticity of the advertisement.</li>
        <li>Ownership and legal right to sell the advertised product.</li>
        <li>Product quality, condition, functionality and safety.</li>
        <li>Pricing, availability and product descriptions.</li>
        <li>Authenticity of photographs, documents and other information.</li>
        <li>Compliance with applicable laws and regulations.</li>
        <li>All communications, negotiations, payments, deliveries and transactions with buyers.</li>
      </ul>
      <p>ULIST does not guarantee the accuracy, quality, genuineness, legality or availability of independently posted advertisements.</p>
      <p class="bold">ULIST shall not be a party to any transaction between buyers and independent advertisers. Any transaction entered into between users is at their own discretion and risk, subject to applicable law.</p>

      <h2>3. INFORMATION WE COLLECT</h2>
      <p>To provide and improve our services, ULIST may collect the following information:</p>
      <h3>A. Personal Information</h3>
      <ul>
        <li>Name and username.</li>
        <li>Mobile number and email address.</li>
        <li>Account registration information.</li>
        <li>City, locality and approximate location, where provided.</li>
        <li>Profile information.</li>
      </ul>
      <h3>B. Advertisement Information</h3>
      <ul>
        <li>Product photographs and videos.</li>
        <li>Product descriptions and specifications.</li>
        <li>Advertised prices.</li>
        <li>Product category and location.</li>
        <li>Contact details voluntarily included in advertisements.</li>
      </ul>
      <h3>C. Technical Information</h3>
      <ul>
        <li>IP address.</li>
        <li>Device type and operating system.</li>
        <li>Browser information.</li>
        <li>Application usage and activity.</li>
        <li>Cookies and similar technologies, where applicable.</li>
      </ul>

      <h2>4. HOW WE USE YOUR INFORMATION</h2>
      <p>ULIST may use collected information to:</p>
      <ul>
        <li>Register and manage user accounts.</li>
        <li>Enable users to post and manage advertisements.</li>
        <li>Connect interested buyers and independent sellers.</li>
        <li>Display advertisements and product listings.</li>
        <li>Improve platform performance and user experience.</li>
        <li>Send account-related notifications and service updates.</li>
        <li>Prevent fraudulent, misleading or prohibited activities.</li>
        <li>Respond to complaints, inquiries and legal requests.</li>
        <li>Maintain platform security and comply with applicable laws.</li>
      </ul>

      <h2>5. USER CONSENT AND RESPONSIBILITY</h2>
      <p>By registering on ULIST or posting an advertisement, users confirm that:</p>
      <ul>
        <li>They have the legal right to provide the information submitted.</li>
        <li>They have permission to upload photographs, videos and other content.</li>
        <li>Their advertisements do not knowingly contain false, misleading, unlawful or prohibited information.</li>
        <li>They understand that information posted publicly may be viewed, accessed or shared by other users.</li>
        <li>They are responsible for protecting their account credentials and personal information.</li>
      </ul>
      <p>Users should avoid publishing sensitive personal information, financial details, passwords or confidential documents in public advertisements.</p>

      <h2>6. SHARING OF INFORMATION</h2>
      <p>ULIST does not sell users' personal information as a standalone commercial product.</p>
      <p>However, information may be shared in the following circumstances:</p>
      <ul>
        <li>With other users when necessary to facilitate platform interactions.</li>
        <li>With technology, hosting, analytics and service providers assisting ULIST.</li>
        <li>With payment service providers, if payment facilities are introduced.</li>
        <li>With law enforcement authorities or government agencies when legally required.</li>
        <li>To protect the rights, safety, security and legitimate interests of ULIST and its users.</li>
      </ul>
      <p>Advertisers should understand that information voluntarily included in public advertisements may be accessible to other users.</p>

      <h2>7. THIRD-PARTY SERVICES AND LINKS</h2>
      <p>ULIST may contain links to third-party websites, applications, payment services or communication platforms. Such services operate independently and are governed by their own privacy policies and terms.</p>
      <p>ULIST does not control or assume responsibility for the privacy practices, security measures or content of independent third-party services. Users are advised to review the applicable policies before sharing personal information with such services.</p>

      <h2>8. COOKIES AND TRACKING TECHNOLOGIES</h2>
      <p>ULIST may use cookies and similar technologies to maintain user sessions, remember user preferences, understand platform usage, improve website and application functionality, and analyse traffic and performance.</p>
      <p>Users may manage cookies through their browser or device settings, subject to the functionality of the platform.</p>

      <h2>9. DATA SECURITY AND RETENTION</h2>
      <p>ULIST takes reasonable technical and organisational measures to protect information under its control against unauthorised access, misuse, alteration, disclosure or loss.</p>
      <p>However, no internet-based platform can guarantee absolute security. Information will be retained for as long as reasonably necessary for the purposes described in this policy, or as required under applicable laws.</p>

      <h2>10. USER RIGHTS AND DATA DELETION</h2>
      <p>Subject to applicable law, users may request:</p>
      <ul>
        <li>Access to their personal information.</li>
        <li>Correction of inaccurate information.</li>
        <li>Updating of account details.</li>
        <li>Deletion of their account and personal information, where legally permissible.</li>
        <li>Withdrawal of consent for applicable data processing.</li>
        <li>Assistance with privacy-related grievances.</li>
      </ul>
      <p>Certain information may need to be retained to comply with legal obligations, resolve disputes, prevent fraud or protect legitimate interests.</p>

      <h2>11. CHILDREN'S PRIVACY</h2>
      <p>ULIST is not intended to be used by children in violation of applicable laws. Users must meet the minimum age and legal capacity requirements applicable to their use of the platform.</p>

      <h2>12. CHANGES TO THIS PRIVACY POLICY</h2>
      <p>ULIST reserves the right to modify or update this Privacy Policy from time to time. Any revised version will be published on the ULIST website or application with an updated effective date.</p>
      <p>Continued use of the platform following publication of changes will be subject to the revised policy, to the extent permitted by applicable law.</p>

      <h2>13. GRIEVANCES AND CONTACT INFORMATION</h2>
      <p>For privacy-related questions, complaints, account-related concerns or requests concerning personal information, users may contact:</p>
      <div class="contact-box">
        <strong>ULIST – by WishCraft</strong><br>
        Website: <a href="https://u-list-app.vercel.app">https://u-list-app.vercel.app</a><br>
        Email: <a href="mailto:support@ulist.in">support@ulist.in</a><br>
        Platform: Digital Intermediary Classifieds & Marketplace
      </div>

      <div class="disclaimer-box">
        <div class="disclaimer-title">IMPORTANT USER NOTICE</div>
        <div class="disclaimer-sub">INDEPENDENT ADVERTISEMENT DISCLAIMER</div>
        <ol>
          <li>ULIST is an intermediary listing and discovery platform that enables independent users to publish advertisements and connect with potential buyers.</li>
          <li>All advertisements are created and published by independent advertisers. ULIST does not act as the owner, seller, broker, manufacturer, agent or representative of the products advertised.</li>
          <li>ULIST does not independently guarantee the identity of advertisers, product ownership, product authenticity, condition, quality, safety, pricing or availability.</li>
          <li>ULIST does not guarantee, endorse or recommend any independent advertisement, advertiser, buyer or seller merely because their content appears on the platform.</li>
          <li>ULIST is not responsible for private negotiations, agreements, payments, deposits, deliveries, refunds, warranties, returns, cancellations or disputes arising directly between users, except to the extent any responsibility is imposed on ULIST by applicable law.</li>
          <li>Users are strongly advised to independently verify the seller, product, ownership documents, product condition and transaction details before making any payment or commitment.</li>
          <li>Users should avoid advance payments to unknown individuals and exercise caution when sharing financial or personal information.</li>
          <li>Advertisers are solely responsible for ensuring that their advertisements and products comply with applicable laws. Prohibited, counterfeit, stolen, misleading or unlawful listings are not permitted.</li>
          <li>ULIST reserves the right, subject to applicable law, to review, restrict, suspend or remove advertisements or accounts that violate its policies or applicable legal requirements.</li>
          <li>Nothing in this policy excludes or limits any liability or obligation that cannot legally be excluded or limited under applicable law.</li>
        </ol>
        <div class="ack">
          BY USING ULIST, USERS ACKNOWLEDGE THAT INDEPENDENT ADVERTISEMENTS ARE POSTED BY THIRD PARTIES AND THAT TRANSACTIONS ARE UNDERTAKEN AT THE USERS' OWN DISCRETION AND RISK.
        </div>
        <div class="footer-brand">
          <h4>ULIST – BY WISHCRAFT</h4>
          <p>List It. Sell It. Cash It!</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/terms', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ULIST – BY WISHCRAFT | TERMS OF SERVICE & CONDITIONS OF USE</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 840px; margin: 30px auto; line-height: 1.7; padding: 0 20px; color: #1f2937; }
        .header { border-bottom: 2px solid #D9480F; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 14px; font-weight: 800; color: #D9480F; letter-spacing: 1.5px; }
        h1 { font-size: 26px; font-weight: 800; color: #111827; margin: 6px 0; }
        .meta { font-size: 13px; color: #6b7280; font-weight: 500; }
        h2 { font-size: 17px; font-weight: 700; color: #0F2942; margin-top: 28px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
        h3 { font-size: 15px; font-weight: 600; color: #374151; margin-top: 14px; margin-bottom: 4px; }
        p { font-size: 14px; margin: 8px 0; color: #374151; }
        ul { margin: 6px 0 12px 20px; padding: 0; }
        li { font-size: 14px; color: #4b5563; margin-bottom: 4px; }
        .highlight { font-weight: 700; color: #D9480F; }
        .bold { font-weight: 700; }
        .contact-box { background: #f8fafc; border-left: 4px solid #0F2942; padding: 14px 18px; border-radius: 6px; margin-top: 12px; }
        .disclaimer-box { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 8px; padding: 20px; margin-top: 36px; }
        .disclaimer-title { font-size: 17px; font-weight: 800; color: #b45309; margin-bottom: 6px; }
        .disclaimer-box ol { margin: 0 0 14px 20px; padding: 0; }
        .disclaimer-box li { font-size: 13px; color: #78350f; line-height: 1.6; margin-bottom: 8px; }
        .footer-brand { text-align: center; margin-top: 24px; padding-top: 14px; border-top: 1px solid #fde68a; }
        .footer-brand h4 { margin: 0; font-size: 16px; color: #0F2942; font-weight: 800; }
        .footer-brand p { margin: 4px 0 0; font-size: 14px; color: #D9480F; font-weight: 700; }
        .footer-brand small { display: block; font-size: 12px; color: #6b7280; font-style: italic; margin-top: 2px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">ULIST – BY WISHCRAFT</div>
        <h1>TERMS OF SERVICE & CONDITIONS OF USE</h1>
        <div class="meta"><strong>Effective Date:</strong> 2 November 2026 | <strong>Last Updated:</strong> 2 November 2026</div>
      </div>

      <h2>1. ABOUT ULIST</h2>
      <p>ULIST is a digital classified advertisements and product-listing platform operated under the brand name <strong>ULIST – by WishCraft</strong> ("ULIST", "we", "our" or "us").</p>
      <p>ULIST provides an online platform where independent individuals, sellers, buyers and businesses can list, discover, advertise, buy, sell and connect regarding new, used, pre-owned, old, unused, surplus or extra products.</p>
      <p>ULIST primarily acts as a platform facilitating connections between independent advertisers and interested buyers.</p>
      <p class="highlight">ULIST IS NOT THE OWNER, SELLER, MANUFACTURER, DISTRIBUTOR, BROKER OR GUARANTOR OF PRODUCTS LISTED BY INDEPENDENT USERS.</p>
      <p>By accessing, registering or using ULIST, you acknowledge that you have read, understood and agreed to these Terms of Service.</p>

      <h2>2. ACCEPTANCE OF TERMS</h2>
      <p>By using ULIST, you agree:</p>
      <ul>
        <li>To comply with these Terms of Service.</li>
        <li>To provide accurate information during registration.</li>
        <li>To use the platform only for lawful purposes.</li>
        <li>To respect the rights of other users.</li>
        <li>Not to misuse the platform for fraudulent or misleading activities.</li>
        <li>To comply with all applicable Indian laws and regulations.</li>
      </ul>
      <p>If you do not agree with these terms, you must discontinue using ULIST.</p>

      <h2>3. ROLE OF ULIST – A PLATFORM FOR INDEPENDENT ADVERTISEMENTS</h2>
      <p>ULIST provides a digital space where independent individuals and businesses can publish product advertisements and connect with potential buyers.</p>
      <p>All advertisements are independently created and submitted by users.</p>
      <p><strong>ULIST does not:</strong></p>
      <ul>
        <li>Own or possess the products advertised.</li>
        <li>Purchase or resell products listed by users.</li>
        <li>Guarantee the identity or credibility of every advertiser.</li>
        <li>Independently verify ownership of every advertised product.</li>
        <li>Guarantee product quality, condition, authenticity or functionality.</li>
        <li>Guarantee advertised prices or product availability.</li>
        <li>Participate in negotiations between buyers and sellers.</li>
        <li>Guarantee the successful completion of any transaction.</li>
        <li>Provide warranties or after-sales services for independently advertised products.</li>
      </ul>
      <p>The appearance of an advertisement on ULIST does not mean that ULIST has inspected, approved, certified or endorsed the product or advertiser.</p>

      <h2>4. INDEPENDENT ADVERTISER RESPONSIBILITIES</h2>
      <p>Every individual or business posting an advertisement on ULIST is solely responsible for the advertisement and the product being offered.</p>
      <p><strong>Advertisers must ensure that:</strong></p>
      <ol>
        <li>They have the legal right and authority to advertise and sell the product.</li>
        <li>Product descriptions are accurate and not misleading.</li>
        <li>Photographs and videos genuinely represent the advertised product.</li>
        <li>The stated price and product availability are accurate.</li>
        <li>Products are not stolen, counterfeit, prohibited or unlawfully obtained.</li>
        <li>Advertisements comply with applicable laws.</li>
        <li>They do not misuse another person's personal information, photographs or intellectual property.</li>
      </ol>
      <p>Advertisers shall be responsible for any claims, disputes, losses or legal proceedings arising from their advertisements or transactions. ULIST reserves the right to remove, restrict or suspend advertisements that violate its policies or applicable law.</p>

      <h2>5. BUYER RESPONSIBILITIES</h2>
      <p>Buyers using ULIST must exercise independent judgment and conduct appropriate checks before entering into any transaction.</p>
      <p><strong>Buyers are advised to:</strong></p>
      <ul>
        <li>Verify the seller's identity and contact information.</li>
        <li>Personally inspect products wherever practical.</li>
        <li>Check product condition, authenticity and ownership.</li>
        <li>Verify all product specifications and descriptions.</li>
        <li>Agree on the final price and payment terms directly with the seller.</li>
        <li>Obtain appropriate proof of payment and transaction documentation.</li>
        <li>Avoid sharing OTPs, passwords, banking credentials or confidential information.</li>
        <li>Avoid making advance payments to unknown individuals without appropriate verification.</li>
      </ul>
      <p>Buyers acknowledge that any purchase or transaction with an independent advertiser is undertaken at their own discretion and risk.</p>

      <h2>6. TRANSACTIONS BETWEEN BUYERS AND SELLERS</h2>
      <p>All negotiations, agreements, payments, product inspections, collections, deliveries and other transaction-related arrangements are strictly between the buyer and the independent advertiser.</p>
      <p>ULIST is not a party to such transactions. Unless expressly introduced as a separate service with applicable terms, ULIST does not collect purchase money, act as an escrow, guarantee delivery, process refunds, or resolve private commercial disputes.</p>

      <h2>7. PROHIBITED ADVERTISEMENTS AND ACTIVITIES</h2>
      <p>Users shall not publish advertisements or engage in activities involving:</p>
      <ul>
        <li>Stolen or unlawfully obtained goods.</li>
        <li>Counterfeit or imitation products represented as genuine.</li>
        <li>Illegal or prohibited products, weapons, or explosives.</li>
        <li>Narcotics or prohibited substances.</li>
        <li>Fraudulent schemes or misleading offers.</li>
        <li>Fake advertisements or impersonation.</li>
        <li>Products infringing intellectual property rights.</li>
        <li>Obscene, defamatory, threatening or unlawful content.</li>
        <li>Any product or service prohibited under applicable Indian laws.</li>
      </ul>

      <h2>8. USER ACCOUNTS AND SECURITY</h2>
      <p>Users are responsible for maintaining the confidentiality of their login credentials. Users must provide accurate registration details, protect accounts, and promptly notify ULIST of any unauthorised access.</p>

      <h2>9. ADVERTISEMENT APPROVAL AND REMOVAL</h2>
      <p>ULIST reserves the right to moderate the platform, remove prohibited advertisements, restrict misleading listings, and suspend accounts that repeatedly violate platform policies.</p>

      <h2>10. FEES, PAID LISTINGS AND PROMOTIONAL SERVICES</h2>
      <p>ULIST may introduce free and paid advertisement services, premium listings, featured advertisements, promotional packages or subscription-based services. Promotional visibility does not constitute product verification or endorsement.</p>

      <h2>11. INTELLECTUAL PROPERTY RIGHTS</h2>
      <p>The ULIST name, logo, branding, website design, and application interface are owned by or licensed to ULIST and/or WishCraft. Users may not copy or exploit these materials without prior written permission.</p>

      <h2>12. THIRD-PARTY LINKS AND SERVICES</h2>
      <p>ULIST may provide links to independent third-party services. ULIST is not responsible for the content, security, or practices of third-party platforms.</p>

      <h2>13. LIMITATION OF LIABILITY</h2>
      <p>To the maximum extent permitted by applicable law, ULIST, WishCraft and their respective personnel shall not be liable for losses, claims, damages or disputes arising from independent advertisements, defective products, buyer-seller disputes, or non-delivery.</p>
      <p class="highlight">ULIST PROVIDES A PLATFORM FOR INDEPENDENT LISTINGS AND CONNECTIONS. IT DOES NOT GUARANTEE THE PERFORMANCE, CONDUCT OR TRANSACTIONAL COMMITMENTS OF INDEPENDENT USERS.</p>

      <h2>14. INDEMNIFICATION</h2>
      <p>Users agree to indemnify and hold harmless ULIST, WishCraft and their respective personnel against third-party claims, losses, damages and reasonable legal expenses arising from their unlawful advertisements, fraudulent transactions, or breach of these Terms.</p>

      <h2>15. SUSPENSION AND TERMINATION</h2>
      <p>ULIST reserves the right, subject to applicable law, to suspend or terminate user accounts and remove advertisements that violate policies.</p>

      <h2>16. PLATFORM AVAILABILITY</h2>
      <p>ULIST endeavours to maintain reliable platform services, though continuous and uninterrupted availability cannot be guaranteed.</p>

      <h2>17. PRIVACY AND PERSONAL INFORMATION</h2>
      <p>The collection, use, and processing of personal information are governed by the ULIST Privacy Policy in accordance with relevant Indian data protection laws.</p>

      <h2>18. GRIEVANCE REDRESSAL AND COMPLAINTS</h2>
      <p>Complaints and policy violations may be reported to:</p>
      <div class="contact-box">
        <strong>ULIST – by WishCraft</strong><br>
        Website: <a href="https://u-list-app.vercel.app">https://u-list-app.vercel.app</a><br>
        Email: <a href="mailto:support@ulist.in">support@ulist.in</a><br>
        Platform: Digital Intermediary Classifieds & Marketplace
      </div>

      <h2>19. GOVERNING LAW AND JURISDICTION</h2>
      <p>These Terms of Service shall be governed by the laws of India.</p>

      <h2>20. CHANGES TO THESE TERMS</h2>
      <p>ULIST reserves the right to revise or update these Terms from time to time. Continued use of ULIST following updates constitutes acceptance.</p>

      <h2>21. SEVERABILITY & 22. ENTIRE AGREEMENT</h2>
      <p>If any provision is held unenforceable, the remaining provisions remain valid. These Terms, together with the Privacy Policy and Disclaimer, constitute the entire agreement.</p>

      <div class="disclaimer-box">
        <div class="disclaimer-title">FINAL USER ACKNOWLEDGEMENT</div>
        <p>By registering, accessing or using ULIST, you acknowledge and agree that:</p>
        <ol>
          <li>ULIST is a platform for independent advertisements and product listings.</li>
          <li>Advertisements are posted by independent individuals and businesses.</li>
          <li>Advertisers are responsible for the accuracy, legality and authenticity of their listings.</li>
          <li>Buyers and sellers are responsible for independently verifying products and transaction details.</li>
          <li>ULIST does not guarantee the quality, authenticity, ownership, availability or delivery of independently advertised products.</li>
          <li>Transactions between buyers and sellers are conducted at their own discretion and risk.</li>
          <li>Users must comply with these Terms of Service and applicable laws.</li>
        </ol>
        <div class="footer-brand">
          <h4>ULIST – BY WISHCRAFT</h4>
          <p>List It. Sell It. Cash It!</p>
          <small>Your Unused Things. Someone's Next Favourite Find.</small>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/about', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>About Us | Ulist - BY WISHCRAFT</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.7; padding: 0 20px; color: #1b1b1b; }
        .hero { text-align: center; margin-bottom: 30px; }
        h1 { color: #D9480F; margin-bottom: 4px; font-size: 32px; font-weight: 900; }
        .badge { display: inline-block; background: #FAF5F2; border: 1px solid #FED7AA; color: #D9480F; padding: 3px 12px; border-radius: 20px; font-weight: 800; font-size: 12px; letter-spacing: 1px; }
        .tagline { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 14px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .philosophy-box { background: #FFF7ED; border: 1.5px solid #FDBA74; padding: 22px; margin: 24px 0; border-radius: 8px; text-align: center; }
        .philosophy-box h2 { color: #9A3412; margin-top: 0; font-size: 22px; }
        .pills { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
        .pill { background: #fff; border: 1px solid #FED7AA; padding: 6px 14px; border-radius: 20px; font-weight: 600; color: #7C2D12; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="hero">
        <h1>Ulist</h1>
        <div class="badge">BY WISHCRAFT</div>
        <p class="tagline">Don't Let Unused Things Lose Their Value. Turn Them Into Cash!</p>
      </div>

      <div class="card">
        <p>Every home, office and business has something lying unused — an old mobile phone, furniture, electronics, appliances, clothing, accessories, collectibles or simply something we no longer need.</p>
        <p>These products may be unused, extra, pre-owned or just taking up valuable space. But what is no longer useful to one person could be exactly what someone else is looking for.</p>
        <p><strong>That's where ULIST comes in!</strong></p>
        <p><strong>ULIST</strong>, an app by <strong>WishCraft</strong>, was born from a simple yet powerful idea: to help people give their unused and extra belongings a second life while unlocking the value hidden in them.</p>
        <p>We believe that one person's unused product can become another person's valuable find.</p>
        <p>Through ULIST, we aim to make it easier for individuals, families and businesses to list, discover, buy, sell and trade products. Instead of letting things gather dust, why not turn them into extra cash?</p>
      </div>

      <div class="card">
        <h3>Our Vision</h3>
        <p>Our vision goes beyond buying and selling. We want to encourage smarter consumption, reduce unnecessary waste, promote reuse and create a community where products find new owners and value gets a second chance.</p>
        <p>Whether you are decluttering your home, upgrading your gadgets, clearing excess inventory or simply looking to make some extra money, ULIST gives you an opportunity to make it happen.</p>
      </div>

      <div class="philosophy-box">
        <p style="font-size: 12px; font-weight: 800; color: #EA580C; letter-spacing: 1.5px; margin: 0;">OUR PHILOSOPHY</p>
        <h2>List It. Sell It. Cash It!</h2>
        <div class="pills">
          <span class="pill">❌ Don't store it</span>
          <span class="pill">❌ Don't waste it</span>
          <span class="pill">❌ Don't let it sit unused</span>
        </div>
        <p style="font-weight: 700; color: #1E293B; font-style: italic; margin-bottom: 0;">Give it a new owner, a new purpose and a new beginning.</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/delete-account', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Ulist - Account & Data Deletion</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;color:#1b1b1b;}</style></head>
    <body>
      <h1>Request Account and Data Deletion</h1>
      <p>If you wish to remove your Ulist account and all associated classified listings and media from our servers, you can:</p>
      <ol>
        <li>Open the <strong>Ulist Mobile App</strong> -> navigate to <strong>Account</strong> -> tap <strong>Delete Account</strong>.</li>
        <li>Or email us directly from your registered email address at <a href="mailto:support@ulist.in">support@ulist.in</a> with the subject "Delete Account". All records will be cleared within 48 hours.</li>
      </ol>
    </body>
    </html>
  `);
});

// Short link redirect: /ad/:id or /a/:id -> opens listing on Web or deep-links
app.get(['/ad/:id', '/a/:id'], async (req, res) => {
  try {
    const adId = req.params.id;
    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      return res.redirect('/');
    }
    const safeTitle = (ad.title || 'Ulist Listing').replace(/"/g, '&quot;');
    const safePrice = ad.price ? `₹${ad.price.toLocaleString('en-IN')}` : '';
    const safeDesc = (ad.description || `View ${safeTitle} on Ulist`).slice(0, 150).replace(/"/g, '&quot;');
    const safeImage = ad.images?.[0]?.url || 'https://u-list-api.onrender.com/assets/icon.png';
    const targetUrl = `https://u-list-app.vercel.app/?adId=${adId}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle} ${safePrice ? `- ${safePrice}` : ''} | Ulist</title>
        <meta name="description" content="${safeDesc}">
        <meta property="og:title" content="${safeTitle} ${safePrice ? `for ${safePrice}` : ''}">
        <meta property="og:description" content="${safeDesc}">
        <meta property="og:image" content="${safeImage}">
        <meta property="og:url" content="${targetUrl}">
        <meta property="og:type" content="product">
        <meta name="twitter:card" content="summary_large_image">
        <script>
          window.location.replace("${targetUrl}");
        </script>
      </head>
      <body>
        <p>Redirecting to listing... <a href="${targetUrl}">Click here if not redirected</a>.</p>
      </body>
      </html>
    `);
  } catch (e) {
    res.redirect('/');
  }
});

// Fallback for single page app routing in Express 5
app.get('/{*splat}', (_req, res) => {
  const indexHtml = path.join(appPublicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(404).send('Not Found');
  }
});

// Socket.io for Realtime Chat
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(`user_${userId}`);
  }

  socket.on('join_conversation', (convId) => {
    socket.join(`conv_${convId}`);
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

export { io };

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  
  // Initialize ad expiry cron scheduler
  initExpiryCron();
  
  // Ensure Admin user always exists with current credentials on startup
  const bcryptMod = await import('bcrypt');
  const bcryptFn = (bcryptMod as any).default || bcryptMod;
  const { User } = await import('./models/User');
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ulist.in').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminUlist#2026';
  
  let admin = await User.findOne({ email: adminEmail });
  const passwordHash = await bcryptFn.hash(adminPassword, 10);
  if (!admin) {
    await User.create({
      name: 'Ulist Administrator',
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '+919876543210',
      passwordHash,
      role: 'admin',
      status: 'active',
    });
    console.log('[Bootstrap] Admin user initialized:', adminEmail);
  } else {
    admin.passwordHash = passwordHash;
    admin.role = 'admin';
    admin.status = 'active';
    await admin.save();
    console.log('[Bootstrap] Admin password synced for:', adminEmail);
  }

  // Check if categories or baseline sample ads (4 per category = 48 total) are needed
  const { Category } = await import('./models/Category');
  const catCount = await Category.countDocuments();
  const adCount = await Ad.countDocuments({ status: { $ne: 'deleted' } });
  if (catCount === 0 || adCount < 48) {
    console.log('[Bootstrap] Initializing categories & 4 sample ads per category...');
    await runSeed();
  }

  server.listen(PORT, () => {
    console.log(`[Ulist Backend] Server listening on http://localhost:${PORT}`);
    console.log(`[Ulist Backend] Health check: http://localhost:${PORT}/api/v1/categories`);
  });
}

startServer().catch((err) => {
  console.error('[Ulist Backend] Initialization failed:', err);
});
