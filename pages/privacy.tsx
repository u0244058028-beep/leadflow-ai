import Link from 'next/link'
import Layout from '@/components/Layout'

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              At myleadassistant.com, we take your privacy seriously. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when 
              you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect information you provide directly to us, such as when you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Create an account (name, email, company name)</li>
              <li>Use our AI-powered features (landing pages, lead data)</li>
              <li>Contact us for support</li>
              <li>Make payments (processed securely by Stripe)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate AI-powered lead scoring and landing pages</li>
              <li>Process your payments and manage your account</li>
              <li>Send you important updates and support messages</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored securely on Supabase and Vercel infrastructure. We use 
              industry-standard encryption and security measures to protect your information. 
              Payment processing is handled by Stripe, and we never store your credit card 
              information on our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Stripe</strong> - Payment processing</li>
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Vercel</strong> - Hosting and deployment</li>
              <li><strong>OpenAI/Puter</strong> - AI features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to access, correct, or delete your personal information. 
              You can do this through your account settings or by contacting us directly. 
              You can also export your data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@myleadassistant.com" className="text-blue-600 hover:underline">
                privacy@myleadassistant.com
              </a>
            </p>
          </section>
        </div>

        {/* Back to home */}
        <div className="text-center mt-12">
          <Link 
            href="/"
            className="inline-block px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  )
}