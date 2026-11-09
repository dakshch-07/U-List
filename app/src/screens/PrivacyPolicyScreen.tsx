import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>ULIST – BY WISHCRAFT</Text>
        <Text style={styles.mainTitle}>PRIVACY POLICY</Text>
        <Text style={styles.dates}>Effective Date: 2 November 2026 | Last Updated: 2 November 2026</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>1. INTRODUCTION</Text>
        <Text style={styles.paragraph}>
          Welcome to ULIST, a digital classifieds and marketplace platform operated under the brand name <Text style={styles.bold}>ULIST – by WishCraft</Text> ("ULIST", "we", "our" or "us").
        </Text>
        <Text style={styles.paragraph}>
          ULIST provides an online platform that enables independent individuals, sellers, buyers and businesses to post advertisements, list products, discover available products and connect with one another for potential transactions.
        </Text>
        <Text style={styles.paragraph}>
          Our objective is to provide a platform where people can list their old, unused, pre-owned, surplus or extra products and connect with others who may be interested in purchasing them.
        </Text>
        <Text style={styles.paragraph}>
          By accessing or using our website, mobile application or services, you agree to the practices described in this Privacy Policy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>2. INDEPENDENT ADVERTISEMENTS AND SELLERS</Text>
        <Text style={[styles.paragraph, styles.highlight]}>
          ULIST IS A LISTING AND CONNECTING PLATFORM.
        </Text>
        <Text style={styles.paragraph}>
          All advertisements, product listings, descriptions, photographs, videos, prices and other information posted by users are independently submitted by individual advertisers, sellers or third parties.
        </Text>
        <Text style={styles.paragraph}>
          ULIST does not own, manufacture, stock, sell, inspect, verify, certify or directly offer the products advertised by independent users.
        </Text>
        <Text style={styles.subHeading}>The advertiser or seller is solely responsible for:</Text>
        <Text style={styles.bullet}>• The accuracy and authenticity of the advertisement.</Text>
        <Text style={styles.bullet}>• Ownership and legal right to sell the advertised product.</Text>
        <Text style={styles.bullet}>• Product quality, condition, functionality and safety.</Text>
        <Text style={styles.bullet}>• Pricing, availability and product descriptions.</Text>
        <Text style={styles.bullet}>• Authenticity of photographs, documents and other information.</Text>
        <Text style={styles.bullet}>• Compliance with applicable laws and regulations.</Text>
        <Text style={styles.bullet}>• All communications, negotiations, payments, deliveries and transactions with buyers.</Text>
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          ULIST does not guarantee the accuracy, quality, genuineness, legality or availability of independently posted advertisements.
        </Text>
        <Text style={[styles.paragraph, styles.bold]}>
          ULIST shall not be a party to any transaction between buyers and independent advertisers. Any transaction entered into between users is at their own discretion and risk, subject to applicable law.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>3. INFORMATION WE COLLECT</Text>
        <Text style={styles.paragraph}>
          To provide and improve our services, ULIST may collect the following information:
        </Text>
        
        <Text style={styles.subHeading}>A. Personal Information</Text>
        <Text style={styles.bullet}>• Name and username.</Text>
        <Text style={styles.bullet}>• Mobile number and email address.</Text>
        <Text style={styles.bullet}>• Account registration information.</Text>
        <Text style={styles.bullet}>• City, locality and approximate location, where provided.</Text>
        <Text style={styles.bullet}>• Profile information.</Text>

        <Text style={[styles.subHeading, { marginTop: 10 }]}>B. Advertisement Information</Text>
        <Text style={styles.bullet}>• Product photographs and videos.</Text>
        <Text style={styles.bullet}>• Product descriptions and specifications.</Text>
        <Text style={styles.bullet}>• Advertised prices.</Text>
        <Text style={styles.bullet}>• Product category and location.</Text>
        <Text style={styles.bullet}>• Contact details voluntarily included in advertisements.</Text>

        <Text style={[styles.subHeading, { marginTop: 10 }]}>C. Technical Information</Text>
        <Text style={styles.bullet}>• IP address.</Text>
        <Text style={styles.bullet}>• Device type and operating system.</Text>
        <Text style={styles.bullet}>• Browser information.</Text>
        <Text style={styles.bullet}>• Application usage and activity.</Text>
        <Text style={styles.bullet}>• Cookies and similar technologies, where applicable.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>4. HOW WE USE YOUR INFORMATION</Text>
        <Text style={styles.paragraph}>ULIST may use collected information to:</Text>
        <Text style={styles.bullet}>• Register and manage user accounts.</Text>
        <Text style={styles.bullet}>• Enable users to post and manage advertisements.</Text>
        <Text style={styles.bullet}>• Connect interested buyers and independent sellers.</Text>
        <Text style={styles.bullet}>• Display advertisements and product listings.</Text>
        <Text style={styles.bullet}>• Improve platform performance and user experience.</Text>
        <Text style={styles.bullet}>• Send account-related notifications and service updates.</Text>
        <Text style={styles.bullet}>• Prevent fraudulent, misleading or prohibited activities.</Text>
        <Text style={styles.bullet}>• Respond to complaints, inquiries and legal requests.</Text>
        <Text style={styles.bullet}>• Maintain platform security and comply with applicable laws.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>5. USER CONSENT AND RESPONSIBILITY</Text>
        <Text style={styles.paragraph}>By registering on ULIST or posting an advertisement, users confirm that:</Text>
        <Text style={styles.bullet}>• They have the legal right to provide the information submitted.</Text>
        <Text style={styles.bullet}>• They have permission to upload photographs, videos and other content.</Text>
        <Text style={styles.bullet}>• Their advertisements do not knowingly contain false, misleading, unlawful or prohibited information.</Text>
        <Text style={styles.bullet}>• They understand that information posted publicly may be viewed, accessed or shared by other users.</Text>
        <Text style={styles.bullet}>• They are responsible for protecting their account credentials and personal information.</Text>
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          Users should avoid publishing sensitive personal information, financial details, passwords or confidential documents in public advertisements.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>6. SHARING OF INFORMATION</Text>
        <Text style={styles.paragraph}>
          ULIST does not sell users' personal information as a standalone commercial product.
        </Text>
        <Text style={styles.paragraph}>However, information may be shared in the following circumstances:</Text>
        <Text style={styles.bullet}>• With other users when necessary to facilitate platform interactions.</Text>
        <Text style={styles.bullet}>• With technology, hosting, analytics and service providers assisting ULIST.</Text>
        <Text style={styles.bullet}>• With payment service providers, if payment facilities are introduced.</Text>
        <Text style={styles.bullet}>• With law enforcement authorities or government agencies when legally required.</Text>
        <Text style={styles.bullet}>• To protect the rights, safety, security and legitimate interests of ULIST and its users.</Text>
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          Advertisers should understand that information voluntarily included in public advertisements may be accessible to other users.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>7. THIRD-PARTY SERVICES AND LINKS</Text>
        <Text style={styles.paragraph}>
          ULIST may contain links to third-party websites, applications, payment services or communication platforms.
        </Text>
        <Text style={styles.paragraph}>
          Such services operate independently and are governed by their own privacy policies and terms. ULIST does not control or assume responsibility for the privacy practices, security measures or content of independent third-party services.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>8. COOKIES AND TRACKING TECHNOLOGIES</Text>
        <Text style={styles.paragraph}>
          ULIST may use cookies and similar technologies to maintain user sessions, remember user preferences, understand platform usage, improve website and application functionality, and analyse traffic.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>9. DATA SECURITY AND RETENTION</Text>
        <Text style={styles.paragraph}>
          ULIST takes reasonable technical and organisational measures to protect information under its control against unauthorised access, misuse, alteration, disclosure or loss.
        </Text>
        <Text style={styles.paragraph}>
          Information will be retained for as long as reasonably necessary for the purposes described in this policy, or as required under applicable laws.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>10. USER RIGHTS AND DATA DELETION</Text>
        <Text style={styles.paragraph}>Subject to applicable law, users may request:</Text>
        <Text style={styles.bullet}>• Access to their personal information.</Text>
        <Text style={styles.bullet}>• Correction of inaccurate information.</Text>
        <Text style={styles.bullet}>• Updating of account details.</Text>
        <Text style={styles.bullet}>• Deletion of their account and personal information.</Text>
        <Text style={styles.bullet}>• Withdrawal of consent for applicable data processing.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>11. CHILDREN'S PRIVACY</Text>
        <Text style={styles.paragraph}>
          ULIST is not intended to be used by children in violation of applicable laws. Users must meet the minimum age and legal capacity requirements applicable to their use of the platform.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>12. CHANGES TO THIS PRIVACY POLICY</Text>
        <Text style={styles.paragraph}>
          ULIST reserves the right to modify or update this Privacy Policy from time to time. Any revised version will be published on the ULIST website or application with an updated effective date.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>13. GRIEVANCES AND CONTACT INFORMATION</Text>
        <Text style={styles.paragraph}>For privacy-related questions or requests concerning personal information, users may contact:</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>ULIST – by WishCraft</Text>
          <Text style={styles.contactLine}>Website: https://www.ulist.in</Text>
          <Text style={styles.contactLine}>Email: support@ulist.in</Text>
          <Text style={styles.contactLine}>Platform: Intermediary Classifieds & Marketplace</Text>
        </View>
      </View>

      {/* IMPORTANT USER NOTICE DISCLAIMER */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerMainHeading}>IMPORTANT USER NOTICE</Text>
        <Text style={styles.disclaimerSubHeading}>INDEPENDENT ADVERTISEMENT DISCLAIMER</Text>

        <Text style={styles.disclaimerItem}>1. ULIST is an intermediary listing and discovery platform that enables independent users to publish advertisements and connect with potential buyers.</Text>
        <Text style={styles.disclaimerItem}>2. All advertisements are created and published by independent advertisers. ULIST does not act as the owner, seller, broker, manufacturer, agent or representative of the products advertised.</Text>
        <Text style={styles.disclaimerItem}>3. ULIST does not independently guarantee the identity of advertisers, product ownership, product authenticity, condition, quality, safety, pricing or availability.</Text>
        <Text style={styles.disclaimerItem}>4. ULIST does not guarantee, endorse or recommend any independent advertisement, advertiser, buyer or seller merely because their content appears on the platform.</Text>
        <Text style={styles.disclaimerItem}>5. ULIST is not responsible for private negotiations, agreements, payments, deposits, deliveries, refunds, warranties, returns, cancellations or disputes arising directly between users, except to the extent any responsibility is imposed on ULIST by applicable law.</Text>
        <Text style={styles.disclaimerItem}>6. Users are strongly advised to independently verify the seller, product, ownership documents, product condition and transaction details before making any payment or commitment.</Text>
        <Text style={styles.disclaimerItem}>7. Users should avoid advance payments to unknown individuals and exercise caution when sharing financial or personal information.</Text>
        <Text style={styles.disclaimerItem}>8. Advertisers are solely responsible for ensuring that their advertisements and products comply with applicable laws. Prohibited, counterfeit, stolen, misleading or unlawful listings are not permitted.</Text>
        <Text style={styles.disclaimerItem}>9. ULIST reserves the right, subject to applicable law, to review, restrict, suspend or remove advertisements or accounts that violate its policies or applicable legal requirements.</Text>
        <Text style={styles.disclaimerItem}>10. Nothing in this policy excludes or limits any liability or obligation that cannot legally be excluded or limited under applicable law.</Text>

        <Text style={styles.acknowledgment}>
          BY USING ULIST, USERS ACKNOWLEDGE THAT INDEPENDENT ADVERTISEMENTS ARE POSTED BY THIRD PARTIES AND THAT TRANSACTIONS ARE UNDERTAKEN AT THE USERS' OWN DISCRETION AND RISK.
        </Text>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureBrand}>ULIST – BY WISHCRAFT</Text>
          <Text style={styles.signatureTagline}>List It. Sell It. Cash It!</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#D9480F',
    paddingBottom: 16,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D9480F',
    letterSpacing: 1.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  dates: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2942',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4B5563',
    paddingLeft: 6,
    marginBottom: 4,
  },
  highlight: {
    fontWeight: '700',
    color: '#D9480F',
  },
  bold: {
    fontWeight: '700',
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0F2942',
    marginTop: 6,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2942',
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 18,
    marginTop: 20,
  },
  disclaimerMainHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  disclaimerSubHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
    marginBottom: 12,
  },
  disclaimerItem: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
    marginBottom: 8,
  },
  acknowledgment: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  signatureBox: {
    marginTop: 16,
    alignItems: 'center',
    paddingTop: 8,
  },
  signatureBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2942',
    letterSpacing: 1,
  },
  signatureTagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D9480F',
    marginTop: 2,
  },
});
