import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Bike, Check, Clock3, ExternalLink, MapPin, RefreshCw, Search, ShieldCheck, UserRound, X } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  suspended: 'bg-slate-100 text-slate-700 ring-slate-200',
};

function documentLinks(value, prefix = '') {
  if (!value) return [];
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) return [{ label: prefix || 'Document', url: value }];
    return [];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => documentLinks(item, `${prefix || 'Document'} ${index + 1}`));
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => documentLinks(item, key.replace(/[_-]/g, ' ')));
  }
  return [];
}

export default function DeliveryPartnersList() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPartners = useCallback(async () => {
    setErrorMessage('');
    const { data, error } = await supabase
      .from('delivery_partners')
      .select('user_id, name, email, phone, city, vehicle_type, vehicle_number, avatar_url, payout_upi, kyc_docs, status, rejection_reason, is_online, last_seen, created_at, restaurant_id')
      .order('created_at', { ascending: false });
    if (error) {
      setErrorMessage(`Could not load delivery partners: ${error.message}`);
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPartners();
    const channel = supabase
      .channel('admin_delivery_partners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_partners' }, fetchPartners)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchPartners]);

  const counts = useMemo(() => partners.reduce((result, partner) => {
    result.all += 1;
    result[partner.status] = (result[partner.status] || 0) + 1;
    return result;
  }, { all: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 }), [partners]);

  const visiblePartners = useMemo(() => partners.filter((partner) => {
    if (filter !== 'all' && partner.status !== filter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [partner.name, partner.email, partner.phone, partner.city, partner.vehicle_number, partner.vehicle_type]
      .some((value) => value?.toLowerCase().includes(query));
  }), [partners, filter, search]);

  const updateStatus = async (partner, status) => {
    let rejection_reason = null;
    if (status === 'rejected') {
      rejection_reason = window.prompt('Optional reason for rejecting this application:', partner.rejection_reason || '');
      if (rejection_reason === null) return;
      rejection_reason = rejection_reason.trim() || null;
    }
    setUpdatingId(partner.user_id);
    setErrorMessage('');
    const { error } = await supabase
      .from('delivery_partners')
      .update({ status, rejection_reason, updated_at: new Date().toISOString() })
      .eq('user_id', partner.user_id);
    if (error) {
      setErrorMessage(`Could not update ${partner.name || 'partner'}: ${error.message}`);
    } else {
      setPartners((current) => current.map((item) => item.user_id === partner.user_id ? { ...item, status, rejection_reason } : item));
    }
    setUpdatingId(null);
  };

  return (
    <div className="font-outfit space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Operations</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Delivery Partners</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Review applications and manage delivery partner access.</p>
        </div>
        <button onClick={() => { setLoading(true); fetchPartners(); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {errorMessage && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{errorMessage}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[['all', 'All partners'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['suspended', 'Suspended']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-2xl border p-4 text-left transition ${filter === key ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
            <span className="block text-2xl font-black text-slate-900">{loading ? '—' : counts[key]}</span>
            <span className="text-xs font-bold text-slate-500">{label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email, city or vehicle..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
      </div>

      {loading ? <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm font-semibold text-slate-400">Loading delivery partners…</div> :
        visiblePartners.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><UserRound className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-bold text-slate-700">No partners found</p><p className="mt-1 text-sm text-slate-400">Try another filter or search term.</p></div> :
          <div className="grid gap-4 xl:grid-cols-2">
            {visiblePartners.map((partner) => {
              const docs = documentLinks(partner.kyc_docs);
              const busy = updatingId === partner.user_id;
              return (
                <article key={partner.user_id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      {partner.avatar_url ? <img src={partner.avatar_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Bike size={21} /></div>}
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-slate-900">{partner.name || 'Name not provided'}</h2>
                        <p className="truncate text-sm text-slate-500">{partner.email || partner.phone || 'No contact details'}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${STATUS_STYLES[partner.status] || STATUS_STYLES.pending}`}>{partner.status}</span>
                  </div>
                  <div className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
                    <Detail label="Phone" value={partner.phone} />
                    <Detail label="Email" value={partner.email} />
                    <Detail label="City" value={partner.city} icon={MapPin} />
                    <Detail label="Vehicle" value={[partner.vehicle_type, partner.vehicle_number].filter(Boolean).join(' · ')} icon={Bike} />
                    <Detail label="Payout UPI" value={partner.payout_upi} />
                    <Detail label="Applied" value={partner.created_at ? new Date(partner.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} icon={Clock3} />
                    {partner.rejection_reason && <div className="sm:col-span-2"><Detail label="Rejection reason" value={partner.rejection_reason} /></div>}
                  </div>
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><ShieldCheck size={15} /> KYC documents</div>
                    {docs.length ? <div className="flex flex-wrap gap-2">{docs.map((doc, index) => <a key={`${doc.url}-${index}`} href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold capitalize text-slate-700 hover:border-orange-300 hover:text-orange-600">{doc.label}<ExternalLink size={12} /></a>)}</div> : <p className="text-sm text-slate-400">No linked documents found in KYC data.</p>}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                    {partner.status === 'pending' && <>
                      <button disabled={busy} onClick={() => updateStatus(partner, 'approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={15} /> Approve</button>
                      <button disabled={busy} onClick={() => updateStatus(partner, 'rejected')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><X size={15} /> Reject</button>
                    </>}
                    {partner.status === 'approved' && <button disabled={busy} onClick={() => updateStatus(partner, 'suspended')} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Suspend</button>}
                    {partner.status === 'rejected' && <button disabled={busy} onClick={() => updateStatus(partner, 'approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={15} /> Approve</button>}
                    {partner.status === 'suspended' && <button disabled={busy} onClick={() => updateStatus(partner, 'approved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check size={15} /> Reinstate</button>}
                    {busy && <span className="self-center text-xs font-semibold text-slate-400">Saving…</span>}
                  </div>
                </article>
              );
            })}
          </div>}
    </div>
  );
}

function Detail({ label, value, icon: Icon }) {
  return <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 flex items-center gap-1.5 break-words font-semibold text-slate-800">{Icon && <Icon size={13} className="shrink-0 text-slate-400" />}{value || '—'}</p></div>;
}
