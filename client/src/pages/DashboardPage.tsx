import { useState, useEffect, useCallback } from 'react';
import { api, ShortLink, Pagination } from '../lib/api';
import Modal from '../components/Modal';
import {
  Link as LinkIcon,
  Copy,
  Check,
  QrCode,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  MousePointerClick,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  // Form State
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [aliasChecking, setAliasChecking] = useState(false);
  const [aliasAvailable, setAliasAvailable] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newlyCreatedLink, setNewlyCreatedLink] = useState<ShortLink | null>(null);

  // Link List State
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks' | 'shortCode'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [editModalLink, setEditModalLink] = useState<ShortLink | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteModalLink, setDeleteModalLink] = useState<ShortLink | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listLinks({
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
      });
      setLinks(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load links', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Live alias check debounce
  useEffect(() => {
    if (!customAlias.trim() || customAlias.length < 3) {
      setAliasAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setAliasChecking(true);
        const res = await api.checkAlias(customAlias.trim());
        setAliasAvailable(res.isAvailable);
      } catch {
        setAliasAvailable(false);
      } finally {
        setAliasChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customAlias]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) return;

    try {
      setCreating(true);
      setCreateError(null);
      const res = await api.createLink(originalUrl, customAlias.trim() || undefined);
      setNewlyCreatedLink(res.link);
      setOriginalUrl('');
      setCustomAlias('');
      setAliasAvailable(null);
      fetchLinks();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create short link');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link: ShortLink) => {
    try {
      const updated = await api.updateLink(link.id, { isActive: !link.isActive });
      setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, isActive: updated.link.isActive } : l)));
    } catch (err: any) {
      alert(err.message || 'Failed to update link status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalLink || !editUrl) return;
    try {
      setEditLoading(true);
      const updated = await api.updateLink(editModalLink.id, { originalUrl: editUrl });
      setLinks((prev) => prev.map((l) => (l.id === editModalLink.id ? { ...l, originalUrl: updated.link.originalUrl } : l)));
      setEditModalLink(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update URL');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalLink) return;
    try {
      setDeleteLoading(true);
      await api.deleteLink(deleteModalLink.id);
      setLinks((prev) => prev.filter((l) => l.id !== deleteModalLink.id));
      setDeleteModalLink(null);
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    } catch (err: any) {
      alert(err.message || 'Failed to delete link');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalClicksAcrossLinks = links.reduce((acc, l) => acc + l.clicksCount, 0);
  const activeCount = links.filter((l) => l.isActive).length;

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Links</span>
            <LinkIcon className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
          </div>
          <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
            {pagination.total}
          </div>
        </div>

        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Clicks</span>
            <MousePointerClick className="w-4 h-4 text-nordic-pine dark:text-nordic-sage" />
          </div>
          <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
            {totalClicksAcrossLinks}
          </div>
        </div>

        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-nordic-slate text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active Links</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-nordic-charcoal dark:text-nordic-dark-text">
            {activeCount}
          </div>
        </div>
      </div>

      {/* Shorten Form Card */}
      <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-nordic-charcoal dark:text-nordic-dark-text mb-1">
          Create a New Short Link
        </h2>
        <p className="text-sm text-nordic-slate mb-6">
          Enter an HTTP or HTTPS destination. You can optionally specify a custom alias.
        </p>

        {createError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{createError}</span>
          </div>
        )}

        <form onSubmit={handleCreateLink} className="space-y-4">
          <div>
            <label htmlFor="original-url-input" className="block text-xs font-semibold uppercase tracking-wider text-nordic-slate mb-1.5">
              Destination URL <span className="text-rose-500">*</span>
            </label>
            <input
              id="original-url-input"
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com/very/long/destination/url"
              className="w-full px-4 py-3 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg text-sm focus:outline-none focus:ring-2 focus:ring-nordic-pine"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="custom-alias-input" className="block text-xs font-semibold uppercase tracking-wider text-nordic-slate">
                Custom Alias (Optional)
              </label>
              {customAlias.trim().length >= 3 && (
                <span className="text-xs">
                  {aliasChecking ? (
                    <span className="text-nordic-slate">Checking availability...</span>
                  ) : aliasAvailable === true ? (
                    <span className="text-emerald-600 font-medium">✓ Available</span>
                  ) : aliasAvailable === false ? (
                    <span className="text-rose-600 font-medium">✗ Taken or reserved</span>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg overflow-hidden focus-within:ring-2 focus-within:ring-nordic-pine">
              <span className="px-3.5 py-3 text-xs sm:text-sm text-nordic-slate bg-nordic-mist/40 dark:bg-nordic-dark-border select-none border-r border-nordic-border dark:border-nordic-dark-border">
                nord.link/
              </span>
              <input
                id="custom-alias-input"
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="my-custom-name"
                className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-nordic-slate">
              Must be 3–32 alphanumeric characters, hyphens, or underscores.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={creating || aliasAvailable === false}
              className="px-6 py-3 rounded-xl bg-nordic-pine text-white text-sm font-semibold hover:bg-nordic-pine-light transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{creating ? 'Creating Short Link...' : 'Shorten URL'}</span>
            </button>
          </div>
        </form>

        {/* Newly Created Banner */}
        {newlyCreatedLink && (
          <div className="mt-6 pt-6 border-t border-nordic-border dark:border-nordic-dark-border bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">Short link ready!</div>
                <div className="text-sm font-bold text-nordic-charcoal dark:text-nordic-dark-text">
                  {newlyCreatedLink.shortUrl}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopy('new', newlyCreatedLink.shortUrl)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border hover:bg-nordic-bg dark:hover:bg-nordic-dark-border text-nordic-charcoal dark:text-nordic-dark-text flex items-center space-x-1.5"
              >
                {copiedId === 'new' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'new' ? 'Copied' : 'Copy'}</span>
              </button>
              {newlyCreatedLink.qrCode && (
                <button
                  onClick={() => setQrModalLink(newlyCreatedLink)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-nordic-pine text-white hover:bg-nordic-pine-light transition-colors flex items-center space-x-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Show QR Code</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Links List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-nordic-slate" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-surface dark:bg-nordic-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-nordic-pine"
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <div className="flex items-center space-x-2 text-xs text-nordic-slate">
              <Filter className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-surface dark:bg-nordic-dark-surface text-xs font-medium focus:outline-none"
            >
              <option value="createdAt">Date Created</option>
              <option value="clicks">Clicks Count</option>
              <option value="shortCode">Short Code</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-surface dark:bg-nordic-dark-surface text-xs font-medium focus:outline-none"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Links Table / Card Grid */}
        <div className="bg-nordic-surface dark:bg-nordic-dark-surface border border-nordic-border dark:border-nordic-dark-border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-nordic-slate flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-nordic-pine dark:text-nordic-sage" />
              <span>Loading links...</span>
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-nordic-mist/50 dark:bg-nordic-dark-border mx-auto flex items-center justify-center text-nordic-pine dark:text-nordic-sage">
                <LinkIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-nordic-charcoal dark:text-nordic-dark-text">No links found</h3>
              <p className="text-xs text-nordic-slate max-w-sm mx-auto">
                {search ? 'No short links match your current search query.' : 'Create your first short link above to get started.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-nordic-border dark:divide-nordic-dark-border">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-nordic-bg/50 dark:hover:bg-nordic-dark-border/30 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-3">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-bold text-nordic-pine dark:text-nordic-sage hover:underline flex items-center space-x-1.5"
                      >
                        <span>{link.shortUrl}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          link.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {link.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="text-xs text-nordic-slate truncate max-w-md sm:max-w-xl">
                      {link.originalUrl}
                    </div>

                    <div className="text-[11px] text-nordic-slate/80 flex items-center space-x-4 pt-1">
                      <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-medium text-nordic-charcoal dark:text-nordic-dark-text">
                        {link.clicksCount} {link.clicksCount === 1 ? 'click' : 'clicks'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-nordic-border dark:border-nordic-dark-border">
                    <button
                      onClick={() => handleCopy(link.id, link.shortUrl)}
                      title="Copy short link"
                      className="p-2 rounded-xl text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text hover:bg-nordic-mist/60 dark:hover:bg-nordic-dark-border transition-colors"
                    >
                      {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={async () => {
                        const full = await api.getLink(link.id);
                        setQrModalLink(full.link);
                      }}
                      title="View QR code"
                      className="p-2 rounded-xl text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text hover:bg-nordic-mist/60 dark:hover:bg-nordic-dark-border transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditModalLink(link);
                        setEditUrl(link.originalUrl);
                      }}
                      title="Edit destination URL"
                      className="p-2 rounded-xl text-nordic-slate hover:text-nordic-charcoal dark:hover:text-nordic-dark-text hover:bg-nordic-mist/60 dark:hover:bg-nordic-dark-border transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(link)}
                      title={link.isActive ? 'Pause link' : 'Activate link'}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-nordic-border dark:border-nordic-dark-border hover:bg-nordic-mist/50 dark:hover:bg-nordic-dark-border transition-colors text-nordic-slate"
                    >
                      {link.isActive ? 'Pause' : 'Activate'}
                    </button>

                    <button
                      onClick={() => setDeleteModalLink(link)}
                      title="Delete link"
                      className="p-2 rounded-xl text-nordic-slate hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-nordic-slate">
            <span>
              Showing {links.length} of {pagination.total} links
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-nordic-border dark:border-nordic-dark-border disabled:opacity-40"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-nordic-border dark:border-nordic-dark-border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={Boolean(qrModalLink)}
        onClose={() => setQrModalLink(null)}
        title="Link QR Code"
      >
        {qrModalLink && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-nordic-border inline-block shadow-sm">
              {qrModalLink.qrCode ? (
                <img
                  src={qrModalLink.qrCode}
                  alt={`QR code for ${qrModalLink.shortUrl}`}
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-nordic-slate text-xs">
                  Generating QR code...
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-nordic-pine dark:text-nordic-sage text-base">
                {qrModalLink.shortUrl}
              </div>
              <div className="text-xs text-nordic-slate truncate max-w-xs mx-auto mt-1">
                {qrModalLink.originalUrl}
              </div>
            </div>
            {qrModalLink.qrCode && (
              <a
                href={qrModalLink.qrCode}
                download={`shorturl-${qrModalLink.shortCode}.png`}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-nordic-pine text-white text-xs font-semibold hover:bg-nordic-pine-light transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Edit URL Modal */}
      <Modal
        isOpen={Boolean(editModalLink)}
        onClose={() => setEditModalLink(null)}
        title="Edit Destination URL"
      >
        {editModalLink && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-url-input" className="block text-xs font-semibold uppercase tracking-wider text-nordic-slate mb-1">
                Destination URL
              </label>
              <input
                id="edit-url-input"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-nordic-border dark:border-nordic-dark-border bg-nordic-bg dark:bg-nordic-dark-bg text-sm focus:outline-none focus:ring-2 focus:ring-nordic-pine"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalLink(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-nordic-border dark:border-nordic-dark-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 rounded-xl bg-nordic-pine text-white text-xs font-semibold hover:bg-nordic-pine-light transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalLink)}
        onClose={() => setDeleteModalLink(null)}
        title="Delete Short Link"
      >
        {deleteModalLink && (
          <div className="space-y-4">
            <p className="text-sm text-nordic-slate">
              Are you sure you want to permanently delete{' '}
              <strong className="text-nordic-charcoal dark:text-nordic-dark-text">
                {deleteModalLink.shortUrl}
              </strong>
              ? Anyone attempting to visit this link will receive a 404 Not Found error.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalLink(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-nordic-border dark:border-nordic-dark-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
