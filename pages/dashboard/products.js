// Tệp: pages/dashboard/products.js (ĐÃ SỬA LỖI HARD-CODE)

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

// --- Component Form Sửa/Thêm Sản phẩm ---
function ProductForm({ initialData, categories, onSubmit, onCancel }) {
    const [product, setProduct] = useState(initialData || {
        name: '', description: '', base_price: 0, image_url: '', is_best_seller: false, category_id: categories[0]?.id || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!initialData && categories.length > 0 && !product.category_id) {
            setProduct(p => ({ ...p, category_id: categories[0].id }));
        }
         // Cập nhật state nếu initialData thay đổi (khi bấm sửa sản phẩm khác)
         if (initialData) {
            setProduct(initialData);
        }
    }, [categories, initialData]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'base_price' ? parseFloat(value) || 0 : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(product); // Gọi hàm submit từ component cha
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} style={styles.formPopup}>
            <h3>{initialData ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
             {/* Đảm bảo category_id là string để khớp với value của option */}
            <select name="category_id" value={String(product.category_id)} onChange={handleChange} style={styles.input} required>
                {categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)}
            </select>
            <input name="name" value={product.name} onChange={handleChange} placeholder="Tên sản phẩm" style={styles.input} required />
            <input name="base_price" type="number" value={product.base_price} onChange={handleChange} placeholder="Giá gốc" style={styles.input} required min="0" />
            <input name="description" value={product.description || ''} onChange={handleChange} placeholder="Mô tả ngắn" style={styles.input} />
            <input name="image_url" value={product.image_url || ''} onChange={handleChange} placeholder="Emoji hoặc Link ảnh" style={styles.input} />
            <div>
                <input name="is_best_seller" type="checkbox" checked={product.is_best_seller} onChange={handleChange} id="is_best_seller" />
                <label htmlFor="is_best_seller"> Là sản phẩm Bán chạy?</label>
            </div>
            <div style={styles.formActions}>
                <button type="button" onClick={onCancel} style={{ ...styles.buttonAction, background: '#ccc', color: '#333' }}>Hủy</button> {/* Sửa style button */}
                <button type="submit" style={styles.buttonAction} disabled={isSubmitting}> {/* Sửa style button */}
                    {isSubmitting ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm Sản phẩm')}
                </button>
            </div>
        </form>
    );
}

// --- Component MỚI: Quản lý Gắn Tùy chọn ---
function ManageProductOptions({ product, allOptions, onSave, onCancel }) {
    const [selectedOptionIds, setSelectedOptionIds] = useState(() => {
        // Lấy ID các option đã gắn sẵn vào sản phẩm
        const initialIds = product.options?.map(opt => opt.id) || [];
        return new Set(initialIds);
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCheckboxChange = (optionId) => {
        setSelectedOptionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(optionId)) {
                newSet.delete(optionId);
            } else {
                newSet.add(optionId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        const token = getToken();

        // 1. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsSaving(false);
            return;
        }

        try {
            // 2. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/products/${product.id}/link_options`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ option_ids: Array.from(selectedOptionIds) }),
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) throw new Error('Lưu liên kết thất bại.');
            onSave(); // Báo cho cha tải lại
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={styles.formPopup}> {/* Tái sử dụng style popup */}
            <h3>Gắn Tùy chọn cho: {product.name}</h3>
            <p>Chọn các Nhóm Tùy chọn sẽ áp dụng:</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                {allOptions.map(option => (
                    <div key={option.id} style={{ padding: '5px 0' }}>
                        <input
                            type="checkbox"
                            id={`opt-${product.id}-${option.id}`}
                            checked={selectedOptionIds.has(option.id)}
                            onChange={() => handleCheckboxChange(option.id)}
                        />
                        <label htmlFor={`opt-${product.id}-${option.id}`} style={{ marginLeft: '8px' }}>
                            {option.name} ({option.type === 'CHON_1' ? 'Chọn 1' : 'Chọn nhiều'})
                        </label>
                    </div>
                ))}
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.formActions}>
                <button onClick={onCancel} style={{ ...styles.buttonAction, background: '#ccc', color: '#333' }} disabled={isSaving}>Hủy</button>
                <button onClick={handleSave} style={styles.buttonAction} disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu liên kết'}
                </button>
            </div>
        </div>
    );
}


// Component Trang chính
export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allOptions, setAllOptions] = useState([]); // Thêm state cho Thư viện Tùy chọn
    const [editingProduct, setEditingProduct] = useState(null);
    const [managingOptionsFor, setManagingOptionsFor] = useState(null); // State mới: Sản phẩm đang được gắn tùy chọn
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- Logic Fetch Dữ liệu (Thêm Options) ---
    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        const token = getToken();
        if (!token) { router.replace('/login'); return; }

        // 3. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsLoading(false);
            return;
        }

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            // 4. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const [prodRes, catRes, optRes] = await Promise.all([
                fetch(`${apiUrl}/admin/products/`, { headers }),
                fetch(`${apiUrl}/admin/categories/`, { headers }),
                fetch(`${apiUrl}/admin/options/`, { headers }) // Lấy Thư viện Tùy chọn
            ]);

            if (prodRes.status === 401 || catRes.status === 401 || optRes.status === 401) throw new Error('Token hết hạn.');
            if (!prodRes.ok || !catRes.ok || !optRes.ok) throw new Error('Không thể tải dữ liệu.');

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const optData = await optRes.json(); // Lưu Options
            setProducts(prodData);
            setCategories(catData);
            setAllOptions(optData); // Cập nhật state Options
        } catch (err) {
            setError(err.message);
            // (Xử lý lỗi token...)
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Logic Mở Form ---
    const handleAddNew = () => { setEditingProduct(null); setShowForm(true); };
    const handleEdit = (product) => { setEditingProduct(product); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setEditingProduct(null); };

    // --- Logic Mở/Đóng Form Gắn Tùy chọn ---
    const handleManageOptions = (product) => { setManagingOptionsFor(product); };
    const handleCloseOptionsForm = () => { setManagingOptionsFor(null); };

    // --- Logic Submit Form (Tạo/Sửa) ---
    const handleFormSubmit = async (productData) => { /* ... (Giữ nguyên như cũ) ... */
        setError('');
        const token = getToken();
        
        // 5. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            return;
        }
        
        const isEditing = !!editingProduct;
        // 6. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
        const url = isEditing ? `${apiUrl}/admin/products/${editingProduct.id}` : `${apiUrl}/admin/products/`;
        const method = isEditing ? 'PUT' : 'POST';

        const payload = { ...productData };
         // API Create cần category_id riêng, API Update cần category_id trong body
        let bodyPayload;
        let finalUrl = url;

        if (isEditing) {
            bodyPayload = { // Schema Update khác Create
                name: payload.name,
                description: payload.description,
                base_price: payload.base_price,
                image_url: payload.image_url,
                is_best_seller: payload.is_best_seller,
                category_id: parseInt(payload.category_id)
            };
        } else {
             // API Create cần category_id trên URL query param
             // Nhưng code backend hiện tại (schemas.ProductCreate) lại yêu cầu trong body
             // => Gửi category_id trong body luôn cho thống nhất
            bodyPayload = {
                ...payload,
                category_id: parseInt(payload.category_id)
            };
        }

        try {
            const response = await fetch(finalUrl, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload)
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) { const errData = await response.json(); throw new Error(errData.detail || 'Lưu thất bại'); }
            handleCloseForm();
            fetchData();
        } catch (err) { setError(err.message); }
    };

    // --- Logic Xóa Sản phẩm ---
    const handleDelete = async (productId) => { /* ... (Giữ nguyên như cũ) ... */
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        setError('');
        const token = getToken();

        // 7. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            return;
        }

        try {
            // 8. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/products/${productId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) throw new Error('Xóa thất bại.');
            fetchData();
        } catch (err) { setError(err.message); }
    };

    // --- Giao diện ---
    return (
        <div style={styles.container}>
            <Head><title>Quản lý Sản phẩm</title></Head>
            <Link href="/dashboard" style={styles.backLink}>← Quay lại Dashboard</Link>
            <h1>🍔 Quản lý Sản phẩm</h1>

            <button onClick={handleAddNew} style={styles.button}>+ Thêm Sản phẩm Mới</button>

            {error && <p style={styles.error}>{error}</p>}

            {/* Form Thêm/Sửa Sản phẩm (popup) */}
            {showForm && (
                <div style={styles.popupBackdrop}>
                    <ProductForm
                        initialData={editingProduct}
                        categories={categories}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCloseForm}
                    />
                </div>
            )}

            {/* Form Gắn Tùy chọn (popup) */}
            {managingOptionsFor && (
                 <div style={styles.popupBackdrop}>
                    <ManageProductOptions
                        product={managingOptionsFor}
                        allOptions={allOptions}
                        onSave={() => { handleCloseOptionsForm(); fetchData(); }} // Đóng form và tải lại
                        onCancel={handleCloseOptionsForm}
                    />
                </div>
            )}

            {/* Bảng hiển thị danh sách */}
            {isLoading ? ( <p>Đang tải danh sách...</p> ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style="...styles.th">Tên Sản phẩm</th>
                            <th style="...styles.th">Giá</th>
                            <th style="...styles.th">Danh mục</th>
                            <th style="...styles.th">Tùy chọn Gắn</th> {/* Thêm cột mới */}
                            <th style="...styles.th">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                             <tr><td colSpan="6" style={styles.tdCenter}>Chưa có sản phẩm nào.</td></tr>
                        ) : (
                            products.map((prod) => (
                                <tr key={prod.id}>
                                    <td style={styles.td}>{prod.id}</td>
                                    <td style={styles.td}>{prod.name}</td>
                                    <td style={styles.td}>{prod.base_price.toLocaleString('vi-VN')}đ</td>
                                    <td style={styles.td}>
                                        {categories.find(c => c.id === prod.category_id)?.name || 'N/A'}
                                    </td>
                                    {/* Cột hiển thị Tùy chọn đã gắn */}
                                    <td style={styles.tdSmall}>
                                        {prod.options?.length > 0
                                            ? prod.options.map(opt => opt.name).join(', ')
                                            : <i style={{color: '#888'}}>Chưa có</i>}
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleEdit(prod)} style={styles.editButton}>Sửa</button>
                                        {/* NÚT GẮN TÙY CHỌN */}
                                        <button onClick={() => handleManageOptions(prod)} style={styles.linkButton}>Gắn</button>
                                        <button onClick={() => handleDelete(prod.id)} style={styles.deleteButton}>Xóa</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// --- CSS nội bộ ---
const styles = {
    container: { padding: '30px' },
    backLink: { display: 'inline-block', marginBottom: '20px', color: '#555', textDecoration: 'none' },
    button: { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', marginBottom: '20px' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f4f4f4', padding: '12px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle' },
     tdSmall: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle', fontSize: '0.85em', color: '#555' },
    tdCenter: { padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#777' },
    buttonAction: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }, // Style chung cho nút form
    editButton: { marginRight: '5px', padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#333' },
    linkButton: { marginRight: '5px', padding: '5px 10px', background: '#17a2b8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' }, // Nút "Gắn"
    deleteButton: { padding: '5px 10px', background: '#dc3545', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' },
    popupBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    formPopup: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px' },
    input: { display: 'block', width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    formActions: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }
};