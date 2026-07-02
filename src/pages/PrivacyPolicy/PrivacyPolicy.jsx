import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './PrivacyPolicy.css';

const LAST_UPDATED = 'July 2, 2026';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Fuudr</title>
        <meta
          name="description"
          content="Fuudr's privacy policy — what data we collect, why we collect it, and how you can control or delete it."
        />
      </Helmet>

      <div className="pp-page">
        <header className="pp-header">
          <Link to="/" className="pp-logo">Fuudr</Link>
          <Link to="/" className="brutal-btn pp-back-btn">← Back to Home</Link>
        </header>

        <main className="pp-card">
          <h1 className="pp-title">Privacy Policy</h1>
          <p className="pp-updated">Last updated: {LAST_UPDATED}</p>

          <p>
            Fuudr ("we", "us", or "our") operates the Fuudr mobile application (the "App"),
            a short-video-first food discovery and ordering platform. This Privacy Policy
            explains what information we collect from you, how we use it, who we share it
            with, and the choices you have — including how to delete your data.
          </p>
          <p>
            By creating an account or using the App, you agree to the collection and use of
            information in accordance with this policy.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>a. Account information (via Google Sign-In)</h3>
          <p>
            When you sign in with your Google account, we receive your <strong>name</strong>,{' '}
            <strong>email address</strong>, and <strong>profile picture</strong> from Google.
            We use this to create and identify your Fuudr account. We do not receive or store
            your Google password.
          </p>

          <h3>b. Location information</h3>
          <p>
            With your permission, we collect your device's <strong>precise (GPS) location</strong>{' '}
            while the App is open, so we can show you restaurants and food near you (within a
            configurable radius). We do not collect your location in the background when the
            App is closed, and you can disable location access at any time from your device
            settings — though some features (like "near you" recommendations) may not work
            without it.
          </p>

          <h3>c. Profile &amp; usage information</h3>
          <p>
            We store information you add to your profile — such as phone number, date of
            birth, and saved addresses — along with basic usage data (orders placed, videos
            viewed, app interactions) to operate and improve the App.
          </p>

          <h3>d. Order &amp; payment information</h3>
          <p>
            When you place an order, we collect the order details and delivery address needed
            to fulfil it. Payments are processed by a third-party payment gateway; Fuudr does
            not store your full card, UPI, or bank account credentials on its own servers.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To create and maintain your account</li>
            <li>To show you relevant restaurants and food content near your location</li>
            <li>To process and deliver your orders</li>
            <li>To personalize your experience and recommendations</li>
            <li>To communicate with you about your orders or account</li>
            <li>To maintain the security and integrity of the App</li>
          </ul>

          <h2>3. Third-Party Services</h2>
          <p>
            We use the following third-party service providers to operate Fuudr. These
            providers process data on our behalf and are contractually required to protect it:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — our backend infrastructure provider. Supabase hosts
              our database and handles authentication; all data in transit is encrypted (HTTPS).
            </li>
            <li>
              <strong>Google Sign-In</strong> — used for authentication. Google's own privacy
              policy applies to the data it collects as part of the sign-in process.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information to advertisers or other
            third parties.
          </p>

          <h2>4. Data Sharing</h2>
          <p>
            We share your information only where necessary: with restaurant partners to
            fulfil an order (name, delivery address, order items), with the payment gateway to
            process payment, and with service providers listed above who help us run the App.
            We may also disclose information if required by law.
          </p>

          <h2>5. Data Retention &amp; Deletion</h2>
          <p>
            We retain your account data for as long as your account is active. You can request
            deletion of your account and associated data at any time:
          </p>
          <ul>
            <li><strong>In-app:</strong> Go to Profile → Settings → Delete Account.</li>
            <li>
              <strong>Web request:</strong> Email us at{' '}
              <a href="mailto:solvers.real@gmail.com">solvers.real@gmail.com</a> with the subject
              "Delete My Account" from your registered email address.
            </li>
          </ul>
          <p>
            We will delete or anonymize your personal data within 30 days of a verified
            request, except where we are required to retain certain records by law (e.g.
            transaction records for tax purposes).
          </p>

          <h2>6. Data Security</h2>
          <p>
            We use industry-standard measures — including encryption in transit and access
            controls — to protect your information. However, no method of transmission or
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>7. Children's Privacy</h2>
          <p>
            Fuudr is not directed at children under 13, and we do not knowingly collect
            personal information from children under 13. If you believe a child has provided
            us with personal information, please contact us so we can remove it.
          </p>

          <h2>8. Your Choices</h2>
          <ul>
            <li>You can edit or update your profile information within the App.</li>
            <li>You can revoke location permission from your device settings at any time.</li>
            <li>You can request a copy or deletion of your data by contacting us.</li>
          </ul>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes,
            we will notify you in the App or update the "Last updated" date above. Continued
            use of the App after changes take effect constitutes acceptance of the revised
            policy.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or how we handle your data, reach
            out to us at{' '}
            <a href="mailto:solvers.real@gmail.com">solvers.real@gmail.com</a>.
          </p>
        </main>

        <footer className="pp-footer">
          © {new Date().getFullYear()} Fuudr. All rights reserved.
        </footer>
      </div>
    </>
  );
}
