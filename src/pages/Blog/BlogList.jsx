import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import posts from '../../data/blogPosts.json';
import './Blog.css';

export function BlogList() {
  return (
    <>
      <Helmet>
        <title>Discover Food Reels & Restaurant Growth | Fuudr Blog</title>
        <meta name="description" content="Explore articles from the Fuudr team about restaurant growth, food discovery through short reels, and local culinary trends." />
        <link rel="canonical" href="https://fuudr.com/blog" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fuudr.com/blog" />
        <meta property="og:title" content="Discover Food Reels & Restaurant Growth | Fuudr Blog" />
        <meta property="og:description" content="Explore articles from the Fuudr team about restaurant growth, food discovery through short reels, and local culinary trends." />
        <meta property="og:image" content="https://fuudr.com/banner.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://fuudr.com/blog" />
        <meta name="twitter:title" content="Discover Food Reels & Restaurant Growth | Fuudr Blog" />
        <meta name="twitter:description" content="Explore articles from the Fuudr team about restaurant growth, food discovery through short reels, and local culinary trends." />
        <meta name="twitter:image" content="https://fuudr.com/banner.png" />
        <meta name="twitter:site" content="@tryfuudr" />

        {/* JSON-LD Schemas */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://fuudr.com/"
            },{
              "@type": "ListItem",
              "position": 2,
              "name": "Blog",
              "item": "https://fuudr.com/blog"
            }]
          }
        `}</script>
      </Helmet>

      <div className="blog-page font-[var(--sans)] bg-[var(--bg-light)] min-h-screen text-black">
        <header className="blog-header flex justify-between items-center px-[var(--margin-mobile)] md:px-[var(--gutter)] py-6 border-b-4 border-black bg-white">
          <Link to="/" className="blog-logo font-[var(--xl)] text-4xl text-[var(--bg)] tracking-wide select-none no-underline filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            fuudr
          </Link>
          <Link to="/" className="brutal-btn bg-white text-black px-4 py-2 border-2 border-black rounded-lg font-extrabold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all no-underline">
            ← Home
          </Link>
        </header>

        <main className="max-w-[var(--container-max)] mx-auto px-[var(--margin-mobile)] md:px-[var(--gutter)] py-[60px]">
          <div className="text-center mb-16">
            <h1 className="font-[var(--xl)] text-5xl md:text-7xl uppercase mb-6 text-black tracking-tight leading-none">
              Fuudr Discover
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Read the latest stories, guides, and updates on local food discovery and restaurant marketing technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {posts.map((post) => (
              <article key={post.slug} className="blog-card bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_rgba(0,0,0,1)] transition-all">
                <div>
                  <div className="w-100 aspect-video rounded-xl overflow-hidden border-2 border-black mb-6">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-4 text-sm font-semibold text-gray-600 mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>By {post.author}</span>
                  </div>
                  <h2 className="font-[var(--xl)] text-2xl md:text-3xl mb-4 hover:text-[var(--primary)] transition-colors">
                    <Link to={`/blog/${post.slug}`} className="text-black no-underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 line-clamp-3 mb-6 leading-relaxed">
                    {post.description}
                  </p>
                </div>
                <Link to={`/blog/${post.slug}`} className="brutal-btn w-fit bg-[var(--bg)] text-black px-6 py-3 border-3 border-black rounded-xl font-extrabold text-lg shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all no-underline">
                  Read Article →
                </Link>
              </article>
            ))}
          </div>
        </main>

        <footer className="border-t-4 border-black py-8 bg-white text-center font-bold text-gray-600">
          © {new Date().getFullYear()} Fuudr. All rights reserved.
        </footer>
      </div>
    </>
  );
}
