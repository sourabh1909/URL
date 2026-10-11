export default function Footer() {
  return (
    <footer className="border-t border-nordic-border dark:border-nordic-dark-border bg-nordic-surface/50 dark:bg-nordic-dark-surface/50 py-8 text-center text-xs text-nordic-slate transition-colors">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-nordic-pine"></div>
          <span className="font-semibold text-nordic-charcoal dark:text-nordic-dark-text">ShortURL</span>
          <span>— Short links. Clear insights.</span>
        </div>
        <div className="flex items-center space-x-6">
          <span>Privacy Conscious</span>
          <span>•</span>
          <span>OAuth 2.0 / OIDC</span>
          <span>•</span>
          <span>Fast 302 Redirection</span>
        </div>
      </div>
    </footer>
  );
}
