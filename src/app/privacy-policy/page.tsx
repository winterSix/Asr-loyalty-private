import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ASR Loyalty',
  description: 'Privacy Policy for ASR Loyalty mobile and web application.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 25, 2026</p>

        <Section title="1. Introduction">
          <p>
            Welcome to ASR Loyalty (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we
            collect, use, and share information about you when you use our mobile application
            and related services (the &quot;App&quot;).
          </p>
          <p className="mt-3">
            By using the App, you agree to the collection and use of information in accordance
            with this policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <SubTitle>a) Information You Provide</SubTitle>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li><strong>Account Information:</strong> First name, last name, email address, phone number, and password when you register.</li>
            <li><strong>Profile Information:</strong> Any updates you make to your profile, including profile picture.</li>
            <li><strong>Transaction Information:</strong> Payment details and transaction history when you use our payment and loyalty features.</li>
          </ul>

          <SubTitle>b) Information Collected Automatically</SubTitle>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</li>
            <li><strong>Usage Data:</strong> How you interact with the App, including pages visited, features used, and time spent.</li>
            <li><strong>Push Notification Token:</strong> To send you transaction alerts and reward notifications.</li>
          </ul>

          <SubTitle>c) Camera Access</SubTitle>
          <p>
            We request access to your device camera solely to scan QR codes for payments.
            We do not store or share any images or video captured by your camera.
          </p>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            <li>Create and manage your account</li>
            <li>Process payments and loyalty reward transactions</li>
            <li>Send you notifications about your account, transactions, and rewards</li>
            <li>Respond to your support requests</li>
            <li>Improve and personalise the App experience</li>
            <li>Comply with legal obligations and prevent fraud</li>
          </ul>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-3">
            <li><strong>Service Providers:</strong> Third-party companies that help us operate the App (e.g. payment processors, cloud hosting providers), who are bound by confidentiality obligations.</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your personal information for as long as your account is active or as
            needed to provide services. You may request deletion of your account and personal
            data by contacting us at the email below.
          </p>
        </Section>

        <Section title="6. Security">
          <p>
            We implement industry-standard security measures including encryption in transit
            (HTTPS/TLS) and secure token-based authentication to protect your information.
            However, no method of transmission over the internet is 100% secure.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-3">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal data</li>
            <li>Withdraw consent at any time where processing is based on consent</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us at the email address below.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            Our App is not directed to children under the age of 13. We do not knowingly
            collect personal information from children. If you believe we have collected
            information from a child, please contact us immediately.
          </p>
        </Section>

        <Section title="9. Third-Party Services">
          <p>The App may use third-party services including:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-3">
            <li><strong>Google Sign-In</strong> — subject to Google&apos;s Privacy Policy</li>
            <li><strong>Expo Notifications</strong> — for push notification delivery</li>
            <li><strong>Payment Gateways</strong> — for processing transactions</li>
          </ul>
          <p className="mt-3">
            We encourage you to review the privacy policies of any third-party services we use.
          </p>
        </Section>

        <Section title="10. Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            significant changes by updating the &quot;Last updated&quot; date at the top of this policy.
            Continued use of the App after changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold text-gray-800">ASR Loyalty</p>
            <p className="text-gray-700">Email: <a href="mailto:asrloyalty@gmail.com" className="text-blue-600 hover:underline">asrloyalty@gmail.com</a></p>
          </div>
        </Section>

        <p className="mt-12 text-sm text-gray-400 border-t pt-6">
          This Privacy Policy applies to the ASR Loyalty mobile application available on iOS and Android.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">{children}</h3>;
}
