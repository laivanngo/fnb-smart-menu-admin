// Tệp: fnb-smart-menu-admin/pages/dashboard/products.js (Bản HOÀN CHỈNH)
// (Đã sửa lỗi cú pháp JSX 'style=""' và bao gồm logic "Hết hàng", "Upload Ảnh")

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
        name: '', description: '', base_price: 0, image_url: '',
        is_best_seller: false,
        is_out_of_stock: false, // Thêm "Hết hàng"
        category_id: categories[0]?.id || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // State cho nút Upload
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
         if (initialData) {
            setProduct(initialData);
        } else {
             // Reset về default
             setProduct({
                name: '', description: '', base_price: 0, image_url: '',
                is_best_seller: false,
                is_out_of_stock: false, // Thêm "Hết hàng"
                category_id: categories.length > 0 ? categories[0].id : ''
            });
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

    // === HÀM XỬ LÝ UPLOAD ẢNH ===
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = getToken();
        if (!apiUrl || !token) {
            setUploadError("Lỗi cấu hình hoặc chưa đăng nhập.");
            return;
        }

        setIsUploading(true);
        setUploadError('');
        
        const formData = new FormData();
        formData.append("file", file); // Tên key phải là "file"

        try {
            const response = await fetch(`${apiUrl}/admin/upload-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData, // Gửi FormData
            });
            if (!response.ok) { const d = await response.json(); throw new Error(d.detail || "Upload thất bại"); }
            
            const data = await response.json();
            
            setProduct(prev => ({ ...prev, image_url: data.image_url }));

        } catch (err) {
            setUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} style={styles.formPopup}>
            <h3>{initialData ? 'Sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}</h3>
            <select name="category_id" value={String(product.category_id)} onChange={handleChange} style={styles.input} required>
                {categories.length === 0 ? <option>Vui lòng tạo Danh mục trước</option> :
                    categories.map(cat => <option key={cat.id} value={String(cat.id)}>{cat.name}</option>)
                }
            </select>
            <input name="name" value={product.name} onChange={handleChange} placeholder="Tên sản phẩm" style={styles.input} required />
            <input name="base_price" type="number" value={product.base_price} onChange={handleChange} placeholder="Giá gốc" style={styles.input} required min="0" />
            
            <label style={styles.label}>Ảnh sản phẩm (Tải lên hoặc dán Emoji/link)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{...styles.input, padding: '5px'}} />
            {isUploading && <p style={{fontSize: '0.9em', color: '#555'}}>Đang tải ảnh lên...</p>}
            {uploadError && <p style={styles.error}>{uploadError}</p>}
            <input name="image_url" value={product.image_url || ''} onChange={handleChange} placeholder="Hoặc dán Emoji/Link ảnh vào đây" style={styles.input} />
            {product.image_url && (
                <div style={{marginTop: '10px', marginBottom: '10px'}}>
                    <p style={{fontSize: '0.8em', color: '#555'}}>Ảnh xem trước:</p>
                    <img 
                        src={product.image_url.startsWith('/') ? `${apiUrl}${product.image_url}` : product.image_url} 
                        alt="Preview" 
                        style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd'}} 
                    />
                </div>
            )}

            <input name="description" value={product.description || ''} onChange={handleChange} placeholder="Mô tả ngắn" style={styles.input} />
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                <div>
                    <input name="is_best_seller" type="checkbox" checked={product.is_best_seller} onChange={handleChange} id="is_best_seller" />
                    <label htmlFor="is_best_seller" style={{marginLeft: '5px'}}> Bán chạy?</label>
                </div>
                <div>
                    <input name="is_out_of_stock" type="checkbox" checked={product.is_out_of_stock} onChange={handleChange} id="is_out_of_stock" />
                    <label htmlFor="is_out_of_stock" style={{color: '#dc3545', marginLeft: '5px'}}> Tạm hết hàng?</label>
                </div>
            </div>

            <div style={styles.formActions}>
                <button type="button" onClick={onCancel} style={{ ...styles.buttonAction, background: '#ccc', color: '#333' }}>Hủy</button>
                <button type="submit" style={styles.buttonAction} disabled={isSubmitting || categories.length === 0}>
                    {isSubmitting ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm Sản phẩm')}
                </button>
            </div>
        </form>
    );
}

// --- Component Quản lý Gắn Tùy chọn ---
function ManageProductOptions({ product, allOptions, onSave, onCancel }) {
    const [selectedOptionIds, setSelectedOptionIds] = useState(() => {
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
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsSaving(false);
            return;
        }

        try {
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
        <div style={styles.formPopup}>
            <h3>Gắn Tùy chọn cho: {product.name}</h3>
            <p>Chọn các Nhóm Tùy chọn sẽ áp dụng:</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                {allOptions.length === 0 ? <p>Không có Tùy chọn nào. Vui lòng tạo ở trang "Quản lý Tùy chọn".</p> :
                    allOptions.map(option => (
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
                    ))
                }
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <div style={styles.formActions}>
                <button onClick={onCancel} style={{ ...styles.buttonAction, background: '#ccc', color: '#333' }} disabled={isSaving}>Hủy</button>
                <button onClick={handleSave} style={styles.buttonAction} disabled={isSaving || allOptions.length === 0}>
                    {isSaving ? 'Đang lưu...' : 'Lưu liên kết'}
                </button>
            </div>
        </div>
    );
}


// --- Component Trang chính ---
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allOptions, setAllOptions] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [managingOptionsFor, setManagingOptionsFor] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter(); // Khai báo router

    // --- Logic Fetch Dữ liệu ---
    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        const token = getToken();
        if (!token) { router.replace('/login'); return; }
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsLoading(false);
            return;
        }

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [prodRes, catRes, optRes] = await Promise.all([
                fetch(`${apiUrl}/admin/products/`, { headers }),
                fetch(`${apiUrl}/admin/categories/`, { headers }),
                fetch(`${apiUrl}/admin/options/`, { headers })
            ]);

            if (prodRes.status === 401 || catRes.status === 401 || optRes.status === 401) throw new Error('Token hết hạn.');
            if (!prodRes.ok || !catRes.ok || !optRes.ok) throw new Error('Không thể tải dữ liệu.');

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const optData = await optRes.json();
            setProducts(prodData);
            setCategories(catData);
            setAllOptions(optData);
        } catch (err) {
            setError(err.message);
            if (err.message.includes('Token')) {
                localStorage.removeItem('admin_token');
                router.replace('/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Logic Mở Form ---
    const handleAddNew = () => { setEditingProduct(null); setShowForm(true); };
    const handleEdit = (product) => { setEditingProduct(product); setShowForm(true); };
    const handleCloseForm = () => { setShowForm(false); setEditingProduct(null); };
    const handleManageOptions = (product) => { setManagingOptionsFor(product); };
    const handleCloseOptionsForm = () => { setManagingOptionsFor(null); };

    // --- Logic Submit Form (Tạo/Sửa) ---
    const handleFormSubmit = async (productData) => {
        setError('');
        const token = getToken();
        if (!apiUrl) { setError("Lỗi cấu hình: API URL chưa được thiết lập."); return; }
        
        const isEditing = !!editingProduct;
        const url = isEditing ? `${apiUrl}/admin/products/${editingProduct.id}` : `${apiUrl}/admin/products/`;
        const method = isEditing ? 'PUT' : 'POST';

        let bodyPayload;
        let finalUrl = url;

        if (isEditing) {
            bodyPayload = { // Schema Update
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                image_url: productData.image_url,
                is_best_seller: productData.is_best_seller,
                is_out_of_stock: productData.is_out_of_stock,
                category_id: parseInt(productData.category_id)
            };
        } else {
            bodyPayload = { // Schema Create
                name: productData.name,
                description: productData.description,
                base_price: productData.base_price,
                image_url: productData.image_url,
                is_best_seller: productData.is_best_seller,
                is_out_of_stock: productData.is_out_of_stock,
                category_id: parseInt(productData.category_id)
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
    const handleDelete = async (productId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
        setError('');
        const token = getToken();
        if (!apiUrl) { setError("Lỗi cấu hình: API URL chưa được thiết lập."); return; }

        try {
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

            {/* Component ProductForm */}
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

            {/* Component ManageProductOptions */}
            {managingOptionsFor && (
                 <div style={styles.popupBackdrop}>
                    <ManageProductOptions
                        product={managingOptionsFor}
                        allOptions={allOptions}
                        onSave={() => { handleCloseOptionsForm(); fetchData(); }}
                        onCancel={handleCloseOptionsForm}
                    />
                </div>
            )}
            
            {/* Bảng hiển thị (Đã thêm cột Trạng thái) */}
            {isLoading ? ( <p>Đang tải danh sách...</p> ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {/* === SỬA LỖI CÚ PHÁP TẠI ĐÂY === */}
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Ảnh</th>
                            <th style={styles.th}>Tên Sản phẩm</th>
                            <th style={styles.th}>Giá</th>
                            <th style={styles.th}>Danh mục</th>
                            <th style={styles.th}>Tùy chọn Gắn</th>
                            <th style={styles.th}>Trạng thái</th>
                            <th style={styles.th}>Hành động</th>
                            {/* === KẾT THÚC SỬA LỖI === */}
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                             <tr><td colSpan="8" style={styles.tdCenter}>Chưa có sản phẩm nào.</td></tr>
                        ) : (
                            products.map((prod) => (
                                <tr key={prod.id}>
                                    <td style={styles.td}>{prod.id}</td>
                                    <td style={styles.td}>
                                        {/* Hiển thị ảnh preview */}
                                        {prod.image_url && (
                                            prod.image_url.startsWith('/') ?
                                            <img src={`${apiUrl}${prod.image_url}`} alt={prod.name} style={styles.tableImage} />
                                            : <span style={{fontSize: '1.5rem'}}>{prod.image_url}</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{prod.name}</td>
                                    <td style={styles.td}>{prod.base_price.toLocaleString('vi-VN')}đ</td>
                                    <td style={styles.td}>
                                        {categories.find(c => c.id === prod.category_id)?.name || 'N/A'}
                                    </td>
                                    <td style={styles.tdSmall}>
                                        {prod.options?.length > 0
                                            ? prod.options.map(opt => opt.name).join(', ')
                                            : <i style={{color: '#888'}}>Chưa có</i>}
                                    </td>
                                    <td style={styles.td}>
                                        {prod.is_out_of_stock 
                                            ? <span style={styles.inactiveBadge}>Hết hàng</span> 
                                            : <span style={styles.activeBadge}>Đang bán</span>
                                        }
                                    </td>
                                    <td style={styles.td}>
                                        <button onClick={() => handleEdit(prod)} style={styles.editButton}>Sửa</button>
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

// --- CSS (Thêm Badge) ---
const styles = {
    container: { padding: '30px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' },
    backLink: { display: 'inline-block', marginBottom: '20px', color: '#555', textDecoration: 'none' },
    button: { padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', marginBottom: '20px' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f4f4f4', padding: '12px', border: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
    td: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle' },
    tableImage: { width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' },
     tdSmall: { padding: '10px', border: '1px solid #ddd', verticalAlign: 'middle', fontSize: '0.85em', color: '#555' },
    tdCenter: { padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#777' },
    buttonAction: { padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
    editButton: { marginRight: '5px', padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#333' },
    linkButton: { marginRight: '5px', padding: '5px 10px', background: '#17a2b8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' },
    deleteButton: { padding: '5px 10px', background: '#dc3545', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' },
    popupBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    formPopup: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
    input: { display: 'block', width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    formActions: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    activeBadge: { background: '#28a745', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.8em' },
    inactiveBadge: { background: '#6c757d', color: 'white', padding: '3px 8px', borderRadius: '10px', fontSize: '0.8em' }
};