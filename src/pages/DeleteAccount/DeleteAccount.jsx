import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './DeleteAccount.css';

const LAST_UPDATED = 'July 3, 2026';

export default function DeleteAccount() {
  return (
    <>
      <Helmet>
        <title>Delete Your Account | Fuudr</title>
        <meta
          name="description"
          content="Learn how to delete your Fuudr account and request deletion of your personal data."
        />
      </Helmet>

      <div className="da-page">
        <header className="da-header">
          <Link to="/" className="da-logo">Fuudr</Link>
          <Link to="/" className="brutal-btn da-back-btn">← Back to Home</Link>
        </header>

        <div className="da-container">
          <aside className="da-sidebar">
            <h3>Sections</h3>
            <a href="#how-to-delete">1. How to Delete</a>
            <a href="#request-without-app">2. Request Without App</a>
            <a href="#what-gets-deleted">3. What Gets Deleted</a>
            <a href="#what-we-retain">4. What We Retain</a>
            <a href="#contact-us">5. Contact Us</a>
          </aside>

          <main className="da-card">
            <h1 className="da-title">Delete Your Account</h1>
            <div className="da-updated">Last updated: {LAST_UPDATED}</div>

            <p>
              At Fuudr, we value your privacy and give you full control over your personal data. 
              If you decide you no longer want to use our platform, you can delete your account and associated 
              data at any time. This page explains how to request deletion and what data is removed.
            </p>

            <h2 id="how-to-delete">1. How to delete your account (In-App)</h2>
            <p>
              The fastest way to delete your account is directly through the Fuudr mobile app:
            </p>
            <ul>
              <li>Open the <strong>Fuudr app</strong> on your device.</li>
              <li>Go to your <strong>Profile</strong> tab.</li>
              <li>Open <strong>Settings</strong> (gear icon).</li>
              <li>Navigate to <strong>Help &amp; Support</strong>.</li>
              <li>Tap on <strong>Delete Account</strong>.</li>
              <li>Follow the prompts and confirm your request twice to permanently delete your account.</li>
            </ul>

            <h2 id="request-without-app">2. Request deletion without the app</h2>
            <p>
              If you have already uninstalled the app or are unable to access your device, you can submit a manual 
              deletion request via email:
            </p>
            <ul>
              <li>
                Send an email to <a href="mailto:harshagrawal7878@gmail.com">harshagrawal7878@gmail.com</a>.
              </li>
              <li>
                Use the subject line <strong>"Delete My Account"</strong>.
              </li>
              <li>
                Make sure to send the request from the <strong>registered email address</strong> associated with your Google Sign-In or Fuudr account so we can verify your identity.
              </li>
            </ul>
            <p>
              Once verified, we will process your deletion request and purge your personal data within <strong>30 days</strong>.
            </p>

            <h2 id="what-gets-deleted">3. What gets deleted</h2>
            <p>
              When your account is deleted, the following information is permanently removed from our databases:
            </p>
            <ul>
              <li><strong>Account information:</strong> Your name, registered email address, and Google profile picture.</li>
              <li><strong>Profile data:</strong> Your phone number, date of birth, and any saved delivery addresses.</li>
              <li><strong>Order history:</strong> Records of your previous orders and transactions inside the app.</li>
              <li><strong>Interactions:</strong> Your saved or liked reels/videos, feedback, and app preferences.</li>
            </ul>

            <h2 id="what-we-retain">4. What we retain</h2>
            <p>
              Please note that certain data cannot be immediately deleted due to legal obligations:
            </p>
            <ul>
              <li>
                <strong>Financial/Transaction Records:</strong> We are legally required to retain transaction histories, 
                tax invoices, and accounting records for tax and auditing purposes.
              </li>
              <li>
                <strong>Anonymized Data:</strong> We may retain aggregate or anonymized data (which cannot be traced 
                back to you) to maintain platform analytics and service performance metrics.
              </li>
            </ul>

            <h2 id="contact-us">5. Contact Us</h2>
            <p>
              If you have any questions or encounter issues while deleting your account, please reach out to us 
              directly at <a href="mailto:harshagrawal7878@gmail.com">harshagrawal7878@gmail.com</a>.
            </p>
          </main>
        </div>

        <footer className="da-footer">
          © {new Date().getFullYear()} Fuudr. All rights reserved.
        </footer>
      </div>
    </>
  );
}
