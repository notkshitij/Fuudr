import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../components/Navbar/Navbar';
import { WaitlistFooter } from '../../components/WaitlistFooter/WaitlistFooter';
import posts from '../../data/blogPosts.json';
import './Blog.css';

// Dynamic category mapping based on post content/slug
const getCategory = (slug) => {
  if (slug.includes('grow') || slug.includes('restaurant') || slug.includes('partner')) {
    return 'Restaurant Growth';
  }
  return 'Food Discovery';
};

export function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Monitor scroll behavior for progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollPercent(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Recommendations: exclude current post
  const relatedPosts = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

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

      {/* Reading Progress Indicator */}
      <div className="reading-progress-container">
        <div 
          className="reading-progress-bar" 
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      <div className="blog-page min-h-screen text-[#14213D] pt-[90px] md:pt-[110px] font-[var(--sans)] pb-0">
        {/* Navigation Bar */}
        <Navbar />

        <main className="max-w-[720px] mx-auto px-[var(--margin-mobile)] md:px-[var(--gutter)] py-4 md:py-8">

          <article className="bg-white border-3 border-black rounded-[20px] p-4 md:p-6 shadow-[5px_5px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`border-2 border-black px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] ${
                getCategory(post.slug) === 'Food Discovery' ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'
              }`}>
                {getCategory(post.slug)}
              </span>
            </div>
            
            <h1 className="font-[var(--xl)] text-2xl md:text-3xl lg:text-3.5xl mb-4 leading-tight text-black">
              {post.title}
            </h1>

            {/* Author Details */}
            <div className="flex items-center gap-3 border-y-2 border-black/10 py-3 mb-4">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-[var(--bg)] text-black flex items-center justify-center font-black text-base shadow-[1.5px_1.5px_0px_#000]">
                {post.author[0]}
              </div>
              <div>
                <p className="text-black font-extrabold text-sm leading-none mb-1">{post.author}</p>
                <p className="text-[10px] font-semibold text-gray-500 leading-none">
                  Published on {post.date} · 2 min read
                </p>
              </div>
            </div>

            {/* Featured Image */}
            <div className="w-full h-[180px] sm:h-[240px] md:h-[280px] rounded-xl overflow-hidden border-3 border-black mb-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-[-0.5deg]">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Rich Article Paragraphs */}
            <div className="post-content leading-relaxed text-gray-800 space-y-6">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (index === 0) {
                  return (
                    <p key={index} className="text-base md:text-lg font-bold leading-relaxed text-black/85 mb-4 border-l-4 border-[var(--bg)] pl-4 italic">
                      {paragraph}
                    </p>
                  );
                }
                return <p key={index}>{paragraph}</p>;
              })}
            </div>

            {/* Share Widget (Embedded inside Article) */}
            <div className="border-t-2 border-black/10 pt-5 mt-6">
              <h3 className="font-[var(--xl)] text-sm uppercase mb-3 text-black">Share this story</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                  }}
                  className="share-btn flex items-center gap-2 bg-white text-black px-3 py-1.5 border-2 border-black rounded-lg font-bold shadow-[1.5px_1.5px_0px_#000] cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Share on X
                </button>
                <button 
                  onClick={() => {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' - ' + window.location.href)}`, '_blank');
                  }}
                  className="share-btn flex items-center gap-2 bg-white text-black px-3 py-1.5 border-2 border-black rounded-lg font-bold shadow-[1.5px_1.5px_0px_#000] cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.244 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.953-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.666.988 3.396 1.502 5.354 1.503 5.437 0 9.862-4.424 9.865-9.864.001-2.636-1.026-5.11-2.89-6.975C17.062 1.954 14.59 .928 11.996.928c-5.44 0-9.866 4.424-9.868 9.864-.001 1.83.48 3.619 1.4 5.181l-.955 3.486 3.574-.937zm12.39-7.399c-.33-.165-1.951-.963-2.251-1.072-.3-.109-.518-.165-.736.165-.218.329-.84 1.072-1.03 1.29-.19.219-.38.244-.71.079-.33-.165-1.393-.513-2.656-1.639-.982-.876-1.644-1.959-1.836-2.289-.193-.33-.021-.508.143-.671.149-.147.33-.385.495-.578.165-.192.22-.329.33-.548.11-.22.055-.411-.027-.575-.083-.165-.736-1.775-1.009-2.434-.266-.643-.538-.553-.736-.563-.19-.01-.409-.012-.627-.012-.218 0-.573.082-.873.411-.3.329-1.145 1.118-1.145 2.724 0 1.605 1.171 3.158 1.334 3.377.164.22 2.304 3.518 5.582 4.933.78.337 1.388.538 1.86.688.784.249 1.498.214 2.062.13.629-.094 1.951-.797 2.224-1.566.273-.769.273-1.428.191-1.566-.082-.138-.3-.22-.63-.385z"/></svg>
                  Share on WhatsApp
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }}
                  className="share-btn flex items-center gap-2 bg-white text-black px-3 py-1.5 border-2 border-black rounded-lg font-bold shadow-[1.5px_1.5px_0px_#000] cursor-pointer text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"/></svg>
                  Copy Link
                </button>
              </div>
            </div>
          </article>

          {/* Related Articles Recommendation */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 pt-4">
              <h2 className="font-[var(--xl)] text-2xl uppercase mb-5 text-black">Read Next</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                  <article key={post.slug} className="blog-card bg-white border-3 border-black rounded-[16px] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all duration-300">
                    <div>
                      <div className="aspect-video rounded-lg overflow-hidden border-2 border-black mb-3 blog-card-img-wrapper">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          loading="lazy"
                          className="w-full h-full object-cover blog-card-img"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`border-2 border-black px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          getCategory(post.slug) === 'Food Discovery' ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'
                        }`}>
                          {getCategory(post.slug)}
                        </span>
                      </div>

                      <h3 className="font-[var(--xl)] text-lg mb-2 leading-tight hover:text-[var(--bg)] transition-colors">
                        <Link to={`/blog/${post.slug}`} className="text-black no-underline hover:text-[var(--bg)] transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 border-t border-black/5 pt-3">
                      <span className="text-[10px] font-bold text-gray-400">{post.date}</span>
                      <Link to={`/blog/${post.slug}`} className="text-xs font-extrabold text-black hover:text-[var(--bg)] transition-colors no-underline">
                        Read Story →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>

        <WaitlistFooter hideWaitlist={true} />
      </div>
    </>
  );
}

