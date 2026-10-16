import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.fuudr.app';

export default function Share() {
  return (
    <>
      <Helmet>
        <title>Open in Fuudr | Food Reels App</title>
        <meta
          name="description"
          content="This link was shared from the Fuudr app. Download Fuudr from Google Play to watch food reels and order instantly."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#FCA311',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            background: '#fff',
            border: '3px solid #000',
            boxShadow: '8px 8px 0 #000',
            borderRadius: '16px',
            padding: '36px 28px',
            textAlign: 'center',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <img
            src="/favicon.png"
            alt="Fuudr"
            width="72"
            height="72"
            style={{ borderRadius: '16px', marginBottom: '16px' }}
          />

          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 0 12px',
              color: '#000',
            }}
          >
            Open this in Fuudr
          </h1>

          <p style={{ fontSize: '16px', lineHeight: 1.5, margin: '0 0 28px', color: '#333' }}>
            This link was shared from the Fuudr app. If you have the app, it will open there.
            If not, get Fuudr to watch food reels and order instantly.
          </p>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: '#000',
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              padding: '14px 20px',
              borderRadius: '12px',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            Get it on Google Play
          </a>

          <Link
            to="/"
            style={{
              display: 'block',
              color: '#000',
              fontWeight: 700,
              fontSize: '15px',
              padding: '12px 20px',
              border: '2px solid #000',
              borderRadius: '12px',
              textDecoration: 'none',
            }}
          >
            Visit fuudr.com
          </Link>
        </div>
      </main>
    </>
  );
}
