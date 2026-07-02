import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './TermsOfService.css';

const LAST_UPDATED = 'July 2, 2026';

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Fuudr</title>
        <meta
          name="description"
          content="Fuudr's Terms of Service — the rules for using the Fuudr app to discover, order, and receive food."
        />
      </Helmet>

      <div className="tos-page">
        <header className="tos-header">
          <Link to="/" className="tos-logo">Fuudr</Link>
          <Link to="/" className="brutal-btn tos-back-btn">← Back to Home</Link>
        </header>

        <main className="tos-card">
          <h1 className="tos-title">Terms of Service</h1>
          <p className="tos-updated">Last updated: {LAST_UPDATED}</p>

          <p>
            These Terms of Service ("Terms") govern your access to and use of the Fuudr mobile
            application and related services (together, the "App"), operated by Fuudr ("we",
            "us", or "our"). By creating an account or using the App, you agree to be bound by
            these Terms. If you do not agree, please do not use the App.
          </p>

          <h2>1. Eligibility</h2>
          <p>
            You must be at least 13 years old to create a Fuudr account. If you are under 18,
            you may only use the App with the involvement of a parent or legal guardian. By
            using the App, you confirm that you meet these requirements.
          </p>

          <h2>2. Your Account</h2>
          <p>
            You sign in to Fuudr using Google Sign-In. You are responsible for keeping your
            account secure and for all activity that happens under your account. Let us know
            immediately at <a href="mailto:solvers.real@gmail.com">solvers.real@gmail.com</a> if you
            suspect unauthorized use of your account.
          </p>

          <h2>3. What Fuudr Does</h2>
          <p>
            Fuudr lets you discover food through short videos and place orders with partner
            restaurants near your location. <strong>Fuudr is a discovery and ordering
            platform — the food itself is prepared and, in most cases, delivered by
            independent restaurant partners</strong>, not by Fuudr directly. We are not
            responsible for the quality, safety, or preparation of food prepared by restaurant
            partners, though we take reports of issues seriously and will assist in resolving
            them where we can.
          </p>

          <h2>4. Orders, Pricing &amp; Payment</h2>
          <ul>
            <li>Menu prices, availability, and delivery times are set by restaurant partners and may change without notice.</li>
            <li>Once an order is placed and accepted by a restaurant, it generally cannot be cancelled — check the order summary carefully before confirming.</li>
            <li>Payments are processed securely through our third-party payment gateway. Fuudr does not store your full card or bank details.</li>
            <li>Delivery or platform fees, where applicable, will be shown clearly before you confirm an order.</li>
          </ul>

          <h2>5. Cancellations &amp; Refunds</h2>
          <p>
            If an order is cancelled by the restaurant, delayed significantly, or arrives
            incorrect or unsafe to consume, contact us at{' '}
            <a href="mailto:solvers.real@gmail.com">solvers.real@gmail.com</a> within 24 hours with your
            order details. Refunds, where approved, are processed back to your original
            payment method and may take 5–7 business days to reflect, depending on your bank
            or payment provider.
          </p>

          <h2>6. Location Services</h2>
          <p>
            The App uses your device's location (with your permission) to show you nearby
            restaurants and estimate delivery. You can disable location access from your
            device settings at any time, though some features may not work correctly without
            it.
          </p>

          <h2>7. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the App for any unlawful purpose or to place fraudulent orders</li>
            <li>Attempt to interfere with, disrupt, or gain unauthorized access to the App or its systems</li>
            <li>Impersonate another person or misrepresent your affiliation with anyone</li>
            <li>Upload or share content through the App that is abusive, obscene, or infringes on someone else's rights</li>
            <li>Reverse-engineer, scrape, or resell any part of the App without our written permission</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these Terms.
          </p>

          <h2>8. Content in the App</h2>
          <p>
            Food videos, photos, and descriptions shown in the App may be provided by
            restaurant partners or created by Fuudr. All App content, branding, and
            trademarks belong to Fuudr or its partners and may not be copied or reused without
            permission.
          </p>

          <h2>9. Third-Party Services</h2>
          <p>
            The App relies on third-party services — including Google Sign-In for
            authentication, Supabase for backend infrastructure, and a payment gateway for
            processing payments. Your use of these services is also subject to their
            respective terms and privacy policies.
          </p>

          <h2>10. Disclaimers</h2>
          <p>
            The App is provided "as is" and "as available." We do not guarantee that the App
            will be uninterrupted, error-free, or that restaurant partners will always fulfil
            orders as expected. To the fullest extent permitted by law, Fuudr disclaims all
            warranties, express or implied, regarding the App and the food ordered through it.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Fuudr will not be liable for any indirect,
            incidental, or consequential damages arising from your use of the App, including
            issues with food quality, delivery delays, or actions of restaurant partners. Our
            total liability for any claim relating to the App will not exceed the amount you
            paid for the order giving rise to the claim.
          </p>

          <h2>12. Account Termination</h2>
          <p>
            You may stop using the App and delete your account at any time — see our{' '}
            <Link to="/privacy">Privacy Policy</Link> for how to request account deletion. We
            may suspend or terminate your access if you violate these Terms or misuse the App.
          </p>

          <h2>13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will
            notify you in the App or update the "Last updated" date above. Continued use of
            the App after changes take effect means you accept the revised Terms.
          </p>

          <h2>14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India, without regard to conflict-of-law
            principles. Any disputes arising from these Terms or your use of the App will be
            subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.
          </p>

          <h2>15. Contact Us</h2>
          <p>
            Questions about these Terms? Reach us at{' '}
            <a href="mailto:solvers.real@gmail.com">solvers.real@gmail.com</a>.
          </p>
        </main>

        <footer className="tos-footer">
          © {new Date().getFullYear()} Fuudr. All rights reserved.
        </footer>
      </div>
    </>
  );
}
