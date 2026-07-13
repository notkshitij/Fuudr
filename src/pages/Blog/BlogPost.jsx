import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import posts from '../../data/blogPosts.json';
import './Blog.css';

export function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  // Generate Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.description,
    "image": `https://fuudr.com${post.image}`,
    "datePublished": post.date,
    "author": {
      "@type": "Organization",
      "name": "Fuudr",
      "url": "https://fuudr.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Fuudr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fuudr.com/icon.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://fuudr.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | Fuudr Discover</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://fuudr.com/blog/${post.slug}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://fuudr.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={`https://fuudr.com${post.image}`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://fuudr.com/blog/${post.slug}`} />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={`https://fuudr.com${post.image}`} />
        <meta name="twitter:site" content="@tryfuudr" />

        {/* JSON-LD Breadcrumbs and Article */}
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
            },{
              "@type": "ListItem",
              "position": 3,
              "name": "${post.title}",
              "item": "https://fuudr.com/blog/${post.slug}"
            }]
          }
        `}</script>
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <div className="blog-page font-[var(--sans)] bg-[var(--bg-light)] min-h-screen text-black">
        <header className="blog-header flex justify-between items-center px-[var(--margin-mobile)] md:px-[var(--gutter)] py-6 border-b-4 border-black bg-white">
          <Link to="/" className="blog-logo font-[var(--xl)] text-4xl text-[var(--bg)] tracking-wide select-none no-underline filter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            fuudr
          </Link>
          <div className="flex gap-4">
            <Link to="/blog" className="brutal-btn bg-white text-black px-4 py-2 border-2 border-black rounded-lg font-semibold shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all no-underline">
              ← Blog
            </Link>
          </div>
        </header>

        <main className="max-w-[800px] mx-auto px-[var(--margin-mobile)] py-[60px]">
          <article className="post-container bg-white border-4 border-black rounded-3xl p-6 md:p-10 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="flex gap-4 text-sm font-semibold text-gray-600 mb-4">
              <span>{post.date}</span>
              <span>•</span>
              <span>By {post.author}</span>
            </div>
            
            <h1 className="font-[var(--xl)] text-3xl md:text-5xl mb-8 leading-tight text-black">
              {post.title}
            </h1>

            <div className="w-100 aspect-video rounded-2xl overflow-hidden border-3 border-black mb-10">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="post-content text-lg leading-relaxed text-gray-800 space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </main>

        <footer className="border-t-4 border-black py-8 bg-white text-center font-bold text-gray-600 mt-20">
          © {new Date().getFullYear()} Fuudr. All rights reserved.
        </footer>
      </div>
    </>
  );
}
