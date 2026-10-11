import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, QrCode, ShieldCheck, BarChart2, Check, Copy } from 'lucide-react';

export default function LandingPage() {
  const [demoUrl, setDemoUrl] = useState('https://github.com/trending');
  const [demoShort, setDemoShort] = useState('nord.link/scandi');
  const [copied, setCopied] = useState(false);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl) return;
    const sampleCodes = ['fjord', 'nordic', 'sol', 'aurora', 'oslo'];
    const chosen = sampleCodes[Math.floor(Math.random() * sampleCodes.length)];
    setDemoShort(`nord.link/${chosen}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${demoShort}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-24 py-8 sm:py-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-nordic-mist/80 dark:bg-nordic-dark-border text-nordic-pine dark:text-nordic-sage text-xs font-semibold tracking-wide border border-nordic-border/50 dark:border-nordic-dark-border">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Scandinavian Minimalist SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-nordic-charcoal dark:text-nordic-dark-text leading-[1.15]">
          Short links. <br className="hidden sm:inline" />
          <span className="text-nordic-pine dark:text-nordic-sage">Clear insights.</span>
        </h1>

        <p className="text-lg sm:text-xl text-nordic-slate max-w-2xl mx-auto font-normal leading-relaxed">
          ShortURL is a calm, privacy-conscious URL shortener with custom aliases, instant QR codes, and lightweight click analytics.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-nordic-pine text-white font-medium hover:bg-nordic-pine-light transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-surface dark:bg-nordic-dark-surface font-medium text-nordic-charcoal dark:text-nordic-dark-text hover:bg-nordic-mist/40 dark:hover:bg-nordic-dark-border transition-colors flex items-center justify-center"
          >
            Try Preview
          </a>
        </div>
      </section>

      {/* Interactive Demo Card */}
      <section id="demo" className="max-w-2xl mx-auto">
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-nordic-slate">Interactive Preview</span>
            <span className="text-xs text-nordic-slate">No registration required to try</span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label htmlFor="demo-url-input" className="block text-sm font-medium text-nordic-charcoal dark:text-nordic-dark-text mb-1.5">
                Destination URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="demo-url-input"
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://example.com/very/long/article/path"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg text-sm focus:outline-none focus:ring-2 focus:ring-nordic-pine"
                  required
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-nordic-pine text-white text-sm font-medium hover:bg-nordic-pine-light transition-colors whitespace-nowrap"
                >
                  Generate Preview
                </button>
              </div>
            </div>
          </form>

          {/* Generated Result */}
          <div className="mt-6 pt-6 border-t border-nordic-border dark:border-nordic-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-nordic-mist/50 dark:bg-nordic-dark-border flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-nordic-slate">Short Link Preview</div>
                <div className="font-semibold text-nordic-pine dark:text-nordic-sage text-base tracking-tight">{demoShort}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-nordic-border dark:border-nordic-dark-border hover:bg-nordic-mist/50 dark:hover:bg-nordic-dark-border transition-colors text-nordic-charcoal dark:text-nordic-dark-text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <Link
                to="/login"
                className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-nordic-mist/80 dark:bg-nordic-dark-border text-nordic-pine dark:text-nordic-sage hover:bg-nordic-mist transition-colors"
              >
                <span>Save to Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Pillar Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-7 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-nordic-mist/50 dark:bg-nordic-dark-border flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-nordic-charcoal dark:text-nordic-dark-text">Secure OAuth Sign-In</h3>
          <p className="text-sm text-nordic-slate leading-relaxed">
            Direct authentication with Google and GitHub. No passwords stored, zero session risk, and safe account boundaries.
          </p>
        </div>

        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-7 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-nordic-mist/50 dark:bg-nordic-dark-border flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-nordic-charcoal dark:text-nordic-dark-text">Instant QR Codes</h3>
          <p className="text-sm text-nordic-slate leading-relaxed">
            Generate clean, scannable QR codes for print, presentations, and social media with Nordic aesthetic styling.
          </p>
        </div>

        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-7 space-y-3">
          <div className="w-11 h-11 rounded-xl bg-nordic-mist/50 dark:bg-nordic-dark-border flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-nordic-charcoal dark:text-nordic-dark-text">Privacy-First Analytics</h3>
          <p className="text-sm text-nordic-slate leading-relaxed">
            Track clicks, device categories, and referrers without invasive personal tracking or persistent IP logging.
          </p>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-nordic-mist/40 dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-nordic-charcoal dark:text-nordic-dark-text">
          Ready to simplify your links?
        </h2>
        <p className="text-sm sm:text-base text-nordic-slate max-w-lg mx-auto">
          Create custom aliases and view click analytics in seconds with your Google or GitHub account.
        </p>
        <div>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-nordic-pine text-white font-semibold hover:bg-nordic-pine-light transition-all shadow-sm active:scale-95"
          >
            <span>Sign In to ShortURL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
