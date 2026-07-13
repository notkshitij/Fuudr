import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

export function BlogList() {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Food Discovery', 'Restaurant Growth'];

  // Filter posts based on category
  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'All') return true;
    return getCategory(post.slug) === activeCategory;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

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

      <div className="blog-page min-h-screen text-[#14213D] pt-[100px] md:pt-[130px] font-[var(--sans)]">
        {/* Navigation Bar */}
        <Navbar />

        <main className="max-w-[var(--container-max)] mx-auto px-[var(--margin-mobile)] md:px-[var(--gutter)] py-4 md:py-8">
          {/* Header section */}
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-block bg-[var(--bg)] text-black border-2 border-black px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#000] rotate-[-1deg] mb-4">
              Fuudr Editorial
            </div>
            <h1 className="font-[var(--xl)] text-4xl md:text-5xl uppercase mb-4 text-black tracking-tight leading-none filter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
              Fuudr Discover
            </h1>
            <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
              Read the latest stories, guides, and updates on local food discovery and restaurant marketing technology.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 mb-10 border-b-2 border-black/10 pb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`filter-btn px-4 py-2 border-2 border-black rounded-full font-extrabold text-xs md:text-sm cursor-pointer shadow-[2px_2px_0px_#000] hover:bg-white active:translate-y-[1px] ${
                  activeCategory === category
                    ? 'active bg-[var(--bg)] text-black'
                    : 'bg-white text-black'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Fallback for Empty Posts */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_#000]">
              <p className="text-xl font-bold">No articles found in this category.</p>
            </div>
          )}

          {/* Featured Post Card */}
          {featuredPost && (
            <section className="mb-12">
              <article className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border-4 border-black rounded-[24px] p-5 md:p-6 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] transition-all duration-300">
                <div className="lg:col-span-7 aspect-video lg:aspect-[16/9] rounded-xl overflow-hidden border-3 border-black blog-card-img-wrapper">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    loading="eager"
                    className="w-full h-full object-cover blog-card-img"
                  />
                </div>
                
                <div className="lg:col-span-5 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-[var(--bg)] text-black border-2 border-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#000]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Featured
                      </span>
                      <span className={`border-2 border-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] ${
                        getCategory(featuredPost.slug) === 'Food Discovery' ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'
                      }`}>
                        {getCategory(featuredPost.slug)}
                      </span>
                    </div>

                    <h2 className="font-[var(--xl)] text-2xl md:text-3xl text-black hover:text-[var(--bg)] transition-colors leading-tight mb-3">
                      <Link to={`/blog/${featuredPost.slug}`} className="text-black no-underline hover:text-[var(--bg)] transition-colors">
                        {featuredPost.title}
                      </Link>
                    </h2>

                    <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed mb-4">
                      {featuredPost.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 mb-4">
                      <div className="w-8 h-8 rounded-full border-2 border-black bg-[var(--bg)] text-black flex items-center justify-center font-black">
                        F
                      </div>
                      <div>
                        <p className="text-black leading-none font-bold mb-0.5">{featuredPost.author}</p>
                        <p className="text-[10px] leading-none">{featuredPost.date}</p>
                      </div>
                    </div>

                    <Link to={`/blog/${featuredPost.slug}`} className="brutal-btn w-fit bg-[var(--bg)] text-black px-5 py-2.5 border-2 border-black rounded-lg font-extrabold text-base shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] transition-all no-underline">
                      Read Article →
                    </Link>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularPosts.map((post) => (
                <article key={post.slug} className="blog-card bg-white border-3 border-black rounded-[20px] p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all duration-300">
                  <div>
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-black mb-6 blog-card-img-wrapper">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover blog-card-img"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`border-2 border-black px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000] ${
                        getCategory(post.slug) === 'Food Discovery' ? 'bg-[#4ADE80]' : 'bg-[#C084FC]'
                      }`}>
                        {getCategory(post.slug)}
                      </span>
                    </div>

                    <h2 className="font-[var(--xl)] text-xl md:text-2xl mb-3 hover:text-[var(--primary)] transition-colors leading-tight">
                      <Link to={`/blog/${post.slug}`} className="text-black no-underline hover:text-[var(--bg)] transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    
                    <p className="text-gray-600 text-sm font-medium leading-relaxed line-clamp-3 mb-4">
                      {post.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <div className="w-6 h-6 rounded-full border border-black bg-gray-100 flex items-center justify-center font-black text-black">
                        {post.author[0]}
                      </div>
                      <span>{post.date}</span>
                    </div>
                    
                    <Link to={`/blog/${post.slug}`} className="brutal-btn bg-white text-black px-3.5 py-1.5 border-2 border-black rounded-lg font-extrabold text-xs shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] transition-all no-underline">
                      Read
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Brand Waitlist Footer */}
        <WaitlistFooter />
      </div>
    </>
  );
}

