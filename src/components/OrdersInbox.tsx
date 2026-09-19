import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Inbox,
  Phone,
  MessageCircle,
  Calendar,
  MapPin,
  Beer,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Trash2,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  LogOut,
  X
} from 'lucide-react';
import { OrderItem, OrderStatus } from '../types';

interface OrdersInboxProps {
  adminKey: string | null;
  onClose?: () => void;
  onLogout?: () => void;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  nouveau: { label: 'Nouvelle', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-300' },
  en_cours: { label: 'En traitement', color: 'text-blue-800', bg: 'bg-blue-100 border-blue-300' },
  confirme: { label: 'Confirmée', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-300' },
  livre: { label: 'Livrée', color: 'text-neutral-700', bg: 'bg-neutral-200 border-neutral-300' },
  annule: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
};

export const OrdersInbox: React.FC<OrdersInboxProps> = ({ adminKey, onClose, onLogout }) => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (silent = false) => {
    if (!adminKey) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/orders?key=${encodeURIComponent(adminKey)}`);
      if (res.ok) {
        const data = await res.json();
        const prevCount = orders.filter((o) => o.status === 'nouveau').length;
        setOrders(data.orders || []);
        setUnreadCount(data.unreadCount || 0);

        // Sound alert if new order arrives
        if (soundEnabled && data.unreadCount > prevCount && prevCount > 0) {
          playNotificationSound();
        }
      }
    } catch (e) {
      console.error('Error fetching orders inbox:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio not permitted without interaction
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(interval);
  }, [adminKey]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!adminKey) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status?key=${encodeURIComponent(adminKey)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setUnreadCount((prev) => (newStatus !== 'nouveau' ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!adminKey) return;
    if (!window.confirm('Supprimer cette commande de la boîte de réception ?')) return;
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}?key=${encodeURIComponent(adminKey)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (e) {
      console.error('Failed to delete order', e);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      order.nomClient.toLowerCase().includes(query) ||
      order.phone.toLowerCase().includes(query) ||
      order.lieuEvenement.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden mb-6">
      {/* Clean Toolbar */}
      <div className="p-4 sm:p-5 border-b border-neutral-200/80 bg-white space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, téléphone, lieu, réf..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-white text-neutral-900 placeholder-neutral-400 rounded-xl text-xs border border-neutral-200 outline-none focus:border-diego-blue transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Désactiver les alertes sonores' : 'Activer les alertes sonores'}
              className="p-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-colors shadow-2xs"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 opacity-50" />}
            </button>

            <button
              onClick={() => fetchOrders()}
              disabled={loading}
              title="Actualiser"
              className="p-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-diego-orange' : ''}`} />
            </button>

            {adminKey && (
              <a
                href={`/api/orders/export?key=${encodeURIComponent(adminKey)}`}
                download
                title="Exporter en CSV"
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-diego-orange" />
                <span className="hidden sm:inline">Export CSV</span>
              </a>
            )}

            {onClose && (
              <button
                onClick={onClose}
                title="Fermer"
                className="p-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 transition-colors shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              filterStatus === 'all'
                ? 'bg-diego-blue text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Toutes ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('nouveau')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              filterStatus === 'nouveau'
                ? 'bg-diego-orange text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Nouvelles ({orders.filter((o) => o.status === 'nouveau').length})
          </button>
          <button
            onClick={() => setFilterStatus('en_cours')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              filterStatus === 'en_cours'
                ? 'bg-diego-blue text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            En cours ({orders.filter((o) => o.status === 'en_cours').length})
          </button>
          <button
            onClick={() => setFilterStatus('confirme')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
              filterStatus === 'confirme'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Confirmées ({orders.filter((o) => o.status === 'confirme').length})
          </button>
        </div>
      </div>

      {/* Orders List Body */}
      <div className="p-3 sm:p-4 divide-y divide-neutral-100 max-h-[620px] overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <Inbox className="w-10 h-10 mx-auto text-neutral-300 stroke-1" />
            <p className="text-xs font-bold text-neutral-600">Aucune commande trouvée</p>
            <p className="text-[11px] text-neutral-400">
              {searchQuery ? 'Modifiez votre recherche' : 'Les nouvelles commandes apparaîtront ici automatiquement.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.nouveau;
            const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
            const waTarget = cleanPhone.startsWith('237') ? cleanPhone : '237' + cleanPhone;
            const waLink = `https://wa.me/${waTarget}?text=${encodeURIComponent(
              `Bonjour ${order.nomClient}, Diego SAS fait suite à votre réservation de bière pression (${order.nombreFuts} fûts) pour le ${order.dateEvenement}.`
            )}`;

            return (
              <div key={order.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2.5">
                {/* Order card top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-diego-blue">{order.id}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="font-extrabold text-sm text-neutral-900 mt-0.5">{order.nomClient}</p>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      Reçue le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Status switcher */}
                  <div className="flex items-center gap-1">
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                      aria-label="Changer le statut"
                      className="text-[11px] font-bold bg-neutral-100 border border-neutral-200 rounded-lg px-2 py-1 outline-none text-neutral-700"
                    >
                      <option value="nouveau">Nouvelle</option>
                      <option value="en_cours">En cours</option>
                      <option value="confirme">Confirmée</option>
                      <option value="livre">Livrée</option>
                      <option value="annule">Annulée</option>
                    </select>

                    <button
                      onClick={() => handleDelete(order.id)}
                      title="Supprimer"
                      className="p-1.5 text-neutral-300 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details pill grid */}
                <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/70 text-xs space-y-1.5 text-neutral-700">
                  <div className="flex items-center gap-2">
                    <Beer className="w-3.5 h-3.5 text-diego-orange shrink-0" />
                    <span className="font-black text-neutral-900">{order.nombreFuts} Fûts</span>
                    <span className="text-neutral-400">•</span>
                    <span className="truncate font-medium">{order.marquesSouhaitees}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-diego-blue shrink-0" />
                    <span>
                      {order.natureEvenement} le <strong>{order.dateEvenement}</strong> à {order.heurePrestation}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{order.lieuEvenement}</span>
                  </div>
                </div>

                {/* Direct Action buttons for Order Receivers */}
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${order.phone}`}
                    className="flex-1 min-h-[38px] px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-diego-blue" />
                    Appeler ({order.phone})
                  </a>

                  {order.status === 'confirme' ? (
                    <button
                      disabled
                      className="flex-1 min-h-[38px] px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Commande Confirmée
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(order.id, 'confirme')}
                      disabled={updatingId === order.id}
                      className="flex-1 min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {updatingId === order.id ? 'Confirmation...' : 'Confirmer la commande'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
