// Tệp: pages/dashboard/options.js
// Mục đích: Trang quản lý "Thư viện Tùy chọn" (Nhóm và Lựa chọn con)

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Hàm trợ giúp để lấy token
const getToken = () => {
    if (typeof window !== 'undefined') { return localStorage.getItem('admin_token'); }
    return null;
};

// Component Form con để thêm Lựa chọn con (Value)
function OptionValueForm({ optionId, onValueCreated }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = getToken();
        try {
            const response = await fetch(`http://127.0.0.1:8000/admin/options/${optionId}/values/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, price_adjustment: parseFloat(price) || 0 }),
            });
            if (!response.ok) throw new Error('Thêm thất bại');
            setName('');
            setPrice(0);
            onValueCreated(); // Báo cho cha tải lại
        } catch (err) {
            alert(err.message); // Tạm thời alert lỗi
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.inlineForm}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên Lựa chọn (Vd: Size L)" required style={styles.inlineInput}/>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Giá thêm (Vd: 5000)" style={{...styles.inlineInput, width: '100px'}} />
            <button type="submit" style={styles.inlineButton} disabled={isSubmitting}>+</button>
        </form>
    );
}


// Component Trang chính
export default function OptionsPage() {
    const router = useRouter();
    const [options, setOptions] = useState([]); // Danh sách Nhóm (lồng Value)
    const [newOption, setNewOption] = useState({ name: '', type: 'CHON_NHIEU' }); // Nhóm mới
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // --- Logic Fetch Dữ liệu ---
    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        const token = getToken();
        if (!token) { router.replace('/login'); return; }

        try {
            const response = await fetch('http://127.0.0.1:8000/admin/options/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401) throw new Error('Token hết hạn.');
            if (!response.ok) throw new Error('Không thể tải Tùy chọn.');
            const data = await response.json();
            setOptions(data);
        } catch (err) {
            setError(err.message);
            // (Xử lý lỗi token...)
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Logic Tạo Nhóm Mới ---
    const handleCreateOption = async (e) => {
        e.preventDefault();
        setError('');
        const token = getToken();
        if (!newOption.name.trim()) { setError("Tên nhóm không được trống."); return; }

        try {
            const response = await fetch('http://127.0.0.1:8000/admin/options/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newOption.name, type: newOption.type, display_order: 0 }), // Thêm display_order
            });
            if (!response.ok) { const d = await response.json(); throw new Error(d.detail || 'Tạo thất bại'); }
            setNewOption({ name: '', type: 'CHON_NHIEU' });
            fetchData();
        } catch (err) { setError(err.message); }
    };

    // --- Logic Xóa Nhóm ---
    const handleDeleteOption = async (optionId) => {
        if (!confirm('Xóa Nhóm này sẽ xóa luôn các Lựa chọn con bên trong. Bạn chắc chắn?')) return;
        setError('');
        const token = getToken();
        try {
            const response = await fetch(`http://127.0.0.1:8000/admin/options/${optionId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Xóa thất bại');
            fetchData();
        } catch (err) { setError(err.message); }
    };

    // --- Logic Xóa Lựa chọn con ---
    const handleDeleteValue = async (valueId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa Lựa chọn này?')) return;
        setError('');
        const token = getToken();
        try {
            const response = await fetch(`http://127.0.0.1:8000/admin/values/${valueId}`, { // API xóa value
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Xóa thất bại');
            fetchData();
        } catch (err) { setError(err.message); }
    };

    // --- Giao diện ---
    return (
        <div style={styles.container}>
            <Head><title>Quản lý Tùy chọn</title></Head>
            <Link href="/dashboard" style={styles.backLink}>← Quay lại Dashboard</Link>
            <h1>⚙️ Quản lý Tùy chọn</h1>

            {/* Form tạo Nhóm mới */}
            <form onSubmit={handleCreateOption} style={styles.form}>
                <h3>Thêm Nhóm Tùy chọn mới</h3>
                <input
                    type="text" value={newOption.name}
                    onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                    placeholder="Tên Nhóm (Vd: Kích cỡ, Topping)" style={styles.input}
                />
                <select
                    value={newOption.type}
                    onChange={(e) => setNewOption({ ...newOption, type: e.target.value })}
                    style={styles.input} >
                    <option value="CHON_NHIEU">Cho phép Chọn Nhiều (Vd: Topping)</option>
                    <option value="CHON_1">Chỉ Chọn 1 (Vd: Size, Độ ngọt)</option>
                </select>
                <button type="submit" style={styles.button}>Thêm Nhóm</button>
            </form>

            {error && <p style={styles.error}>{error}</p>}

            {/* Danh sách các Nhóm và Lựa chọn con */}
            <h2>Thư viện Tùy chọn hiện có:</h2>
            {isLoading ? <p>Đang tải...</p> : (
                <div style={{ marginTop: '20px' }}>
                    {options.length === 0 ? <p>Chưa có Nhóm Tùy chọn nào.</p> :
                        options.map((option) => (
                            <div key={option.id} style={styles.optionGroup}>
                                <div style={styles.optionHeader}>
                                    <h3>{option.name} <span style={styles.optionType}>({option.type === 'CHON_1' ? 'Chọn 1' : 'Chọn nhiều'})</span></h3>
                                    <button onClick={() => handleDeleteOption(option.id)} style={styles.deleteButtonSmall}>Xóa Nhóm</button>
                                </div>
                                <ul>
                                    {option.values.map((value) => (
                                        <li key={value.id} style={styles.valueItem}>
                                            <span>{value.name} (+{value.price_adjustment.toLocaleString('vi-VN')}đ)</span>
                                            <button onClick={() => handleDeleteValue(value.id)} style={styles.deleteButtonSmall}>x</button>
                                        </li>
                                    ))}
                                </ul>
                                {/* Form thêm Value */}
                                <OptionValueForm optionId={option.id} onValueCreated={fetchData} />
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
}

// --- CSS nội bộ ---
const styles = {
    container: { padding: '30px' },
    backLink: { display: 'inline-block', marginBottom: '20px', color: '#555', textDecoration: 'none' },
    form: { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
    input: { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    button: { padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    optionGroup: { border: '1px solid #eee', padding: '15px', marginBottom: '15px', borderRadius: '8px' },
    optionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    optionType: { fontSize: '0.8em', color: '#666', fontWeight: 'normal' },
    valueItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px dashed #f0f0f0' },
    deleteButtonSmall: { padding: '3px 8px', background: '#ffcccc', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#b00', fontSize: '0.8rem' },
    inlineForm: { display: 'flex', gap: '5px', marginTop: '10px' },
    inlineInput: { padding: '5px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem' },
    inlineButton: { padding: '5px 10px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};