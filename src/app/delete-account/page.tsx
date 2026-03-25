import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account — ASR Loyalty',
  description: 'Request deletion of your ASR Loyalty account and associated data.',
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Delete Your Account</h1>
        </div>

        <p className="text-gray-600 mb-8 leading-relaxed">
          You can request the deletion of your ASR Loyalty account and all associated personal data
          by contacting our support team. We will process your request within <strong>7 business days</strong>.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to request account deletion</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-sm flex items-center justify-center flex-shrink-0 font-semibold">1</span>
              <span>Send an email to <a href="mailto:asrloyalty@gmail.com" className="text-red-600 font-medium hover:underline">asrloyalty@gmail.com</a></span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-sm flex items-center justify-center flex-shrink-0 font-semibold">2</span>
              <span>Use the subject line: <strong>Account Deletion Request</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-sm flex items-center justify-center flex-shrink-0 font-semibold">3</span>
              <span>Include the email address or phone number linked to your account</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-sm flex items-center justify-center flex-shrink-0 font-semibold">4</span>
              <span>We will confirm your request and delete your account within 7 business days</span>
            </li>
          </ol>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-amber-800 mb-2">What data will be deleted</h3>
          <ul className="space-y-1 text-amber-700 text-sm">
            <li>• Your name, email address, and phone number</li>
            <li>• Your account profile and preferences</li>
            <li>• Your loyalty points and reward history</li>
            <li>• Your push notification tokens</li>
          </ul>
          <p className="text-amber-700 text-sm mt-3">
            <strong>Note:</strong> Transaction records may be retained for up to 90 days for legal
            and financial compliance purposes before being permanently deleted.
          </p>
        </div>

        <a
          href="mailto:asrloyalty@gmail.com?subject=Account%20Deletion%20Request"
          className="inline-block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Send Deletion Request
        </a>

        <p className="text-center text-sm text-gray-400 mt-6">
          ASR Loyalty · <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
        </p>
      </div>
    </main>
  );
}
