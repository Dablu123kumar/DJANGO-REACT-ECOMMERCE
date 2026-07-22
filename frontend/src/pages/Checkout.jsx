import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Tag, CreditCard, Loader2, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { placeOrder, validateCoupon, clearCoupon } from '../redux/slices/orderSlice';
import { fetchCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items, subtotal } = useSelector((s) => s.cart);
  const { placing, coupon } = useSelector((s) => s.orders);
  const [step, setStep] = useState(1);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [address, setAddress] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    dispatch(fetchCart());
    dispatch(clearCoupon());
    
    api.get('/auth/addresses/')
      .then(res => {
        const addressList = res.data.results || res.data;
        setSavedAddresses(addressList);
        if (addressList.length > 0) {
          const defaultAddr = addressList.find(a => a.is_default) || addressList[0];
          setSelectedAddressId(defaultAddr.id);
        }
      })
      .catch(err => console.error('Failed to load addresses', err))
      .finally(() => setLoadingAddresses(false));
  }, []);

  useEffect(() => {
    if (items.length === 0 && !placing) navigate('/cart');
  }, [items]);

  const discount = coupon ? parseFloat(coupon.discount_amount) : 0;
  const shipping = subtotal >= 500 ? 0 : 49;
  const total = subtotal - discount + shipping;

  const handleAddressChange = (e) => {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCouponValidate = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      await dispatch(validateCoupon({ code: couponCode, order_total: subtotal })).unwrap();
      toast.success('Coupon applied! 🎉');
    } catch (err) {
      toast.error(err?.error || 'Invalid coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRazorpayPayment = async (order) => {
    try {
      const res = await api.post('/payments/create-order/', { order_id: order.id });
      const payData = res.data;
      if (!window.Razorpay) { toast.error('Payment gateway not loaded.'); return; }
      const rzp = new window.Razorpay({
        key: payData.razorpay_key_id,
        amount: payData.amount,
        currency: payData.currency,
        name: 'ShopElite',
        description: `Order #${payData.order_number}`,
        order_id: payData.razorpay_order_id,
        prefill: { name: payData.user_name, email: payData.user_email, contact: payData.user_phone },
        theme: { color: '#3b82f6' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! 🎉');
            navigate(`/orders/${order.id}?success=true`);
          } catch { toast.error('Payment verification failed'); }
        },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Could not initiate payment');
    }
  };

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/auth/addresses/${id}/`);
      const newAddrs = savedAddresses.filter(a => a.id !== id);
      setSavedAddresses(newAddrs);
      if (selectedAddressId === id) setSelectedAddressId(newAddrs.length > 0 ? newAddrs[0].id : 'new');
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    setAddress({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
    });
    setEditingAddressId(addr.id);
    setSelectedAddressId('new');
  };

  const handleContinueToReview = async () => {
    if (selectedAddressId === 'new') {
      const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode'];
      for (const f of required) {
        if (!address[f]) { toast.error(`Please fill in ${f.replace('_', ' ')}`); return; }
      }
      
      if (editingAddressId) {
        try {
          const res = await api.put(`/auth/addresses/${editingAddressId}/`, address);
          const updated = savedAddresses.map(a => a.id === editingAddressId ? res.data : a);
          setSavedAddresses(updated);
          setSelectedAddressId(res.data.id);
          setEditingAddressId(null);
          toast.success('Address updated!');
        } catch (err) {
          toast.error('Failed to update address');
          return;
        }
      } else if (saveNewAddress) {
        try {
          const res = await api.post('/auth/addresses/', { ...address, is_default: savedAddresses.length === 0 });
          setSavedAddresses([...savedAddresses, res.data]);
          setSelectedAddressId(res.data.id);
          setSaveNewAddress(false);
          toast.success('Address saved to profile!');
        } catch (err) {
          console.error('Failed to save address', err);
          toast.error('Failed to save address');
        }
      }
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    let finalAddress = address;

    if (selectedAddressId !== 'new') {
      const selected = savedAddresses.find(a => a.id === selectedAddressId);
      if (!selected) { toast.error('Please select a valid address'); return; }
      finalAddress = {
        full_name: selected.full_name,
        phone: selected.phone,
        address_line1: selected.address_line1,
        address_line2: selected.address_line2,
        city: selected.city,
        state: selected.state,
        pincode: selected.pincode,
        country: selected.country,
      };
    } else {
      const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode'];
      for (const f of required) {
        if (!address[f]) { toast.error(`Please fill in ${f.replace('_', ' ')}`); return; }
      }
    }

    try {
      const order = await dispatch(placeOrder({ 
        shipping_address: finalAddress, 
        coupon_code: couponCode,
        payment_method: paymentMethod
      })).unwrap();
      
      if (paymentMethod === 'online') {
        await handleRazorpayPayment(order);
      } else {
        toast.success('Order successfully placed! 🎉');
        navigate(`/orders/${order.id}?success=true`);
      }
    } catch (err) {
      toast.error(err?.error || 'Could not place order');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] transition-colors duration-300">
      {!document.getElementById('razorpay-script') && (() => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.id = 'razorpay-script';
        document.head.appendChild(s);
        return null;
      })()}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-heading font-bold text-[var(--text-primary)] mb-8">Checkout</h1>
        <div className="flex items-center gap-4 mb-8">
          {[{ n: 1, label: 'Shipping' }, { n: 2, label: 'Review & Pay' }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= n ? 'bg-primary-600 text-white shadow-glow' : 'bg-[var(--bg-surface-hover)] text-[var(--text-subtle)] border border-[var(--border-color)]'}`}>
                {step > n ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <span className={`text-sm font-medium ${step >= n ? 'text-[var(--text-primary)]' : 'text-[var(--text-subtle)]'}`}>{label}</span>
              {n < 2 && <div className={`w-16 h-px ${step > n ? 'bg-primary-600' : 'bg-[var(--border-color)]'}`} />}
            </div>
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {step === 1 && (
              <div className="card p-6 animate-fade-in">
                <h2 className="text-lg font-heading font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" /> Shipping Address
                </h2>
                
                {loadingAddresses ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                ) : (
                  <div className="space-y-6">
                    {savedAddresses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map(addr => (
                          <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressId === addr.id ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--border-color)] hover:border-primary-400 bg-[var(--bg-surface)]'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-[var(--text-primary)] inline-block">{addr.full_name}</h4>
                                {addr.is_default && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold badge-gray">DEFAULT</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => handleEditAddress(e, addr)} className="text-[var(--text-muted)] hover:text-primary-500 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => handleDeleteAddress(e, addr.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{addr.phone}</p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{addr.address_line1}</p>
                            <p className="text-sm text-[var(--text-muted)]">{addr.city}, {addr.state} {addr.pincode}</p>
                          </div>
                        ))}
                        <div onClick={() => {
                          setSelectedAddressId('new');
                          setEditingAddressId(null);
                          setAddress({ full_name: user?.full_name || '', phone: user?.phone || '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India' });
                        }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] ${
                            selectedAddressId === 'new' ? 'border-primary-500 text-primary-500 bg-primary-500/10' : 'border-[var(--border-color)] border-dashed hover:border-primary-400 bg-[var(--bg-surface)]'
                          }`}>
                          <MapPin className="w-6 h-6 mb-2" />
                          <span className="font-medium">Add New Address</span>
                        </div>
                      </div>
                    )}

                    {selectedAddressId === 'new' && (
                      <div className="space-y-4 animate-fade-in border-t border-[var(--border-color)] pt-6 mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-[var(--text-primary)]">{editingAddressId ? 'Edit Address' : 'Enter New Address'}</h3>
                          {editingAddressId && (
                            <button onClick={() => { setEditingAddressId(null); setSelectedAddressId(savedAddresses[0]?.id || 'new'); }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel Edit</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[['full_name','Full Name *','John Doe'],['phone','Phone *','+91 9876543210']].map(([name,label,ph]) => (
                            <div key={name}>
                              <label className="label">{label}</label>
                              <input name={name} value={address[name]} onChange={handleAddressChange} className="input" placeholder={ph} />
                            </div>
                          ))}
                          <div className="sm:col-span-2">
                            <label className="label">Address Line 1 *</label>
                            <input name="address_line1" value={address.address_line1} onChange={handleAddressChange} className="input" placeholder="House no, Street, Area" />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="label">Address Line 2</label>
                            <input name="address_line2" value={address.address_line2} onChange={handleAddressChange} className="input" placeholder="Landmark (optional)" />
                          </div>
                          {[['city','City *','Mumbai'],['state','State *','Maharashtra'],['pincode','Pincode *','400001'],['country','Country','India']].map(([name,label,ph]) => (
                            <div key={name}>
                              <label className="label">{label}</label>
                              <input name={name} value={address[name]} onChange={handleAddressChange} className="input" placeholder={ph} maxLength={name==='pincode'?6:undefined} />
                            </div>
                          ))}
                        </div>
                        {!editingAddressId && (
                          <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} className="w-4 h-4 rounded border-[var(--border-color)] text-primary-600 cursor-pointer" />
                              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Save this address for future orders</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <button onClick={handleContinueToReview} className="btn-primary w-full justify-center mt-8">Continue to Review</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> Delivery Address</h3>
                    <button onClick={() => setStep(1)} className="text-sm text-primary-500 hover:text-primary-600 font-medium">Edit</button>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.full_name : address.full_name} · 
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.phone : address.phone}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.address_line1 : address.address_line1}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.city : address.city}, 
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.state : address.state} — 
                    {selectedAddressId !== 'new' ? savedAddresses.find(a => a.id === selectedAddressId)?.pincode : address.pincode}
                  </p>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">Order Items ({items.length})</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{item.product?.name} × {item.quantity}</span>
                        <span className="text-[var(--text-primary)] font-medium">₹{parseFloat(item.total_price).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-amber-500" /> Coupon Code</h3>
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input flex-1 font-mono" disabled={!!coupon} />
                    {coupon ? (
                      <button onClick={() => { dispatch(clearCoupon()); setCouponCode(''); }} className="btn-danger btn-sm">Remove</button>
                    ) : (
                      <button onClick={handleCouponValidate} disabled={validatingCoupon || !couponCode} className="btn-secondary btn-sm">
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    )}
                  </div>
                  {coupon && <p className="text-emerald-500 text-sm mt-2 flex items-center gap-1 font-medium"><CheckCircle className="w-3.5 h-3.5" /> {coupon.description} — Saving ₹{parseFloat(coupon.discount_amount).toLocaleString('en-IN')}</p>}
                </div>
                <div className="card p-5">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Payment Method</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'online', title: 'Online Payment', desc: 'Pay securely with Razorpay / UPI / Cards' },
                      { id: 'cod', title: 'Cash on Delivery (COD)', desc: 'Pay cash when you receive your items' }
                    ].map((method) => (
                      <label key={method.id} className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-primary-500 bg-primary-500/10' : 'border-[var(--border-color)] hover:border-primary-400'}`}>
                        <input type="radio" name="paymentMethod" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="mt-1 accent-primary-500" />
                        <div className="ml-3">
                          <div className="font-medium text-[var(--text-primary)] text-sm">{method.title}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">{method.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary w-full justify-center btn-lg">
                  {placing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</>
                  ) : paymentMethod === 'cod' ? (
                    <><CheckCircle className="w-5 h-5" /> Confirm COD Order</>
                  ) : (
                    <><CreditCard className="w-5 h-5" /> Pay ₹{total.toLocaleString('en-IN')}</>
                  )}
                </button>
                <p className="text-xs text-center text-[var(--text-subtle)]">
                  {paymentMethod === 'online' ? 'Secured by Razorpay · Your payment information is encrypted' : 'You will pay when the order is delivered'}
                </p>
              </div>
            )}
          </div>
          <div className="lg:w-72 flex-shrink-0">
            <div className="card p-5 sticky top-24 space-y-3">
              <h2 className="font-heading font-bold text-[var(--text-primary)]">Summary</h2>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-[var(--text-muted)]"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-500 font-medium"><span>Coupon Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between text-[var(--text-muted)]"><span>Shipping</span><span className={shipping === 0 ? 'text-emerald-500 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                <div className="border-t border-[var(--border-color)] pt-2 flex justify-between font-bold text-[var(--text-primary)] text-base"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
