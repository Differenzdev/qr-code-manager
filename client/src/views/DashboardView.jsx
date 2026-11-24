import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, LayoutGrid, List, RefreshCw, 
  Sparkles, ExternalLink, QrCode, Tag, ArrowUpDown, Database 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import StatsCards from '../components/StatsCards';
import QRCodeCard from '../components/QRCodeCard';
import QRCodeTableView from '../components/QRCodeTableView';
import GenerateModal from '../components/GenerateModal';
import DownloadModal from '../components/DownloadModal';
import ShareModal from '../components/ShareModal';
import EditModal from '../components/EditModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { api } from '../services/api';

const CATEGORIES = [
  'All', 'Marketing', 'Product', 'Portfolio', 'Social', 'Event', 'Personal', 'Other'
];

export default function DashboardView() {
  const [qrcodes, setQrcodes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState(null);
  const [selectedForShare, setSelectedForShare] = useState(null);
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  // Fetch QR codes from persistent database
  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const res = await api.getQRCodes({ search, category, sortBy, sortOrder });
      setQrcodes(res.data || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error('Failed to load QR codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQRCodes();
  }, [category, sortBy, sortOrder]);

  // Handle Search submit or enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQRCodes();
  };

  // Callback on newly created QR code
  const handleCreated = (newQR) => {
    setQrcodes(prev => [newQR, ...prev]);
    loadQRCodes();
  };

  // Callback on updated QR code
  const handleUpdated = (updatedQR) => {
    setQrcodes(prev => prev.map(qr => qr.id === updatedQR.id ? updatedQR : qr));
    loadQRCodes();
  };

  // Callback on deleted QR code
  const handleDeleteConfirm = async (id) => {
    try {
      await api.deleteQRCode(id);
      setQrcodes(prev => prev.filter(qr => qr.id !== id));
      setSelectedForDelete(null);
      loadQRCodes();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Callback on duplicate QR code
  const handleDuplicate = async (sourceQR) => {
    try {
      const res = await api.duplicateQRCode(sourceQR.id);
      setQrcodes(prev => [res.data, ...prev]);
      loadQRCodes();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  // Callback to toggle Direct URL vs Dynamic Redirect
  const handleToggleType = async (qr) => {
    try {
      const nextType = qr.qrType === 'direct' ? 'dynamic' : 'direct';
      const res = await api.updateQRCode(qr.id, { qrType: nextType });
      handleUpdated(res.data);
    } catch (err) {
      console.error('Toggle type failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar onOpenGenerate={() => setIsGenerateOpen(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner with Persistent Storage Guarantee */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900/40 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Persistent URL Guarantee Active
              </h4>
              <p className="text-xs text-slate-400">
                All URLs and QR codes are permanently stored on the server database. No data is lost when changing browsers or logging in later.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center space-x-1.5 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New QR Code</span>
          </button>
        </div>

        {/* Stats Overview */}
        <StatsCards stats={stats} />

        {/* Search, Filter & Layout Controls */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 mb-6 backdrop-blur-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={loadQRCodes}
                placeholder="Search QR codes by title, URL, or notes..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </form>

            {/* Sort & View Mode */}
            <div className="flex items-center space-x-2">
              {/* Sort selector */}
              <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                  <option value="scanCount-desc">Most Scanned</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="List / Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={loadQRCodes}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  category === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Listing */}
        {loading && qrcodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading persistent QR codes from database...</p>
          </div>
        ) : qrcodes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No QR Codes Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              {search || category !== 'All' 
                ? 'No QR codes matched your current filter. Try clearing filters or searching for something else.'
                : 'Start by generating your first QR code and associating a persistent URL with it.'}
            </p>
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First QR Code</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {qrcodes.map((qr) => (
              <QRCodeCard
                key={qr.id}
                qr={qr}
                onDownload={(target) => setSelectedForDownload(target)}
                onShare={(target) => setSelectedForShare(target)}
                onEdit={(target) => setSelectedForEdit(target)}
                onDelete={(target) => setSelectedForDelete(target)}
                onDuplicate={handleDuplicate}
                onToggleType={handleToggleType}
                onUpdate={handleUpdated}
              />
            ))}
          </div>
        ) : (
          <QRCodeTableView
            qrcodes={qrcodes}
            onDownload={(target) => setSelectedForDownload(target)}
            onShare={(target) => setSelectedForShare(target)}
            onEdit={(target) => setSelectedForEdit(target)}
            onDelete={(target) => setSelectedForDelete(target)}
            onDuplicate={handleDuplicate}
            onToggleType={handleToggleType}
          />
        )}
      </main>

      {/* Modals */}
      <GenerateModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onCreated={handleCreated}
      />

      <DownloadModal
        qr={selectedForDownload}
        isOpen={!!selectedForDownload}
        onClose={() => setSelectedForDownload(null)}
      />

      <ShareModal
        qr={selectedForShare}
        isOpen={!!selectedForShare}
        onClose={() => setSelectedForShare(null)}
      />

      <EditModal
        qr={selectedForEdit}
        isOpen={!!selectedForEdit}
        onClose={() => setSelectedForEdit(null)}
        onUpdated={handleUpdated}
      />

      <DeleteConfirmModal
        qr={selectedForDelete}
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
