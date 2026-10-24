import React, { useState, useEffect } from 'react';
import { 
  Wheat, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Box, 
  TrendingUp, 
  AlertTriangle, 
  Tag, 
  PackageCheck,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import api from '../../services/api';

const FALLBACK_PRODUCTS = [
  { id: 'SP-001', name: 'Aniseed / Anise Cigar', category: 'Whole Spices', grade: 'Grade A Premium', origin: 'Vietnam / India', stockMT: 140, priceMT: '$3,800', packaging: '25kg Jute Bag', status: 'In Stock' },
  { id: 'SP-002', name: 'Black Pepper 550 G/L', category: 'Whole Spices', grade: 'Export Quality', origin: 'Kerala / Vietnam', stockMT: 420, priceMT: '$6,400', packaging: '50kg PP Bag', status: 'In Stock' },
  { id: 'SP-003', name: 'Green Cardamom 8mm+', category: 'Whole Spices', grade: 'Bold Green', origin: 'Guatemala / India', stockMT: 35, priceMT: '$22,500', packaging: '10kg Vacuum Carton', status: 'Low Stock' },
  { id: 'SP-004', name: 'Nutmeg & Javitri (Mace)', category: 'Whole Spices', grade: 'Sound Clean', origin: 'Indonesia / India', stockMT: 85, priceMT: '$8,900', packaging: '25kg Kraft Bag', status: 'In Stock' },
  { id: 'AG-101', name: 'Perfumed Rice DT 8', category: 'Commodities & Grains', grade: '5% Broken Sortex', origin: 'Vietnam', stockMT: 1200, priceMT: '$610', packaging: '50kg PP Bag', status: 'In Stock' },
  { id: 'AG-102', name: 'Indian Aromatic Tea (Dooars)', category: 'Commodities & Grains', grade: 'BOP / BP Grade', origin: 'West Bengal, India', stockMT: 210, priceMT: '$2,850', packaging: '35kg Paper Sacks', status: 'In Stock' },
  { id: 'FD-201', name: 'Rice DDGS 45% Protein', category: 'Animal Feed Ingredients', grade: 'Feed Grade', origin: 'India', stockMT: 3400, priceMT: '$285', packaging: 'Bulk / Loose in Container', status: 'In Stock' },
  { id: 'FD-202', name: 'Soybean Meal De-hulled', category: 'Animal Feed Ingredients', grade: '48% Protein Non-GMO', origin: 'India', stockMT: 2800, priceMT: '$460', packaging: '50kg Bag / Bulk', status: 'In Stock' },
];

const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  grade: p.grade,
  origin: p.origin,
  stockMT: p.stock_mt ?? p.stockMT,
  priceMT: p.price_mt ?? p.priceMT,
  packaging: p.packaging,
  status: p.status,
});

export default function ProductCatalog() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);

  const notify = (type, msg) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshProducts = async () => {
    const data = await api.getProducts();
    if (data && data.length > 0) {
      setProducts(data.map(mapProduct));
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Whole Spices',
    grade: 'Grade A',
    origin: 'India',
    stockMT: 100,
    priceMT: '$1,000',
    packaging: '50kg PP Bag'
  });

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.origin.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name) return;
    setSaving(true);
    try {
      const result = await api.createProduct({
        name: newProd.name,
        category: newProd.category,
        grade: newProd.grade,
        origin: newProd.origin,
        stock_mt: Number(newProd.stockMT),
        price_mt: newProd.priceMT,
        packaging: newProd.packaging,
        status: 'In Stock',
      });

      if (result) {
        notify('success', `"${result.name}" added to catalog.`);
        await refreshProducts();
      } else {
        // Fallback: add locally
        const created = {
          id: `PRD-${Date.now().toString().slice(-4)}`,
          ...newProd,
          status: 'In Stock'
        };
        setProducts(prev => [...prev, created]);
        notify('success', 'Product added locally.');
      }
      setShowAddModal(false);
      setNewProd({ name: '', category: 'Whole Spices', grade: 'Grade A', origin: 'India', stockMT: 100, priceMT: '$1,000', packaging: '50kg PP Bag' });
    } catch {
      notify('error', 'Failed to add product.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (product) => {
    setEditProduct({ ...product });
    setShowEditModal(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editProduct.name) return;
    setSaving(true);
    try {
      const result = await api.updateProduct(editProduct.id, {
        name: editProduct.name,
        category: editProduct.category,
        grade: editProduct.grade,
        origin: editProduct.origin,
        stock_mt: Number(editProduct.stockMT),
        price_mt: editProduct.priceMT,
        packaging: editProduct.packaging,
        status: editProduct.status,
      });

      if (result) {
        notify('success', `"${editProduct.name}" updated successfully.`);
      } else {
        // Fallback: update locally
        setProducts(prev => prev.map(p => p.id === editProduct.id ? editProduct : p));
        notify('success', 'Product updated locally.');
      }
      await refreshProducts();
      setShowEditModal(false);
      setEditProduct(null);
    } catch {
      notify('error', 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    setSaving(true);
    try {
      const result = await api.deleteProduct(id);
      if (result !== null) {
        notify('success', 'Product deleted successfully.');
      } else {
        setProducts(prev => prev.filter(p => p.id !== id));
        notify('success', 'Product removed locally.');
      }
      await refreshProducts();
    } catch {
      notify('error', 'Failed to delete product.');
    } finally {
      setSaving(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold transition-all ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-card">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center border border-blue-200">
            <Wheat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Spices, Commodities &amp; Agro Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified Export Stocks • Real-time Tonnage, Moisture Grades &amp; Contract Pricing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md shadow-sm transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CATALOG</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>ADD PRODUCT</span>
          </button>
        </div>
      </div>

      {/* Inventory KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">TOTAL STOCK VOLUME</span>
            <Box className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">8,290 MT</p>
          <span className="text-[11px] font-semibold text-emerald-700">Ready for Containerization</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">WHOLE SPICES</span>
            <Wheat className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">680 MT</p>
          <span className="text-[11px] font-semibold text-[#D97706]">Pepper, Anise, Cardamom, Mace</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">RICE &amp; AROMATIC TEA</span>
            <PackageCheck className="w-4 h-4 text-[#1E40AF]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">1,410 MT</p>
          <span className="text-[11px] font-semibold text-slate-500">DT 8 Perfumed &amp; Darjeeling</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">FEED &amp; DDGS MEALS</span>
            <TrendingUp className="w-4 h-4 text-purple-700" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">6,200 MT</p>
          <span className="text-[11px] font-semibold text-purple-700">45% - 48% Protein High Density</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-card overflow-hidden">
        {/* Category Tabs & Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'Whole Spices', 'Commodities & Grains', 'Animal Feed Ingredients'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#1E40AF] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="SEARCH SPICE, SKU, ORIGIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-md pl-9 pr-3 py-1.5 text-xs placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FAFAFA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">PRODUCT SKU</th>
                <th className="py-3 px-4">COMMODITY NAME</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">GRADE &amp; SPEC</th>
                <th className="py-3 px-4">ORIGIN</th>
                <th className="py-3 px-4 text-right">AVAILABLE STOCK</th>
                <th className="py-3 px-4 text-right">INDICATIVE FOB</th>
                <th className="py-3 px-4">PACKAGING</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs font-semibold">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1E40AF] whitespace-nowrap">{p.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{p.name}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">{p.grade}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{p.origin}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{p.stockMT} MT</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{p.priceMT}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">{p.packaging}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-amber-100 text-[#B45309] border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Product"
                          className="p-1.5 rounded hover:bg-amber-100 text-[#D97706] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === p.id ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              disabled={saving}
                              className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 border border-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Delete Product"
                            className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Add Commodity SKU to Catalog</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commodity / Spice Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Clove Whole Lal Pari / Jasmine Rice"
                  value={newProd.name}
                  onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select 
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    <option value="Whole Spices">Whole Spices</option>
                    <option value="Commodities & Grains">Commodities &amp; Grains</option>
                    <option value="Animal Feed Ingredients">Animal Feed Ingredients</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Grade / Quality</label>
                  <input 
                    type="text"
                    placeholder="e.g. Grade A / Sortex Clean"
                    value={newProd.grade}
                    onChange={(e) => setNewProd({ ...newProd, grade: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Origin</label>
                <input 
                  type="text"
                  placeholder="e.g. India / Vietnam"
                  value={newProd.origin}
                  onChange={(e) => setNewProd({ ...newProd, origin: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Quantity (MT)</label>
                  <input 
                    type="number"
                    value={newProd.stockMT}
                    onChange={(e) => setNewProd({ ...newProd, stockMT: Number(e.target.value) })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Indicative Price ($/MT)</label>
                  <input 
                    type="text"
                    value={newProd.priceMT}
                    onChange={(e) => setNewProd({ ...newProd, priceMT: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Packaging</label>
                <input 
                  type="text"
                  placeholder="e.g. 50kg PP Bag"
                  value={newProd.packaging}
                  onChange={(e) => setNewProd({ ...newProd, packaging: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Edit Product — {editProduct.id}</h3>
              <button onClick={() => { setShowEditModal(false); setEditProduct(null); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Commodity / Spice Name *</label>
                <input 
                  type="text"
                  required
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select 
                    value={editProduct.category}
                    onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    <option value="Whole Spices">Whole Spices</option>
                    <option value="Commodities & Grains">Commodities &amp; Grains</option>
                    <option value="Animal Feed Ingredients">Animal Feed Ingredients</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Grade / Quality</label>
                  <input 
                    type="text"
                    value={editProduct.grade}
                    onChange={(e) => setEditProduct({ ...editProduct, grade: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Origin</label>
                <input 
                  type="text"
                  value={editProduct.origin}
                  onChange={(e) => setEditProduct({ ...editProduct, origin: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Quantity (MT)</label>
                  <input 
                    type="number"
                    value={editProduct.stockMT}
                    onChange={(e) => setEditProduct({ ...editProduct, stockMT: Number(e.target.value) })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Indicative Price ($/MT)</label>
                  <input 
                    type="text"
                    value={editProduct.priceMT}
                    onChange={(e) => setEditProduct({ ...editProduct, priceMT: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Packaging</label>
                  <input 
                    type="text"
                    value={editProduct.packaging}
                    onChange={(e) => setEditProduct({ ...editProduct, packaging: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                  <select 
                    value={editProduct.status}
                    onChange={(e) => setEditProduct({ ...editProduct, status: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#1E40AF] font-medium"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowEditModal(false); setEditProduct(null); }} className="px-4 py-2 border border-[#E2E8F0] rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E40AF] text-white rounded-md text-xs font-semibold hover:bg-blue-800 shadow-sm disabled:opacity-60">
                  {saving ? 'Saving...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
