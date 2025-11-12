// Tệp: pages/dashboard/orders.js
// (BẢN VÁ 1.6 - ĐÃ THÊM PHÂN TRANG)

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Hàm trợ giúp để lấy token
const getToken = () => {
    if (typeof window !== 'undefined') { return localStorage.getItem('admin_token'); }
    return null;
};

// Sử dụng biến này
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 50; // Hiển thị 50 đơn hàng mỗi trang

// Component để hiển thị chi tiết đơn hàng (Modal)
function OrderDetails({ orderId, onClose }) { 
    const [orderDetails, setOrderDetails] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true); setError(''); const token = getToken();
            if (!token || !orderId) return;
            if (!apiUrl) {
                setError("Lỗi cấu hình: API URL chưa được thiết lập.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`${apiUrl}/admin/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.status === 401) throw new Error('Token hết hạn.');
                if (!response.ok) throw new Error('Không thể tải chi tiết đơn hàng.');
                const data = await response.json();
                setOrderDetails(data); 
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [orderId]); 

    const formatCurrency = (amount) => amount.toLocaleString('vi-VN') + 'đ';

    return (
        <div style={styles.popupBackdrop} onClick={onClose}>
            <div style={styles.formPopup} onClick={(e) => e.stopPropagation()}>
                <h3>Chi tiết Đơn hàng #{orderId}</h3>
                {isLoading ? <p>Đang tải chi tiết...</p> :
                 error ? <p style={styles.error}>{error}</p> :
                 orderDetails ? (
                    <div style={{fontSize: '0.9rem'}}>
                        {/* === THÊM HIỂN THỊ NGÀY GIỜ ĐẶT HÀNG === */}
                        <p><strong>Ngày đặt:</strong> {new Date(orderDetails.created_at).toLocaleString('vi-VN')}</p> 
                        <hr style={{margin: '10px 0'}}/>
                        <p><strong>Khách hàng:</strong> {orderDetails.customer_name}</p>
                        <p><strong>SĐT:</strong> {orderDetails.customer_phone}</p>
                        <p><strong>Địa chỉ:</strong> {orderDetails.customer_address}</p>
                        {orderDetails.customer_note && <p><strong>Ghi chú KH:</strong> {orderDetails.customer_note}</p>}
                        <hr style={{margin: '10px 0'}}/>
                        <p><strong>Giao hàng:</strong> {orderDetails.delivery_method_selected === 'NHANH' ? 'Nhanh' : 'Tiêu chuẩn'}</p>
                        <p><strong>Thanh toán:</strong> {orderDetails.payment_method === 'MOMO' ? 'MoMo' : 'Tiền mặt'}</p>
                        <hr style={{margin: '10px 0'}}/>
                        <h4>Các món đã đặt:</h4>
                        <ul style={{listStyle: 'none', paddingLeft: 0, maxHeight: '200px', overflowY: 'auto'}}>
                            {orderDetails.items.map(item => (
                                <li key={item.id} style={{marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '5px'}}>
                                    <strong>{item.quantity}x {item.product_name}</strong> ({formatCurrency(item.item_price)})
                                    {item.options_selected.length > 0 && (
                                        <ul style={{fontSize: '0.85em', color: '#555', paddingLeft: '15px'}}>
                                            {item.options_selected.map((opt, idx) => <li key={idx}>{opt.value_name}</li>)}
                                        </ul>
                                    )}
                                    {item.item_note && <p style={{fontSize: '0.8em', color: '#777', fontStyle: 'italic'}}>Ghi chú món: {item.item_note}</p>}
                                </li>
                            ))}
                        </ul>
                         <hr style={{margin: '10px 0'}}/>
                         <div className="checkout-total" style={{fontSize: '1rem'}}> 
                                <div className="total-row"><span>Tạm tính:</span><span>{formatCurrency(orderDetails.sub_total)}</span></div>
                                <div className="total-row"><span>Phí giao hàng:</span><span>{orderDetails.delivery_fee > 0 ? formatCurrency(orderDetails.delivery_fee) : 'Miễn phí'}</span></div>
                                {orderDetails.discount_amount > 0 && ( <div className="total-row discount"><span>Giảm giá ({orderDetails.voucher_code}):</span><span>-{formatCurrency(orderDetails.discount_amount)}</span></div> )}
                                <div className="total-row final"><span>Tổng cộng:</span><span>{formatCurrency(orderDetails.total_amount)}</span></div>
                         </div>
                    </div>
                 ) : <p>Không tìm thấy dữ liệu.</p>
                }
                 <button onClick={onClose} style={{...styles.buttonAction, marginTop: '20px'}}>Đóng</button>
            </div>
        </div>
    );
}


// --- Component Trang chính (ĐÃ NÂNG CẤP) ---
export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]); 
    const [selectedOrderId, setSelectedOrderId] = useState(null); 
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // === THÊM STATE CHO PHÂN TRANG ===
    const [page, setPage] = useState(1); // Mặc định là trang 1
    const [isLastPage, setIsLastPage] = useState(false); // Cờ để biết đây có phải trang cuối không
    // ==================================

    const orderStatuses = ["MOI", "DA_XAC_NHAN", "DANG_THUC_HIEN", "DANG_GIAO", "HOAN_TAT", "DA_HUY"];
    const statusLabels = { "MOI": "Mới", "DA_XAC_NHAN": "Đã xác nhận", "DANG_THUC_HIEN": "Đang làm", "DANG_GIAO": "Đang giao", "HOAN_TAT": "Hoàn tất", "DA_HUY": "Đã hủy" };

    // --- NÂNG CẤP LOGIC FETCH DỮ LIỆU ---
    const fetchData = async (pageNum = 1) => { 
        setIsLoading(true); setError(''); 
        const token = getToken();
        if (!token) { router.replace('/login'); return; }
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsLoading(false);
            return;
        }

        // Tính toán skip/limit
        const limit = ITEMS_PER_PAGE;
        const skip = (pageNum - 1) * limit;
        
        try {
            // Thêm skip và limit vào URL
            const response = await fetch(`${apiUrl}/admin/orders/?skip=${skip}&limit=${limit}`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) throw new Error('Không thể tải Đơn hàng.');
            
            const data = await response.json();
            setOrders(data);
            setPage(pageNum); // Cập nhật số trang hiện tại

            // Kiểm tra xem đây có phải trang cuối không
            // Nếu số lượng kết quả trả về < số lượng yêu cầu, đây là trang cuối.
            if (data.length < ITEMS_PER_PAGE) {
                setIsLastPage(true);
            } else {
                setIsLastPage(false);
            }

        } catch (err) { 
            setError(err.message); 
            if (err.message.includes('Token')) {
                localStorage.removeItem('admin_token');
                router.replace('/login');
            }
        }
        finally { setIsLoading(false); }
    };

    // Chạy khi trang tải lần đầu (chạy 1 lần)
    useEffect(() => { 
        fetchData(1); // Tải trang 1
    }, []);

    // --- CÁC HÀM XỬ LÝ NÚT PHÂN TRANG ---
    const handleNextPage = () => {
        if (!isLastPage) {
            fetchData(page + 1); // Tải trang kế tiếp
        }
    };
    const handlePrevPage = () => {
        if (page > 1) {
            fetchData(page - 1); // Tải trang trước đó
        }
    };
    // =====================================

    // --- Logic Cập nhật Trạng thái ---
    const handleUpdateStatus = async (orderId, newStatus) => { 
         setError(''); const token = getToken();
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            return;
        }
        try {
            const response = await fetch(`${apiUrl}/admin/orders/${orderId}/status?status=${newStatus}`, { 
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) { const d=await response.json(); throw new Error(d.detail || 'Cập nhật thất bại'); }
            
            // Thay vì tải lại toàn bộ, chỉ cập nhật 1 dòng
            setOrders(prevOrders => prevOrders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

        } catch (err) { setError(err.message); }
    };

    // --- Giao diện ---
    return (
        <div style={styles.container}>
            <Head><title>Quản lý Đơn hàng</title></Head>
            <Link href="/dashboard" style={styles.backLink}>← Quay lại Dashboard</Link>
            <h1>🛒 Quản lý Đơn hàng</h1>
             <button onClick={() => fetchData(page)} style={{...styles.buttonAction, background: '#17a2b8', marginBottom: '15px'}} disabled={isLoading}>
                 {isLoading ? 'Đang tải...' : 'Tải lại trang hiện tại'}
            </button> 

            {error && <p style={styles.error}>{error}</p>}
            
            {/* === THÊM NÚT ĐIỀU HƯỚNG PHÂN TRANG === */}
            <div style={styles.paginationControls}>
                <button onClick={handlePrevPage} disabled={isLoading || page <= 1} style={styles.buttonAction}>
                    ‹ Trang trước
                </button>
                <span style={{padding: '0 15px', color: '#555', fontWeight: 'bold'}}>Trang {page}</span>
                <button onClick={handleNextPage} disabled={isLoading || isLastPage} style={styles.buttonAction}>
                    Trang sau ›
                </button>
            </div>
            {/* ======================================= */}

            {isLoading ? <p>Đang tải đơn hàng...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Mã ĐH</th>
                            {/* === THÊM CỘT THỜI GIAN === */}
                            <th style={styles.th}>Thời gian đặt</th> 
                            <th style={styles.th}>Tổng tiền</th>
                            <th style={styles.th}>Trạng thái</th>
                            <th style={styles.th}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan="5" style={styles.tdCenter}>Chưa có đơn hàng nào.</td></tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} style={order.status === 'MOI' ? {background: '#fffbe6'} : {}}>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>#{order.id}</td>
                                    {/* === THÊM DỮ LIỆU THỜI GIAN === */}
                                    <td style={styles.tdSmall}>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                                    <td style={styles.td}>{order.total_amount.toLocaleString('vi-VN')}đ</td>
                                    <td style={styles.td}>
                                        <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value)} style={styles.statusSelect} >
                                            {orderStatuses.map(status => ( <option key={status} value={status}> {statusLabels[status] || status} </option> ))}
                                        </select>
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => setSelectedOrderId(order.id)} style={styles.detailButton}>Xem CT</button>
                                    </td>
                                 </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
            
            {/* === THÊM NÚT ĐIỀU HƯỚNG (BÊN DƯỚI) === */}
            <div style={styles.paginationControls}>
                <button onClick={handlePrevPage} disabled={isLoading || page <= 1} style={styles.buttonAction}>
                    ‹ Trang trước
                </button>
                <span style={{padding: '0 15px', color: '#555', fontWeight: 'bold'}}>Trang {page}</span>
                <button onClick={handleNextPage} disabled={isLoading || isLastPage} style={styles.buttonAction}>
                    Trang sau ›
                </button>
            </div>
            {/* ======================================= */}

            {/* Modal xem chi tiết (Truyền ID vào) */}
            {selectedOrderId && (
                <OrderDetails orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
}

// --- CSS (THÊM STYLE MỚI) ---
const styles = {
    container: { padding: '30px' },
    backLink: { display: 'inline-block', marginBottom: '20px', color: '#555', textDecoration: 'none' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f4f4f4', padding: '12px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle', fontSize: '0.9rem' },
    tdSmall: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle', fontSize: '0.85em', color: '#555' }, // Style cho cột thời gian
    tdCenter: { padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#777' },
    statusSelect: { padding: '5px', borderRadius: '4px', border: '1px solid #ccc' },
    detailButton: { padding: '5px 10px', background: '#17a2b8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontSize: '0.8rem' },
    popupBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    formPopup: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }, // Cho phép scroll popup
    buttonAction: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', background: '#007bff', color: 'white' },
    paginationControls: { marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, // Style cho Nút phân trang
    checkoutTotal: { fontSize: '1rem', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #eee' }, 
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' },
    totalRowDiscount: { color: '#dc3545', fontWeight: '600' },
    totalRowFinal: { fontSize: '1.1rem', fontWeight: '700', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '5px' }
};

// Merge các style checkout
styles.checkoutTotal = {...styles.checkoutTotal, ...{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }};
styles.totalRow = {...styles.totalRow, ...{ marginBottom: '5px', fontSize: '0.95rem' }};
styles.discount = {...styles.totalRowDiscount, ...{ color: '#dc3545', fontWeight: '600' }}; 
styles.final = {...styles.totalRowFinal, ...{ fontSize: '1.1rem', fontWeight: '700', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '5px' }};