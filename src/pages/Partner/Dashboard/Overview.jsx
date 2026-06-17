import React, { useEffect, useState } from 'react';
import { 
  UtensilsCrossed, 
  Star,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { Link } from 'react-router-dom';

const Overview = ({ user }) => {
  const [stats, setStats] = useState({
    menuItems: 0,
    avgRating: null,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: menuCount } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('partner_id', user.id);

        const { data: partnerData } = await supabase
          .from('partners')
          .select('avg_rating, total_reviews')
          .eq('id', user.id)
          .single();

        setStats({
          menuItems: menuCount || 0,
          avgRating: partnerData?.avg_rating || null,
          totalReviews: partnerData?.total_reviews || 0
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);

  const statCards = [
    { 
      title: 'Total Menu Items', 
      value: stats.menuItems, 
      icon: UtensilsCrossed, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      title: 'Profile Rating', 
      value: stats.avgRating ? `${stats.avgRating} ★` : 'New', 
      icon: Star, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50' 
    },
    { 
      title: 'Total Reviews', 
      value: stats.totalReviews, 
      icon: Star, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
  ];

  return (
    <div className="animate-fadeIn max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Welcome back, {user.owner_name}
          </h1>
          <p className="text-slate-500 font-medium">
            Here's your {user.restaurant_name} overview for today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/partner/dashboard/menu" 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shadow-orange-500/20"
          >
            <Plus size={16} /> Add Dish
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-orange-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-start justify-between shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Link to="/partner/dashboard/menu" className="group bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/5 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <UtensilsCrossed size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Manage Menu</h3>
                <p className="text-slate-500 text-sm font-medium">Add or remove dishes from your menu</p>
              </div>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-orange-500 transition-colors" size={20} />
          </Link>

          <Link to="/partner/dashboard/settings" className="group bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/5 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Star size={24} className="text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Ratings & Reviews</h3>
                <p className="text-slate-500 text-sm font-medium">See what customers say about you</p>
              </div>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-purple-500 transition-colors" size={20} />
          </Link>

        </div>
      </div>

    </div>
  );
};

export default Overview;
