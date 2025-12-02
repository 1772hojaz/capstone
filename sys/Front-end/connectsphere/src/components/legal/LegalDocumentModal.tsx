import { X } from 'lucide-react';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'tos' | 'privacy';
}

const LegalDocumentModal = ({ isOpen, onClose, title, type }: LegalDocumentModalProps) => {
  if (!isOpen) return null;

  const content = type === 'tos' ? getTermsOfService() : getPrivacyPolicy();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            I Have Read and Understood
          </button>
        </div>
      </div>
    </div>
  );
};

// Terms of Service Content
const getTermsOfService = () => {
  return `
    <div class="legal-content">
      <p class="text-sm text-gray-500 mb-4"><strong>Effective Date:</strong> November 23, 2025 | <strong>Last Updated:</strong> November 23, 2025</p>
      
      <h3 class="text-xl font-bold mt-6 mb-4">1. ACCEPTANCE OF TERMS</h3>
      <p>By accessing or using ConnectSphere ("Platform", "Service"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, you may not access or use the Platform.</p>
      <p>ConnectSphere is a group buying platform that connects consumers ("Traders"), suppliers ("Suppliers"), and administrators ("Admins") to facilitate bulk purchasing at discounted prices.</p>
      <p><strong>Governing Law:</strong> These Terms are governed by the laws of the Republic of Zimbabwe, including the Cyber and Data Protection Act [Chapter 12:07], Consumer Protection Act [Chapter 14:44], and Electronic Transactions and Electronic Commerce Act.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">2. ELIGIBILITY</h3>
      <p><strong>Age Requirement:</strong> You must be at least 18 years old to use this Platform. By using the Service, you represent and warrant that you are of legal age to form a binding contract.</p>
      <p><strong>Location:</strong> The Platform operates primarily in Zimbabwe. Users from other jurisdictions may be subject to additional terms and local laws.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">3. USER ACCOUNTS</h3>
      <p>To access certain features, you must create an account. You agree to:</p>
      <ul class="list-disc pl-6 my-3">
        <li>Provide accurate, current, and complete information</li>
        <li>Maintain and promptly update your account information</li>
        <li>Keep your password secure and confidential</li>
        <li>Notify us immediately of any unauthorized access</li>
      </ul>
      <p>You are responsible for all activities that occur under your account.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">4. GROUP BUYING PROCESS</h3>
      <p><strong>Joining Groups:</strong> Traders join groups by specifying quantity and making payment. Payments are processed immediately via secure payment gateway.</p>
      <p><strong>Target Achievement:</strong> When target quantity is reached, a Supplier Order is created automatically. Suppliers must accept or reject orders within a reasonable timeframe.</p>
      <p><strong>Product Collection:</strong> Traders generate QR codes for product collection. Admin scans QR codes to verify collection.</p>
      <p><strong>Refunds:</strong> Refunds are issued if group buy fails to reach target, supplier rejects order, or product is not as described. Processing time: 7-14 business days.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">5. PAYMENTS AND PRICING</h3>
      <p>All payments are processed through Flutterwave, a licensed payment service provider. Accepted methods include Mobile Money, Debit/Credit Cards, and Bank Transfers.</p>
      <p>All prices are displayed in USD ($). Bulk prices apply only when target quantity is reached.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">6. USER OBLIGATIONS</h3>
      <p><strong>Traders must:</strong></p>
      <ul class="list-disc pl-6 my-3">
        <li>Make timely payments for joined group buys</li>
        <li>Provide accurate payment information</li>
        <li>Collect products within specified timeframes</li>
        <li>Present valid QR codes for collection</li>
      </ul>
      <p><strong>Prohibited Activities:</strong> Users must not violate Zimbabwe laws, engage in fraudulent transactions, create fake accounts, or interfere with platform security.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">7. DATA PROTECTION AND PRIVACY</h3>
      <p>We collect and process personal data in accordance with Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and our Privacy Policy. You have the right to access, correct, or delete your personal data.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">8. LIMITATION OF LIABILITY</h3>
      <p>We strive for 99% uptime but do not guarantee uninterrupted service. We are not liable for service interruptions, technical errors, or third-party service failures.</p>
      <p>To the maximum extent permitted by Zimbabwe law, our total liability is limited to the amount paid by you for the specific service in question.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">9. DISPUTE RESOLUTION</h3>
      <p><strong>Governing Law:</strong> These Terms are governed by the laws of Zimbabwe.</p>
      <p><strong>Jurisdiction:</strong> Disputes shall be resolved in the courts of Zimbabwe.</p>
      <p><strong>Negotiation:</strong> Before initiating legal proceedings, parties agree to attempt good faith negotiation for 30 days.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">10. TERMINATION</h3>
      <p>We may suspend or terminate accounts for Terms violations, fraudulent activity, or legal requirements. You may terminate your account at any time by contacting customer support.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">11. MODIFICATIONS</h3>
      <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email, platform notifications, or website announcements. Continued use after changes constitutes acceptance.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">12. CONTACT INFORMATION</h3>
      <p><strong>ConnectSphere Support</strong><br/>
      Email: support@connectsphere.co.zw<br/>
      Data Protection Officer: privacy@connectsphere.co.zw<br/>
      Legal Inquiries: legal@connectsphere.co.zw</p>

      <h3 class="text-xl font-bold mt-6 mb-4">13. ZIMBABWE LEGAL COMPLIANCE</h3>
      <p><strong>Consumer Protection Act [Chapter 14:44]:</strong> You have the right to fair trading practices, accurate product information, safe products, and refunds for defective products.</p>
      <p><strong>Cyber and Data Protection Act [Chapter 12:07]:</strong> Your personal data is protected under Zimbabwe's data protection principles.</p>

      <p class="mt-8 text-sm text-gray-600"><strong>Last Updated:</strong> November 23, 2025 | <strong>Version:</strong> 1.0</p>
      <p class="text-sm text-gray-600">© 2025 ConnectSphere. All rights reserved.</p>

      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm"><strong>Note:</strong> This is a summary. For the complete Terms of Service, please contact support@connectsphere.co.zw</p>
      </div>
    </div>
  `;
};

// Privacy Policy Content
const getPrivacyPolicy = () => {
  return `
    <div class="legal-content">
      <p class="text-sm text-gray-500 mb-4"><strong>Effective Date:</strong> November 23, 2025 | <strong>Last Updated:</strong> November 23, 2025</p>
      
      <h3 class="text-xl font-bold mt-6 mb-4">1. INTRODUCTION</h3>
      <p>ConnectSphere is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with Zimbabwe's data protection laws.</p>
      <p><strong>Legal Framework:</strong> This policy complies with the Cyber and Data Protection Act [Chapter 12:07], Constitution of Zimbabwe (Section 57 - Right to Privacy), and Postal and Telecommunications Act [Chapter 12:05].</p>

      <h3 class="text-xl font-bold mt-6 mb-4">2. PERSONAL DATA WE COLLECT</h3>
      <p><strong>Information You Provide:</strong></p>
      <ul class="list-disc pl-6 my-3">
        <li><strong>Account Registration:</strong> Full name, email, phone number, physical address, location zone, password (encrypted)</li>
        <li><strong>Payment Information:</strong> Payment method, transaction references (via Flutterwave). <em>We do NOT store credit card numbers or CVV codes.</em></li>
        <li><strong>Group Buy Data:</strong> Products browsed/joined, quantities ordered, delivery preferences, order history, QR codes</li>
      </ul>
      <p><strong>Information Collected Automatically:</strong></p>
      <ul class="list-disc pl-6 my-3">
        <li>Device information (IP address, device type, operating system, browser)</li>
        <li>Usage data (pages visited, features used, time spent, click patterns)</li>
        <li>Location data (location zone as provided, IP-based geolocation)</li>
        <li>Cookies and tracking (session, authentication, preferences, analytics)</li>
      </ul>

      <h3 class="text-xl font-bold mt-6 mb-4">3. HOW WE USE YOUR DATA</h3>
      <p>We use your personal data for:</p>
      <ul class="list-disc pl-6 my-3">
        <li><strong>Service Delivery:</strong> Creating/managing account, processing group buys, facilitating payments, generating QR codes</li>
        <li><strong>Communication:</strong> Order confirmations, account notifications, customer support, marketing (with consent)</li>
        <li><strong>Platform Improvement:</strong> Analyzing usage, improving UX, developing features, troubleshooting</li>
        <li><strong>Security:</strong> Detecting fraud, preventing unauthorized access, monitoring suspicious activity</li>
        <li><strong>Legal Compliance:</strong> Meeting tax obligations, responding to legal requests, enforcing Terms</li>
      </ul>

      <h3 class="text-xl font-bold mt-6 mb-4">4. DATA SHARING</h3>
      <p><strong>We share data with:</strong></p>
      <ul class="list-disc pl-6 my-3">
        <li><strong>Payment Processors</strong> (Flutterwave): For transaction processing</li>
        <li><strong>Cloud Hosting</strong>: For data storage</li>
        <li><strong>Email/SMS Services</strong>: For notifications</li>
        <li><strong>Suppliers</strong>: Buyer names, quantities, delivery preferences (for order fulfillment)</li>
        <li><strong>Legal Authorities</strong>: When required by Zimbabwe law</li>
      </ul>
      <p><strong>We DO NOT:</strong> Sell your personal data to third parties or share data for third-party marketing without consent.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">5. DATA RETENTION</h3>
      <table class="w-full border-collapse my-4">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-300 px-4 py-2 text-left">Data Type</th>
            <th class="border border-gray-300 px-4 py-2 text-left">Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-300 px-4 py-2">Account data</td>
            <td class="border border-gray-300 px-4 py-2">Account duration + 7 years</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-2">Transaction records</td>
            <td class="border border-gray-300 px-4 py-2">7 years</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-2">Payment data</td>
            <td class="border border-gray-300 px-4 py-2">7 years</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-2">QR codes</td>
            <td class="border border-gray-300 px-4 py-2">1 year after use</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-2">Marketing data</td>
            <td class="border border-gray-300 px-4 py-2">Until consent withdrawn</td>
          </tr>
        </tbody>
      </table>

      <h3 class="text-xl font-bold mt-6 mb-4">6. YOUR PRIVACY RIGHTS</h3>
      <p>Under Zimbabwe's Cyber and Data Protection Act, you have the following rights:</p>
      <ul class="list-disc pl-6 my-3">
        <li><strong>Right to Access:</strong> Request copies of your personal data</li>
        <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your data ("Right to be Forgotten")</li>
        <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
        <li><strong>Right to Data Portability:</strong> Receive data in portable format</li>
        <li><strong>Right to Object:</strong> Object to direct marketing</li>
        <li><strong>Right to Withdraw Consent:</strong> Opt-out anytime</li>
        <li><strong>Right to Lodge Complaint:</strong> Contact data protection authorities</li>
      </ul>
      <p><strong>Response Time:</strong> We respond within 30 days of receiving valid requests.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">7. DATA SECURITY</h3>
      <p><strong>Technical Measures:</strong></p>
      <ul class="list-disc pl-6 my-3">
        <li>Encryption: Data encrypted in transit (SSL/TLS) and at rest (AES-256)</li>
        <li>Multi-factor authentication available</li>
        <li>Role-based access controls</li>
        <li>24/7 security monitoring</li>
        <li>Regular encrypted backups</li>
      </ul>
      <p><strong>Data Breach Notification:</strong> We will notify affected users within 72 hours and report to Zimbabwe data protection authorities.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">8. COOKIES</h3>
      <p>We use cookies for session management, authentication, preferences, and analytics. You can control cookies through browser settings or privacy settings in your account.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">9. CHILDREN'S PRIVACY</h3>
      <p>ConnectSphere is not intended for users under 18 years old. We do not knowingly collect data from children. If discovered, data will be deleted immediately.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">10. INTERNATIONAL DATA TRANSFERS</h3>
      <p>Primary data storage is in Zimbabwe. Backups may be stored on international cloud services with adequate protection. Payment processing may involve international transfers.</p>

      <h3 class="text-xl font-bold mt-6 mb-4">11. CONTACT INFORMATION</h3>
      <p><strong>Privacy Inquiries:</strong> privacy@connectsphere.co.zw<br/>
      <strong>Data Protection Officer:</strong> dpo@connectsphere.co.zw<br/>
      <strong>Data Breach Reporting:</strong> security@connectsphere.co.zw</p>

      <h3 class="text-xl font-bold mt-6 mb-4">12. SUPERVISORY AUTHORITY</h3>
      <p>You may lodge a complaint with:</p>
      <p><strong>Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)</strong><br/>
      Address: Stratford House, 20 Stirling Road, Mount Pleasant, Harare<br/>
      Phone: +263 242 312 888<br/>
      Email: info@potraz.gov.zw<br/>
      Website: www.potraz.gov.zw</p>

      <p class="mt-8 text-sm text-gray-600"><strong>Last Updated:</strong> November 23, 2025 | <strong>Version:</strong> 1.0</p>
      <p class="text-sm text-gray-600">© 2025 ConnectSphere. All rights reserved.</p>

      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm"><strong>Note:</strong> This is a summary. For the complete Privacy Policy, please contact privacy@connectsphere.co.zw</p>
      </div>
    </div>
  `;
};

export default LegalDocumentModal;

