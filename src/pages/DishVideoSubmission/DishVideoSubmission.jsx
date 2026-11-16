import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, Clock3, Pause, Play, Search, Sparkles, Trash2, Upload, Utensils, Wallet } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import './DishVideoSubmission.css';

const sampleVideos = [
  { title: 'Dosa', src: '/images/dosa.mp4', poster: '/images/dosa-poster.jpg' },
  { title: 'Cheese Burst Pizza', src: '/images/cheezeburstpizza.mp4', poster: '/images/cheezeburstpizza-poster.jpg' },
  { title: 'Fries', src: '/images/friess.mp4', poster: '/images/friess-poster.jpg' },
];
const faqs = [
  ['Do I need to edit my video?', 'No. A great clip straight from your camera is enough. Edited videos are welcome too—just keep the dish as the main focus.'],
  ['What should my video look like?', 'Show only one dish per video. If you ordered several dishes, film a separate clip for each one you want to share. Aim for 15–30 seconds. Shoot close, use good light, and show the food in motion: sizzling, pouring, breaking or stretching. Portrait is great for a phone screen, but landscape is welcome too.'],
  ['How much will I earn?', 'You earn ₹30 for each approved video, paid to your UPI ID. Standout videos may earn more. Uploading a video does not guarantee approval or payment.'],
  ['Which restaurant can I film at?', 'Choose a restaurant from the list when adding your dish details. You can film a dine-in, takeaway or delivery order from that restaurant.'],
];

function SampleVideo({ sample, onStart }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video.paused) {
      video.pause();
      return;
    }
    onStart(video);
    setError(false);
    try {
      await video.play();
    } catch (error) {
      if (error.name !== 'AbortError') setError(true);
    }
  }

  return (
    <article>
      <div className="dish-sample-player">
        <video
          ref={videoRef}
          src={sample.src}
          poster={sample.poster}
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => { setPlaying(false); setError(true); }}
        />
        <button
          type="button"
          className="dish-sample-play"
          data-playing={playing}
          aria-label={`${playing ? 'Pause' : 'Play'} ${sample.title}`}
          onClick={togglePlayback}
        >
          <span>{playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</span>
        </button>
      </div>
      <h3>{sample.title}</h3>
      {error && <p role="status">Couldn’t play this sample. Try again.</p>}
    </article>
  );
}

function SearchableRestaurant({ restaurants, status, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const filtered = restaurants.filter(item => item.restaurant_name.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return <div className="dish-field" ref={rootRef} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <label htmlFor="restaurant-search">Restaurant</label>
    <button id="restaurant-search" type="button" className="dish-select" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="dish-restaurants">
      <Utensils size={18} /><span className={value ? '' : 'dish-placeholder'}>{value || 'Choose your restaurant'}</span><ChevronDown size={18} />
    </button>
    {open && <div className="dish-dropdown" id="dish-restaurants">
      <div className="dish-dropdown-search"><Search size={18} /><input autoFocus aria-label="Search restaurants" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name…" /></div>
      <div className="dish-dropdown-list">{filtered.length ? filtered.map(item => <button type="button" key={item.id} onClick={() => { onChange(item); setOpen(false); setQuery(''); }}>{item.restaurant_name}{value === item.restaurant_name && <Check size={16} />}</button>) : <p>{status === 'loading' ? 'Loading restaurants…' : status === 'error' ? 'Could not load restaurants. Please refresh to try again.' : 'No restaurants found.'}</p>}</div>
    </div>}
  </div>;
}

export default function DishVideoSubmission() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantStatus, setRestaurantStatus] = useState('loading');
  const [restaurant, setRestaurant] = useState(null);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ mobile: '', upi: '' });
  const [notice, setNotice] = useState('');
  const videosRef = useRef([]);
  const fileRef = useRef(null);
  const activeSampleRef = useRef(null);

  function startSample(video) {
    if (activeSampleRef.current !== video) activeSampleRef.current?.pause();
    activeSampleRef.current = video;
  }
  useEffect(() => {
    let active = true;
    supabase.from('partners').select('id, restaurant_name').order('restaurant_name').then(({ data, error }) => {
      if (!active) return;
      setRestaurantStatus(error ? 'error' : 'ready');
      if (data) setRestaurants(data.filter(row => row.restaurant_name));
    }).catch(() => { if (active) setRestaurantStatus('error'); });
    return () => { active = false; };
  }, []);
  useEffect(() => { videosRef.current = videos; }, [videos]);
  useEffect(() => () => videosRef.current.forEach(item => URL.revokeObjectURL(item.url)), []);
  const addVideos = files => {
    const all = Array.from(files || []);
    const selected = all.filter(file => file.type.startsWith('video/'));
    setVideos(current => [...current, ...selected.map(file => ({ file, dish: '', url: URL.createObjectURL(file), id: crypto.randomUUID() }))]);
    setNotice(selected.length < all.length ? 'Only video files can be added. Please choose a video from your gallery.' : '');
  };
  const removeVideo = id => {
    const item = videos.find(video => video.id === id);
    if (item) URL.revokeObjectURL(item.url);
    setVideos(current => current.filter(video => video.id !== id));
  };
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const updateDish = (id, dish) => setVideos(current => current.map(item => item.id === id ? { ...item, dish } : item));
  const handleSubmit = event => {
    event.preventDefault();
    if (!videos.length) { setNotice('Add at least one dish video first.'); return; }
    if (!restaurant) { setNotice('Choose the restaurant where you had the dish.'); return; }
    setNotice('Your videos are ready, but submissions are not open yet. Nothing has been uploaded or saved.');
  };

  return <>
    <Helmet><title>Upload your dish video | Fuudr</title><meta name="description" content="Capture the sizzle, share your dish video and earn ₹30 per approved clip. Raw or edited—your food, your way." /><meta name="robots" content="noindex, follow" /></Helmet>
    <main className="dish-page">
      <header className="dish-topbar"><a href="/" className="dish-brand" aria-label="Fuudr home"><img src="/favicon.png" alt="" />fuudr<span>.</span></a><span className="dish-topbar-label">FOR THE LOVE OF FOOD</span><a className="dish-topbar-link" href="#submit">Start creating <ArrowUpRight size={16} /></a></header>
      <section className="dish-hero dish-container">
        <div className="dish-hero-copy">
          <span className="dish-eyebrow"><span /> CREATE • UPLOAD • EARN</span>
          <h1>Create &amp; upload a short video.<br /><em>Earn ₹30 per approved reel.</em></h1>
          <p>Film one dish per video. Show the sizzle, cheese pull, steam or crunch. Upload it raw or edited.</p>
          <div className="dish-hero-actions"><a href="#submit" className="dish-primary">Upload your video <ArrowUpRight size={20} /></a><a href="#guidelines" className="dish-text-link">See sample videos <ArrowDown size={16} /></a></div>
          <div className="dish-hero-note"><Check size={16} /> Paid straight to your UPI.</div>
        </div>
        <div className="dish-hero-visual">
          <div className="dish-food-frame"><img src="/images/fuudr-discovery-creamy-pasta-reel.webp" alt="A freshly baked pizza with melted cheese and herbs, a close-up shot idea for your dish video" fetchPriority="high" /><div className="dish-frame-top"><span><span /> SHOT INSPIRATION</span><Sparkles size={20} /></div><div className="dish-frame-caption"><span>SHOW THE DISH UP CLOSE</span><p>Show what makes<br />it delicious.</p><div><Clock3 size={15} /> Aim for 15–30 seconds</div></div></div>
          <div className="dish-reward-sticker"><Wallet size={22} /><div><strong>₹30<span> / video</span></strong><small>Once approved. Straight to UPI.</small></div></div>
          
        </div>
      </section>
      <div className="dish-process dish-container"><div><span>01</span><p><strong>Film one dish per video</strong><small>Film a separate clip for each dish.</small></p></div><div><span>02</span><p><strong>Upload your reel or video</strong><small>Raw and edited videos are welcome.</small></p></div><div><span>03</span><p><strong>Earn after approval</strong><small>₹30 for every approved video.</small></p></div></div>
      <section className="dish-inspiration dish-container" id="guidelines">
        <div className="dish-section-heading">
          <h2>Sample videos</h2>
          <p>Tap play to see how to film your dish up close.</p>
        </div>
        <div className="dish-sample-videos">
          {sampleVideos.map(sample => <SampleVideo key={sample.src} sample={sample} onStart={startSample} />)}
        </div>
      </section>
      <section className="dish-submit-section" id="submit">
        <div className="dish-submit-layout dish-container">
          <form className="dish-form" onSubmit={handleSubmit}>
            <div className="dish-form-section"><div className="dish-step-heading"><h3>Add your videos</h3></div>
              <div className="dish-upload-zone"><p><strong>One dish per video.</strong> To show another dish, upload a separate clip.</p><button className="dish-primary" type="button" onClick={() => fileRef.current?.click()}><Upload size={18} />{videos.length ? 'Add more videos' : 'Upload videos'}</button></div>
              <input ref={fileRef} type="file" accept="video/*" multiple onChange={event => { addVideos(event.target.files); event.target.value = ''; }} hidden />
              {videos.length > 0 && <div className="dish-video-list"><p className="dish-preview-label"><Check size={16} /> {videos.length} {videos.length === 1 ? 'video' : 'videos'} selected · Tap play to preview</p>{videos.map((item, index) => <article className="dish-video-item" key={item.id}><div className="dish-video-toolbar"><b>Clip {String(index + 1).padStart(2, '0')}</b><button type="button" aria-label={`Remove video ${index + 1}`} onClick={() => removeVideo(item.id)}><Trash2 size={17} /> Remove</button></div><video src={item.url} controls playsInline preload="metadata" onError={() => setNotice('One clip cannot be previewed in this browser. Try an MP4 video for wider compatibility.')} /><div className="dish-video-details"><small title={item.file.name}>{item.file.name}</small><label htmlFor={`dish-${item.id}`}>What’s the dish called?</label><input id={`dish-${item.id}`} value={item.dish} onChange={event => updateDish(item.id, event.target.value)} placeholder="e.g. Creamy Alfredo pasta" required /></div></article>)}</div>}
            </div>
            <div className="dish-form-section"><SearchableRestaurant restaurants={restaurants} status={restaurantStatus} value={restaurant?.restaurant_name} onChange={setRestaurant} /></div>
            <div className="dish-form-section"><div className="dish-field"><label htmlFor="mobile-number">Mobile number</label><div className="dish-input-prefix"><span>+91</span><input id="mobile-number" name="mobile" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={form.mobile} onChange={update} placeholder="10-digit mobile number" required /></div></div><div className="dish-field"><label htmlFor="upi-id">UPI ID</label><input id="upi-id" name="upi" autoCapitalize="none" spellCheck={false} value={form.upi} onChange={update} placeholder="yourname@bank" pattern="[^\s@]+@[^\s@]+" required /></div></div>
            <label className="dish-consent"><input type="checkbox" required /><span>I confirm that I created these videos. Only approved videos earn a reward.</span></label>
            <button className="dish-primary dish-submit-button" type="submit">Submit <ArrowUpRight size={19} /></button>
            {notice && <p className="dish-notice" role="status">{notice}</p>}
          </form>
        </div>
      </section>
      <section className="dish-faq-section dish-container"><div><span className="dish-eyebrow">NEED HELP?</span><h2>Common questions</h2></div><div className="dish-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></section>
      <footer className="dish-footer dish-container"><a href="/" className="dish-brand">fuudr<span>.</span></a><p>Made for food worth sharing.</p><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div></footer>
    </main>
  </>;
}
