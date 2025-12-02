import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Mail } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-semibold">Back</span>
            </button>
            <div className="flex items-center text-blue-600">
              <FileText className="w-6 h-6 mr-2" />
              <h1 className="text-xl font-bold">Terms of Service</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-sm max-w-none">
          {/* Header Info */}
          <div className="not-prose mb-8 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-gray-600">ConnectSphere Group Buying Platform</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p><strong>Effective Date:</strong> November 23, 2025</p>
                <p><strong>Last Updated:</strong> November 23, 2025</p>
                <p><strong>Version:</strong> 1.0</p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Table of Contents</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li><a href="#section-1" className="text-blue-600 hover:text-blue-700 hover:underline">Acceptance of Terms</a></li>
              <li><a href="#section-2" className="text-blue-600 hover:text-blue-700 hover:underline">Eligibility</a></li>
              <li><a href="#section-3" className="text-blue-600 hover:text-blue-700 hover:underline">User Accounts</a></li>
              <li><a href="#section-4" className="text-blue-600 hover:text-blue-700 hover:underline">Group Buying Process</a></li>
              <li><a href="#section-5" className="text-blue-600 hover:text-blue-700 hover:underline">Payments and Pricing</a></li>
              <li><a href="#section-6" className="text-blue-600 hover:text-blue-700 hover:underline">User Obligations</a></li>
              <li><a href="#section-7" className="text-blue-600 hover:text-blue-700 hover:underline">Data Protection and Privacy</a></li>
              <li><a href="#section-8" className="text-blue-600 hover:text-blue-700 hover:underline">Limitation of Liability</a></li>
              <li><a href="#section-9" className="text-blue-600 hover:text-blue-700 hover:underline">Dispute Resolution</a></li>
              <li><a href="#section-10" className="text-blue-600 hover:text-blue-700 hover:underline">Termination</a></li>
              <li><a href="#section-11" className="text-blue-600 hover:text-blue-700 hover:underline">Modifications</a></li>
              <li><a href="#section-12" className="text-blue-600 hover:text-blue-700 hover:underline">Contact Information</a></li>
              <li><a href="#section-13" className="text-blue-600 hover:text-blue-700 hover:underline">Zimbabwe Legal Compliance</a></li>
            </ol>
          </div>

          {/* Content Sections */}
          <div id="section-1">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p className="mb-4">By accessing or using ConnectSphere ("Platform", "Service"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, you may not access or use the Platform.</p>
            <p className="mb-4">ConnectSphere is a group buying platform that connects consumers ("Traders"), suppliers ("Suppliers"), and administrators ("Admins") to facilitate bulk purchasing at discounted prices.</p>
            <p className="mb-4"><strong>Governing Law:</strong> These Terms are governed by the laws of the Republic of Zimbabwe, including the Cyber and Data Protection Act [Chapter 12:07], Consumer Protection Act [Chapter 14:44], and Electronic Transactions and Electronic Commerce Act.</p>
          </div>

          <div id="section-2">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. ELIGIBILITY</h2>
            <p className="mb-4"><strong>Age Requirement:</strong> You must be at least 18 years old to use this Platform. By using the Service, you represent and warrant that you are of legal age to form a binding contract.</p>
            <p className="mb-4"><strong>Location:</strong> The Platform operates primarily in Zimbabwe. Users from other jurisdictions may be subject to additional terms and local laws.</p>
          </div>

          <div id="section-3">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. USER ACCOUNTS</h2>
            <p className="mb-4">To access certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="mb-4">You are solely responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </div>

          <div id="section-4">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. GROUP BUYING PROCESS</h2>
            <p className="mb-4"><strong>How It Works:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Joining Groups:</strong> Traders join group buys by specifying quantity and making payment. Payments are processed immediately via our secure payment gateway.</li>
              <li><strong>Target Achievement:</strong> When the target quantity is reached, a Supplier Order is created automatically. Suppliers must accept or reject orders within a reasonable timeframe.</li>
              <li><strong>Payment Processing:</strong> Once the supplier confirms, the admin processes payment to the supplier. Funds are held securely until order fulfillment.</li>
              <li><strong>Product Collection:</strong> Traders generate QR codes for product collection. Admin scans QR codes to verify and complete the handover.</li>
            </ul>
            <p className="mb-4"><strong>Refunds:</strong> Refunds are issued if:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Group buy fails to reach target quantity</li>
              <li>Supplier rejects the order</li>
              <li>Product is not as described or defective</li>
              <li>Platform error or technical issue</li>
            </ul>
            <p className="mb-4"><strong>Refund Processing Time:</strong> 7-14 business days to original payment method.</p>
          </div>

          <div id="section-5">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. PAYMENTS AND PRICING</h2>
            <p className="mb-4"><strong>Payment Processing:</strong> All payments are processed through Flutterwave, a licensed payment service provider. Accepted payment methods include:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Mobile Money (EcoCash, OneMoney, Telecash)</li>
              <li>Debit/Credit Cards (Visa, Mastercard)</li>
              <li>Bank Transfers</li>
            </ul>
            <p className="mb-4"><strong>Pricing:</strong> All prices are displayed in United States Dollars (USD). Bulk discounts apply only when the target quantity is reached. Individual prices apply if the group buy does not reach its target.</p>
            <p className="mb-4"><strong>Transaction Fees:</strong> Payment processing fees may apply based on your chosen payment method. These fees are clearly displayed before you complete your payment.</p>
          </div>

          <div id="section-6">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. USER OBLIGATIONS</h2>
            <p className="mb-4"><strong>Traders must:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Make timely payments for joined group buys</li>
              <li>Provide accurate payment and delivery information</li>
              <li>Collect products within specified timeframes</li>
              <li>Present valid QR codes for product collection</li>
              <li>Report any issues or defects immediately</li>
            </ul>
            <p className="mb-4"><strong>Suppliers must:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Provide accurate product descriptions and pricing</li>
              <li>Accept or reject orders within 48 hours</li>
              <li>Fulfill confirmed orders as described</li>
              <li>Maintain product quality and safety standards</li>
              <li>Respond to customer inquiries promptly</li>
            </ul>
            <p className="mb-4"><strong>Prohibited Activities:</strong> Users must not:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Violate any Zimbabwe laws or regulations</li>
              <li>Engage in fraudulent transactions or misrepresentation</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Interfere with platform security or functionality</li>
              <li>Abuse refund policies or payment systems</li>
              <li>Harass, threaten, or abuse other users</li>
            </ul>
          </div>

          <div id="section-7">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. DATA PROTECTION AND PRIVACY</h2>
            <p className="mb-4">We collect and process personal data in accordance with Zimbabwe's Cyber and Data Protection Act [Chapter 12:07] and our Privacy Policy.</p>
            <p className="mb-4"><strong>Your Rights:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Right to access your personal data</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your data ("Right to be Forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to marketing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with POTRAZ</li>
            </ul>
            <p className="mb-4">For more information, please read our <a href="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</a>.</p>
          </div>

          <div id="section-8">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. LIMITATION OF LIABILITY</h2>
            <p className="mb-4"><strong>Service Availability:</strong> We strive for 99% uptime but do not guarantee uninterrupted service. We are not liable for:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Service interruptions or downtime</li>
              <li>Technical errors or bugs</li>
              <li>Third-party service failures (payment processors, hosting providers)</li>
              <li>Internet connectivity issues</li>
            </ul>
            <p className="mb-4"><strong>Financial Liability:</strong> To the maximum extent permitted by Zimbabwe law, our total liability is limited to the amount paid by you for the specific service in question.</p>
            <p className="mb-4"><strong>Indirect Damages:</strong> We are not liable for indirect, incidental, consequential, or punitive damages arising from your use of the Platform.</p>
          </div>

          <div id="section-9">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. DISPUTE RESOLUTION</h2>
            <p className="mb-4"><strong>Governing Law:</strong> These Terms are governed by and construed in accordance with the laws of the Republic of Zimbabwe.</p>
            <p className="mb-4"><strong>Jurisdiction:</strong> Any disputes arising from these Terms or your use of the Platform shall be resolved in the courts of Zimbabwe.</p>
            <p className="mb-4"><strong>Negotiation:</strong> Before initiating legal proceedings, parties agree to attempt good faith negotiation for 30 days.</p>
            <p className="mb-4"><strong>Customer Support:</strong> For issues or disputes, contact our support team at support@connectsphere.co.zw</p>
          </div>

          <div id="section-10">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. TERMINATION</h2>
            <p className="mb-4"><strong>We may suspend or terminate your account if:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent activity</li>
              <li>You abuse platform features or other users</li>
              <li>Required by law or legal authorities</li>
            </ul>
            <p className="mb-4"><strong>You may terminate your account at any time by:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Contacting customer support</li>
              <li>Using the account deletion feature in settings</li>
            </ul>
            <p className="mb-4"><strong>Effect of Termination:</strong> Upon termination, your access to the Platform will cease. Outstanding orders will be fulfilled or refunded as appropriate.</p>
          </div>

          <div id="section-11">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. MODIFICATIONS TO TERMS</h2>
            <p className="mb-4">We reserve the right to modify these Terms at any time. Material changes will be communicated via:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email notification to registered users</li>
              <li>Platform notifications</li>
              <li>Website announcements</li>
            </ul>
            <p className="mb-4"><strong>Notice Period:</strong> We will provide at least 14 days' notice for material changes.</p>
            <p className="mb-4"><strong>Acceptance:</strong> Continued use of the Platform after changes constitutes acceptance of the modified Terms.</p>
          </div>

          <div id="section-12">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. CONTACT INFORMATION</h2>
            <div className="not-prose bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                ConnectSphere Support
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>General Support:</strong> support@connectsphere.co.zw</p>
                <p><strong>Data Protection Officer:</strong> privacy@connectsphere.co.zw</p>
                <p><strong>Legal Inquiries:</strong> legal@connectsphere.co.zw</p>
                <p><strong>Security Issues:</strong> security@connectsphere.co.zw</p>
              </div>
            </div>
          </div>

          <div id="section-13">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. ZIMBABWE LEGAL COMPLIANCE</h2>
            <p className="mb-4"><strong>Consumer Protection Act [Chapter 14:44]:</strong></p>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Fair trading practices</li>
              <li>Accurate product information</li>
              <li>Safe and quality products</li>
              <li>Refunds for defective products</li>
              <li>Protection from misleading advertising</li>
            </ul>
            <p className="mb-4"><strong>Cyber and Data Protection Act [Chapter 12:07]:</strong></p>
            <p className="mb-4">Your personal data is protected under Zimbabwe's data protection principles:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Lawful and fair processing</li>
              <li>Purpose limitation</li>
              <li>Data minimization</li>
              <li>Accuracy</li>
              <li>Storage limitation</li>
              <li>Security and confidentiality</li>
            </ul>
            <p className="mb-4"><strong>Electronic Transactions and Electronic Commerce Act:</strong></p>
            <p className="mb-4">All electronic transactions on the Platform are legally binding and enforceable under Zimbabwe law.</p>
          </div>

          {/* Footer */}
          <div className="not-prose mt-12 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>🇿🇼 Zimbabwe Legal Framework:</strong> This Terms of Service complies with all applicable Zimbabwe laws and regulations.
                  </p>
                  <p className="text-xs text-gray-600">
                    Last Updated: November 23, 2025 | Version 1.0 | © 2025 ConnectSphere. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/privacy-policy')}
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Privacy Policy
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

