// Tệp: pages/dashboard/orders.js (ĐÃ SỬA LỖI HARD-CODE)

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

// Component để hiển thị chi tiết đơn hàng (Modal)
function OrderDetails({ orderId, onClose }) { // Nhận orderId thay vì cả object
    const [orderDetails, setOrderDetails] = useState(null); // State để lưu chi tiết
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    // Fetch chi tiết đơn hàng khi modal mở ra
    useEffect(() => {
        const fetchDetails = async () => {
            setIsLoading(true); setError(''); const token = getToken();
            if (!token || !orderId) return;

            // 1. Thêm kiểm tra apiUrl
            if (!apiUrl) {
                setError("Lỗi cấu hình: API URL chưa được thiết lập.");
                setIsLoading(false);
                return;
            }

            try {
                // 2. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
                const response = await fetch(`${apiUrl}/admin/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.status === 401) throw new Error('Token hết hạn.');
                if (!response.ok) throw new Error('Không thể tải chi tiết đơn hàng.');
                const data = await response.json();
                setOrderDetails(data); // Lưu chi tiết vào state
            } catch (err) {
                setError(err.message);
                // (Xử lý lỗi token...)
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [orderId]); // Chạy lại khi orderId thay đổi

    // Hàm format tiền tệ
    const formatCurrency = (amount) => amount.toLocaleString('vi-VN') + 'đ';

    return (
        <div style={styles.popupBackdrop} onClick={onClose}>
            <div style={styles.formPopup} onClick={(e) => e.stopPropagation()}>
                <h3>Chi tiết Đơn hàng #{orderId}</h3>
                {isLoading ? <p>Đang tải chi tiết...</p> :
                 error ? <p style={styles.error}>{error}</p> :
                 orderDetails ? (
                    <div style={{fontSize: '0.9rem'}}>
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
                         <div className="checkout-total" style={{fontSize: '1rem'}}> {/* Tái sử dụng class CSS */}
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


// Component Trang chính
export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]); // Danh sách đơn hàng (cơ bản)
    const [selectedOrderId, setSelectedOrderId] = useState(null); // Chỉ lưu ID đơn hàng đang xem
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const orderStatuses = ["MOI", "DA_XAC_NHAN", "DANG_THUC_HIEN", "DANG_GIAO", "HOAN_TAT", "DA_HUY"];
    const statusLabels = { "MOI": "Mới", "DA_XAC_NHAN": "Đã xác nhận", "DANG_THUC_HIEN": "Đang làm", "DANG_GIAO": "Đang giao", "HOAN_TAT": "Hoàn tất", "DA_HUY": "Đã hủy" };

    // --- Logic Fetch Dữ liệu ---
    const fetchData = async () => { /* ... (Giữ nguyên) ... */
        setIsLoading(true); setError(''); const token = getToken();
        if (!token) { router.replace('/login'); return; }

        // 3. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsLoading(false);
            return;
        }

        try {
            // 4. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/orders/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) throw new Error('Không thể tải Đơn hàng.');
            const data = await response.json();
            setOrders(data);
        } catch (err) { setError(err.message); /* (Xử lý lỗi token...) */ }
        finally { setIsLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    // --- Logic Cập nhật Trạng thái ---
    const handleUpdateStatus = async (orderId, newStatus) => { /* ... (Giữ nguyên) ... */
         setError(''); const token = getToken();

        // 5. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            return;
        }

        try {
            // 6. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/orders/${orderId}/status?status=${newStatus}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) { const d=await response.json(); throw new Error(d.detail || 'Cập nhật thất bại'); }
            fetchData();
        } catch (err) { setError(err.message); /* (Xử lý lỗi token...) */ }
    };

    // --- Giao diện ---
    return (
        <div style={styles.container}>
            <Head><title>Quản lý Đơn hàng</title></Head>
            <Link href="/dashboard" style={styles.backLink}>← Quay lại Dashboard</Link>
            <h1>🛒 Quản lý Đơn hàng</h1>
             <button onClick={fetchData} style={{...styles.buttonAction, background: '#17a2b8', marginBottom: '15px'}} disabled={isLoading}>
                 {isLoading ? 'Đang tải...' : 'Tải lại danh sách'}
            </button> {/* Nút tải lại */}

            {error && <p style={styles.error}>{error}</p>}

            {isLoading ? <p>Đang tải đơn hàng...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Mã ĐH</th>
                            <th style={styles.th}>Tổng tiền</th>
                            <th style={styles.th}>Trạng thái</th>
                            <th style={styles.th}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan="4" style={styles.tdCenter}>Chưa có đơn hàng nào.</td></tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} style={order.status === 'MOI' ? {background: '#fffbe6'} : {}}>
                                    <td style={{...styles.td, fontWeight: 'bold'}}>#{order.id}</td>
                                    <td style={styles.td}>{order.total_amount.toLocaleString('vi-VN')}đ</td>
                                    <td style={styles.td}>
                                        <select value={order.status} onChange={(e) => handleUpdateStatus(order.id, e.target.value)} style={styles.statusSelect} >
                                            {orderStatuses.map(status => ( <option key={status} value={status}> {statusLabels[status] || status} </option> ))}
                                        </select>
                                    </td>
                                    <td style={styles.td}>
                                        {/* Lưu ID vào state khi bấm nút */}
                                        <button onClick={() => setSelectedOrderId(order.id)} style={styles.detailButton}>Xem CT</button>
                                    </td>
                                 </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* Modal xem chi tiết (Truyền ID vào) */}
            {selectedOrderId && (
                <OrderDetails orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
}

// --- CSS nội bộ ---
const styles = {
    container: { padding: '30px' },
    backLink: { display: 'inline-block', marginBottom: '20px', color: '#555', textDecoration: 'none' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f4f4f4', padding: '12px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle', fontSize: '0.9rem' },
    tdCenter: { padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#777' },
    statusSelect: { padding: '5px', borderRadius: '4px', border: '1px solid #ccc' },
    detailButton: { padding: '5px 10px', background: '#17a2b8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontSize: '0.8rem' },
    popupBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    formPopup: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column'}, // Thêm flex
    buttonAction: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
     // Thêm style cho phần total trong popup
    checkoutTotal: { fontSize: '1rem', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #eee' }, // Đẩy xuống cuối
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.95rem' },
    totalRowDiscount: { color: '#dc3545', fontWeight: '600' },
    totalRowFinal: { fontSize: '1.1rem', fontWeight: '700', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '5px' }
};

// Merge các style checkout vào styles chung (để tái sử dụng class)
styles.checkoutTotal = {...styles.checkoutTotal, ...{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }};
styles.totalRow = {...styles.totalRow, ...{ marginBottom: '5px', fontSize: '0.95rem' }};
styles.discount = {...styles.totalRowDiscount, ...{ color: '#dc3545', fontWeight: '600' }}; // Đổi tên class
styles.final = {...styles.totalRowFinal, ...{ fontSize: '1.1rem', fontWeight: '700', borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '5px' }}; // Đổi tên class