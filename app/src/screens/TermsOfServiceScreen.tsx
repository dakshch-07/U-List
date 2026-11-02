import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const TermsOfServiceScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>ULIST – BY WISHCRAFT</Text>
        <Text style={styles.mainTitle}>TERMS OF SERVICE & CONDITIONS OF USE</Text>
        <Text style={styles.dates}>Effective Date: 2 November 2026 | Last Updated: 2 November 2026</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>1. ABOUT ULIST</Text>
        <Text style={styles.paragraph}>
          ULIST is a digital classified advertisements and product-listing platform operated under the brand name <Text style={styles.bold}>ULIST – by WishCraft</Text> ("ULIST", "we", "our" or "us").
        </Text>
        <Text style={styles.paragraph}>
          ULIST provides an online platform where independent individuals, sellers, buyers and businesses can list, discover, advertise, buy, sell and connect regarding new, used, pre-owned, old, unused, surplus or extra products.
        </Text>
        <Text style={styles.paragraph}>
          ULIST primarily acts as a platform facilitating connections between independent advertisers and interested buyers.
        </Text>
        <Text style={[styles.paragraph, styles.highlight]}>
          ULIST IS NOT THE OWNER, SELLER, MANUFACTURER, DISTRIBUTOR, BROKER OR GUARANTOR OF PRODUCTS LISTED BY INDEPENDENT USERS.
        </Text>
        <Text style={styles.paragraph}>
          By accessing, registering or using ULIST, you acknowledge that you have read, understood and agreed to these Terms of Service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>2. ACCEPTANCE OF TERMS</Text>
        <Text style={styles.paragraph}>By using ULIST, you agree:</Text>
        <Text style={styles.bullet}>• To comply with these Terms of Service.</Text>
        <Text style={styles.bullet}>• To provide accurate information during registration.</Text>
        <Text style={styles.bullet}>• To use the platform only for lawful purposes.</Text>
        <Text style={styles.bullet}>• To respect the rights of other users.</Text>
        <Text style={styles.bullet}>• Not to misuse the platform for fraudulent or misleading activities.</Text>
        <Text style={styles.bullet}>• To comply with all applicable Indian laws and regulations.</Text>
        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          If you do not agree with these terms, you must discontinue using ULIST.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>3. ROLE OF ULIST – A PLATFORM FOR INDEPENDENT ADVERTISEMENTS</Text>
        <Text style={styles.paragraph}>
          ULIST provides a digital space where independent individuals and businesses can publish product advertisements and connect with potential buyers.
        </Text>
        <Text style={styles.paragraph}>All advertisements are independently created and submitted by users.</Text>
        <Text style={styles.subHeading}>ULIST does not:</Text>
        <Text style={styles.bullet}>• Own or possess the products advertised.</Text>
        <Text style={styles.bullet}>• Purchase or resell products listed by users.</Text>
        <Text style={styles.bullet}>• Guarantee the identity or credibility of every advertiser.</Text>
        <Text style={styles.bullet}>• Independently verify ownership of every advertised product.</Text>
        <Text style={styles.bullet}>• Guarantee product quality, condition, authenticity or functionality.</Text>
        <Text style={styles.bullet}>• Guarantee advertised prices or product availability.</Text>
        <Text style={styles.bullet}>• Participate in negotiations between buyers and sellers.</Text>
        <Text style={styles.bullet}>• Guarantee the successful completion of any transaction.</Text>
        <Text style={styles.bullet}>• Provide warranties or after-sales services for independently advertised products.</Text>
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          The appearance of an advertisement on ULIST does not mean that ULIST has inspected, approved, certified or endorsed the product or advertiser.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>4. INDEPENDENT ADVERTISER RESPONSIBILITIES</Text>
        <Text style={styles.paragraph}>
          Every individual or business posting an advertisement on ULIST is solely responsible for the advertisement and the product being offered.
        </Text>
        <Text style={styles.subHeading}>Advertisers must ensure that:</Text>
        <Text style={styles.bullet}>1. They have the legal right and authority to advertise and sell the product.</Text>
        <Text style={styles.bullet}>2. Product descriptions are accurate and not misleading.</Text>
        <Text style={styles.bullet}>3. Photographs and videos genuinely represent the advertised product.</Text>
        <Text style={styles.bullet}>4. The stated price and product availability are accurate.</Text>
        <Text style={styles.bullet}>5. Products are not stolen, counterfeit, prohibited or unlawfully obtained.</Text>
        <Text style={styles.bullet}>6. Advertisements comply with applicable laws.</Text>
        <Text style={styles.bullet}>7. They do not misuse another person's personal information, photographs or intellectual property.</Text>
        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          ULIST reserves the right to remove, restrict or suspend advertisements that violate its policies or applicable law.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>5. BUYER RESPONSIBILITIES</Text>
        <Text style={styles.paragraph}>
          Buyers using ULIST must exercise independent judgment and conduct appropriate checks before entering into any transaction.
        </Text>
        <Text style={styles.subHeading}>Buyers are advised to:</Text>
        <Text style={styles.bullet}>• Verify the seller's identity and contact information.</Text>
        <Text style={styles.bullet}>• Personally inspect products wherever practical.</Text>
        <Text style={styles.bullet}>• Check product condition, authenticity and ownership.</Text>
        <Text style={styles.bullet}>• Verify all product specifications and descriptions.</Text>
        <Text style={styles.bullet}>• Agree on the final price and payment terms directly with the seller.</Text>
        <Text style={styles.bullet}>• Obtain appropriate proof of payment and transaction documentation.</Text>
        <Text style={styles.bullet}>• Avoid sharing OTPs, passwords, banking credentials or confidential information.</Text>
        <Text style={styles.bullet}>• Avoid making advance payments to unknown individuals without verification.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>6. TRANSACTIONS BETWEEN BUYERS AND SELLERS</Text>
        <Text style={styles.paragraph}>
          All negotiations, agreements, payments, product inspections, collections, deliveries and other transaction-related arrangements are strictly between the buyer and the independent advertiser.
        </Text>
        <Text style={styles.paragraph}>
          ULIST is not a party to such transactions. Unless expressly introduced as a separate service, ULIST does not collect purchase money, act as an escrow, guarantee deliveries, process refunds, or resolve private disputes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>7. PROHIBITED ADVERTISEMENTS AND ACTIVITIES</Text>
        <Text style={styles.paragraph}>Users shall not publish advertisements or engage in activities involving:</Text>
        <Text style={styles.bullet}>• Stolen or unlawfully obtained goods.</Text>
        <Text style={styles.bullet}>• Counterfeit or imitation products represented as genuine.</Text>
        <Text style={styles.bullet}>• Illegal or prohibited products, weapons, or explosives.</Text>
        <Text style={styles.bullet}>• Narcotics or prohibited substances.</Text>
        <Text style={styles.bullet}>• Fraudulent schemes, fake listings, or impersonation.</Text>
        <Text style={styles.bullet}>• Content infringing intellectual property rights.</Text>
        <Text style={styles.bullet}>• Obscene, defamatory, threatening or unlawful content.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>8. USER ACCOUNTS AND SECURITY</Text>
        <Text style={styles.paragraph}>
          Users are responsible for maintaining the confidentiality of their login credentials. Users must provide accurate information, protect account credentials, and immediately notify ULIST of any suspected unauthorized access.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>9. ADVERTISEMENT APPROVAL AND REMOVAL</Text>
        <Text style={styles.paragraph}>
          ULIST reserves the right to moderate the platform, remove prohibited advertisements, restrict misleading listings, and suspend accounts that violate policies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>10. FEES, PAID LISTINGS AND PROMOTIONAL SERVICES</Text>
        <Text style={styles.paragraph}>
          ULIST may offer free and paid featured ads, premium promotions, or packages. Payment for listing or promotional visibility does not guarantee a sale, nor does it constitute an endorsement by ULIST.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>11. INTELLECTUAL PROPERTY RIGHTS</Text>
        <Text style={styles.paragraph}>
          The ULIST name, logo, branding, and platform materials are owned by or licensed to ULIST and/or WishCraft. Users may not copy, modify or distribute them without written permission.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>12. THIRD-PARTY LINKS AND SERVICES</Text>
        <Text style={styles.paragraph}>
          ULIST may provide links to third-party services. Such services operate independently and are not controlled by ULIST.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>13. LIMITATION OF LIABILITY</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by applicable law, ULIST, WishCraft, and their personnel shall not be liable for losses, claims, damages or disputes arising from independent advertisements, defective products, buyer-seller disputes, or non-delivery.
        </Text>
        <Text style={[styles.paragraph, styles.highlight]}>
          ULIST PROVIDES A PLATFORM FOR INDEPENDENT LISTINGS AND CONNECTIONS. IT DOES NOT GUARANTEE THE PERFORMANCE, CONDUCT OR TRANSACTIONAL COMMITMENTS OF INDEPENDENT USERS.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>14. INDEMNIFICATION</Text>
        <Text style={styles.paragraph}>
          Users agree to indemnify and hold harmless ULIST and WishCraft against third-party claims, damages, and legal expenses arising from unlawful advertisements, misrepresentation, or breach of these Terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>15. SUSPENSION AND TERMINATION</Text>
        <Text style={styles.paragraph}>
          ULIST reserves the right to suspend or terminate accounts and remove advertisements that violate policies. Users may discontinue use and delete their account at any time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>16. PLATFORM AVAILABILITY</Text>
        <Text style={styles.paragraph}>
          While ULIST endeavours to provide reliable service, continuous uninterrupted availability cannot be guaranteed.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>17. PRIVACY AND PERSONAL INFORMATION</Text>
        <Text style={styles.paragraph}>
          Collection and processing of user data are governed by the ULIST Privacy Policy and relevant Indian data protection regulations.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>18. GRIEVANCE REDRESSAL AND COMPLAINTS</Text>
        <Text style={styles.paragraph}>Complaints and violations may be submitted to:</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>ULIST – by WishCraft</Text>
          <Text style={styles.contactLine}>Website: https://u-list-app.vercel.app</Text>
          <Text style={styles.contactLine}>Email: support@ulist.in</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>19. GOVERNING LAW AND JURISDICTION</Text>
        <Text style={styles.paragraph}>
          These Terms of Service shall be governed by the laws of India.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>20. CHANGES TO THESE TERMS</Text>
        <Text style={styles.paragraph}>
          ULIST reserves the right to revise or update these Terms. Continued use of the platform constitutes acceptance of revised terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeading}>21. SEVERABILITY & 22. ENTIRE AGREEMENT</Text>
        <Text style={styles.paragraph}>
          If any provision is deemed unenforceable, the remaining terms remain in effect. These Terms, along with the Privacy Policy and Disclaimer, constitute the entire agreement.
        </Text>
      </View>

      {/* FINAL USER ACKNOWLEDGEMENT */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerMainHeading}>FINAL USER ACKNOWLEDGEMENT</Text>
        <Text style={styles.acknowledgmentIntro}>By registering, accessing or using ULIST, you acknowledge and agree that:</Text>

        <Text style={styles.disclaimerItem}>1. ULIST is a platform for independent advertisements and product listings.</Text>
        <Text style={styles.disclaimerItem}>2. Advertisements are posted by independent individuals and businesses.</Text>
        <Text style={styles.disclaimerItem}>3. Advertisers are responsible for the accuracy, legality and authenticity of their listings.</Text>
        <Text style={styles.disclaimerItem}>4. Buyers and sellers are responsible for independently verifying products and transaction details.</Text>
        <Text style={styles.disclaimerItem}>5. ULIST does not guarantee the quality, authenticity, ownership, availability or delivery of independently advertised products.</Text>
        <Text style={styles.disclaimerItem}>6. Transactions between buyers and sellers are conducted at their own discretion and risk.</Text>
        <Text style={styles.disclaimerItem}>7. Users must comply with these Terms of Service and applicable laws.</Text>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureBrand}>ULIST – BY WISHCRAFT</Text>
          <Text style={styles.signatureTagline}>List It. Sell It. Cash It!</Text>
          <Text style={styles.signatureSubtag}>Your Unused Things. Someone's Next Favourite Find.</Text>
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
    marginBottom: 6,
  },
  acknowledgmentIntro: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 10,
  },
  disclaimerItem: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
    marginBottom: 8,
  },
  signatureBox: {
    marginTop: 16,
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
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
  signatureSubtag: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
