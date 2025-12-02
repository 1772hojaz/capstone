import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
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
              <Shield className="w-6 h-6 mr-2" />
              <h1 className="text-xl font-bold">Privacy Policy</h1>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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
              <li><a href="#section-1" className="text-blue-600 hover:text-blue-700 hover:underline">Introduction</a></li>
              <li><a href="#section-2" className="text-blue-600 hover:text-blue-700 hover:underline">Personal Data We Collect</a></li>
              <li><a href="#section-3" className="text-blue-600 hover:text-blue-700 hover:underline">How We Use Your Data</a></li>
              <li><a href="#section-4" className="text-blue-600 hover:text-blue-700 hover:underline">Data Sharing</a></li>
              <li><a href="#section-5" className="text-blue-600 hover:text-blue-700 hover:underline">Data Retention</a></li>
              <li><a href="#section-6" className="text-blue-600 hover:text-blue-700 hover:underline">Your Privacy Rights</a></li>
              <li><a href="#section-7" className="text-blue-600 hover:text-blue-700 hover:underline">Data Security</a></li>
              <li><a href="#section-8" className="text-blue-600 hover:text-blue-700 hover:underline">Cookies and Tracking</a></li>
              <li><a href="#section-9" className="text-blue-600 hover:text-blue-700 hover:underline">Children's Privacy</a></li>
              <li><a href="#section-10" className="text-blue-600 hover:text-blue-700 hover:underline">International Data Transfers</a></li>
              <li><a href="#section-11" className="text-blue-600 hover:text-blue-700 hover:underline">Contact Information</a></li>
              <li><a href="#section-12" className="text-blue-600 hover:text-blue-700 hover:underline">Supervisory Authority</a></li>
              <li><a href="#section-13" className="text-blue-600 hover:text-blue-700 hover:underline">Changes to Privacy Policy</a></li>
            </ol>
          </div>

          {/* Content Sections */}
          <div id="section-1">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. INTRODUCTION</h2>
            <p className="mb-4">ConnectSphere is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with Zimbabwe's data protection laws.</p>
            <p className="mb-4"><strong>Legal Framework:</strong> This policy complies with:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Cyber and Data Protection Act [Chapter 12:07]</li>
              <li>Constitution of Zimbabwe (Section 57 - Right to Privacy)</li>
              <li>Postal and Telecommunications Act [Chapter 12:05]</li>
              <li>Electronic Transactions and Electronic Commerce Act</li>
            </ul>
          </div>

          <div id="section-2">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. PERSONAL DATA WE COLLECT</h2>
            <p className="mb-4"><strong>Information You Provide:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Account Registration:</strong> Full name, email address, phone number, physical address, location zone, password (encrypted)</li>
              <li><strong>Payment Information:</strong> Payment method, transaction references (processed via Flutterwave). <em className="text-red-600">We do NOT store credit card numbers or CVV codes.</em></li>
              <li><strong>Group Buy Data:</strong> Products browsed/joined, quantities ordered, delivery preferences, order history, QR codes generated</li>
              <li><strong>Communication:</strong> Messages to support, feedback, reviews</li>
            </ul>
            <p className="mb-4"><strong>Information Collected Automatically:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Device Information:</strong> IP address, device type, operating system, browser type and version</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns, search queries</li>
              <li><strong>Location Data:</strong> Location zone as provided by you, IP-based geolocation (city/region level)</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, authentication tokens, preference cookies, analytics cookies</li>
            </ul>
          </div>

          <div id="section-3">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. HOW WE USE YOUR DATA</h2>
            <p className="mb-4">We use your personal data for the following purposes:</p>
            <p className="mb-4"><strong>Service Delivery:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Creating and managing your account</li>
              <li>Processing group buy participation</li>
              <li>Facilitating payments and refunds</li>
              <li>Generating QR codes for product collection</li>
              <li>Coordinating product delivery/pickup</li>
            </ul>
            <p className="mb-4"><strong>Communication:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Sending order confirmations and updates</li>
              <li>Account notifications and alerts</li>
              <li>Customer support responses</li>
              <li>Marketing communications (with your consent)</li>
            </ul>
            <p className="mb-4"><strong>Platform Improvement:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Analyzing usage patterns and trends</li>
              <li>Improving user experience and features</li>
              <li>Developing new features and services</li>
              <li>Troubleshooting and debugging</li>
            </ul>
            <p className="mb-4"><strong>Security and Compliance:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Detecting and preventing fraud</li>
              <li>Preventing unauthorized access</li>
              <li>Monitoring suspicious activity</li>
              <li>Meeting legal and regulatory obligations</li>
              <li>Responding to legal requests</li>
              <li>Enforcing Terms of Service</li>
            </ul>
          </div>

          <div id="section-4">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. DATA SHARING</h2>
            <p className="mb-4"><strong>We share your data with:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Payment Processors</strong> (Flutterwave): For secure transaction processing</li>
              <li><strong>Cloud Hosting Providers:</strong> For data storage and platform hosting</li>
              <li><strong>Email/SMS Services:</strong> For sending notifications and communications</li>
              <li><strong>Suppliers:</strong> Buyer names, quantities, delivery preferences (for order fulfillment only)</li>
              <li><strong>Legal Authorities:</strong> When required by Zimbabwe law or legal process</li>
            </ul>
            <p className="mb-4"><strong className="text-green-700">We DO NOT:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Sell your personal data to third parties</li>
              <li>Share data for third-party marketing without your explicit consent</li>
              <li>Provide data to unauthorized parties</li>
            </ul>
          </div>

          <div id="section-5">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. DATA RETENTION</h2>
            <p className="mb-4">We retain your data for the following periods:</p>
            <div className="not-prose overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Retention Period</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Account data</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Account duration + 7 years</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Legal/tax requirements</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Transaction records</td>
                    <td className="px-4 py-3 text-sm text-gray-700">7 years</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Tax compliance</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Payment data</td>
                    <td className="px-4 py-3 text-sm text-gray-700">7 years</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Financial records</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">QR codes</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 year after use</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Dispute resolution</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Marketing data</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Until consent withdrawn</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Consent-based</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Session/cookies</td>
                    <td className="px-4 py-3 text-sm text-gray-700">30 days (max)</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Functionality</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="section-6">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. YOUR PRIVACY RIGHTS</h2>
            <p className="mb-4">Under Zimbabwe's Cyber and Data Protection Act, you have the following rights:</p>
            <ul className="list-disc pl-6 mb-4 space-y-3">
              <li><strong>Right to Access:</strong> Request copies of your personal data we hold</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("Right to be Forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format (CSV, JSON)</li>
              <li><strong>Right to Object:</strong> Object to direct marketing or automated decision-making</li>
              <li><strong>Right to Withdraw Consent:</strong> Opt-out of marketing or data processing anytime</li>
              <li><strong>Right to Lodge Complaint:</strong> Contact POTRAZ or other data protection authorities</li>
            </ul>
            <p className="mb-4"><strong>How to Exercise Your Rights:</strong></p>
            <p className="mb-4">Contact our Data Protection Officer at <a href="mailto:privacy@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700 underline">privacy@connectsphere.co.zw</a></p>
            <p className="mb-4"><strong>Response Time:</strong> We will respond to valid requests within 30 days.</p>
          </div>

          <div id="section-7">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. DATA SECURITY</h2>
            <p className="mb-4"><strong>Technical Measures:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Encryption:</strong> Data encrypted in transit (SSL/TLS 1.3) and at rest (AES-256)</li>
              <li><strong>Authentication:</strong> Multi-factor authentication available for all accounts</li>
              <li><strong>Access Controls:</strong> Role-based access controls (RBAC) for data access</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
              <li><strong>Backups:</strong> Regular encrypted backups with disaster recovery procedures</li>
              <li><strong>Password Security:</strong> Bcrypt hashing with salt for password storage</li>
            </ul>
            <p className="mb-4"><strong>Organizational Measures:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Staff training on data protection</li>
              <li>Confidentiality agreements for all employees</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Incident response plan in place</li>
            </ul>
            <p className="mb-4"><strong>Data Breach Notification:</strong></p>
            <p className="mb-4">In the event of a data breach, we will:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Notify affected users within 72 hours</li>
              <li>Report to Zimbabwe data protection authorities (POTRAZ)</li>
              <li>Provide guidance on protective measures</li>
              <li>Investigate and remediate the breach</li>
            </ul>
          </div>

          <div id="section-8">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. COOKIES AND TRACKING</h2>
            <p className="mb-4">We use the following types of cookies:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality (login, session management)</li>
              <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Analytics Cookies:</strong> Understand how users interact with the platform</li>
            </ul>
            <p className="mb-4"><strong>Managing Cookies:</strong></p>
            <p className="mb-4">You can control cookies through:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Browser settings (block or delete cookies)</li>
              <li>Privacy settings in your account</li>
              <li>Opt-out tools for analytics services</li>
            </ul>
            <p className="mb-4"><em className="text-amber-700">Note: Disabling essential cookies may affect platform functionality.</em></p>
          </div>

          <div id="section-9">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. CHILDREN'S PRIVACY</h2>
            <p className="mb-4">ConnectSphere is not intended for users under 18 years old. We do not knowingly collect personal data from children.</p>
            <p className="mb-4">If we become aware that we have collected data from a child under 18, we will:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Delete the data immediately</li>
              <li>Terminate the account</li>
              <li>Notify the parent/guardian if possible</li>
            </ul>
            <p className="mb-4">If you believe we have collected data from a child, contact us at <a href="mailto:privacy@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700 underline">privacy@connectsphere.co.zw</a></p>
          </div>

          <div id="section-10">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="mb-4"><strong>Primary Storage:</strong> Data is primarily stored in Zimbabwe.</p>
            <p className="mb-4"><strong>Backup Storage:</strong> Encrypted backups may be stored on international cloud services with adequate data protection safeguards.</p>
            <p className="mb-4"><strong>Payment Processing:</strong> Payment data may be transferred internationally through Flutterwave's secure infrastructure.</p>
            <p className="mb-4"><strong>Safeguards:</strong> All international transfers comply with Zimbabwe data protection requirements and include appropriate security measures.</p>
          </div>

          <div id="section-11">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. CONTACT INFORMATION</h2>
            <div className="not-prose bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Privacy and Data Protection Contacts
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700">privacy@connectsphere.co.zw</a></p>
                <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700">dpo@connectsphere.co.zw</a></p>
                <p><strong>Data Breach Reporting:</strong> <a href="mailto:security@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700">security@connectsphere.co.zw</a></p>
                <p><strong>General Support:</strong> <a href="mailto:support@connectsphere.co.zw" className="text-blue-600 hover:text-blue-700">support@connectsphere.co.zw</a></p>
              </div>
            </div>
          </div>

          <div id="section-12">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. SUPERVISORY AUTHORITY</h2>
            <p className="mb-4">If you have concerns about how we handle your personal data, you may lodge a complaint with:</p>
            <div className="not-prose bg-amber-50 border border-amber-200 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ)</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Address:</strong> Stratford House, 20 Stirling Road, Mount Pleasant, Harare, Zimbabwe</p>
                <p><strong>Phone:</strong> <a href="tel:+263242312888" className="text-blue-600 hover:text-blue-700">+263 242 312 888</a></p>
                <p><strong>Email:</strong> <a href="mailto:info@potraz.gov.zw" className="text-blue-600 hover:text-blue-700">info@potraz.gov.zw</a></p>
                <p><strong>Website:</strong> <a href="http://www.potraz.gov.zw" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">www.potraz.gov.zw</a></p>
              </div>
            </div>
          </div>

          <div id="section-13">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. CHANGES TO THIS PRIVACY POLICY</h2>
            <p className="mb-4">We may update this Privacy Policy from time to time to reflect:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Changes in Zimbabwe data protection laws</li>
              <li>New platform features or services</li>
              <li>Feedback from users or regulators</li>
              <li>Industry best practices</li>
            </ul>
            <p className="mb-4"><strong>Notification of Changes:</strong></p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Email notification to all registered users</li>
              <li>Platform notification banner</li>
              <li>Updated "Last Modified" date at the top of this policy</li>
            </ul>
            <p className="mb-4"><strong>Material Changes:</strong> For significant changes, we will provide at least 30 days' notice and may require re-consent.</p>
            <p className="mb-4"><strong>Review History:</strong> Previous versions of this policy are available upon request.</p>
          </div>

          {/* Footer */}
          <div className="not-prose mt-12 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Shield className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>🇿🇼 Zimbabwe Data Protection Compliance:</strong> This Privacy Policy complies with the Cyber and Data Protection Act [Chapter 12:07] and all applicable Zimbabwe privacy laws.
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
            onClick={() => navigate('/terms-of-service')}
            className="text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            Terms of Service
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

export default PrivacyPolicy;

