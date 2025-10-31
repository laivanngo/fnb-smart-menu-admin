// Tệp: pages/dashboard/categories.js (ĐÃ SỬA LỖI HARD-CODE)
// Mục đích: Trang quản lý Danh mục (Xem và Thêm mới)

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link để tạo liên kết nội bộ

// Hàm trợ giúp để lấy token
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('admin_token');
    }
    return null;
};

// Sử dụng biến này
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]); // Danh sách danh mục
    const [newCategoryName, setNewCategoryName] = useState(''); // Tên danh mục mới
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true); // Trạng thái tải dữ liệu

    // --- Logic Lấy Danh mục ---
    const fetchCategories = async () => {
        setIsLoading(true);
        setError('');
        const token = getToken();
        if (!token) {
            router.replace('/login');
            return;
        }

        // 1. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            setIsLoading(false);
            return;
        }

        try {
            // 2. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/categories/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 401) throw new Error('Token hết hạn hoặc không hợp lệ.');
            if (!response.ok) throw new Error('Không thể tải danh mục.');

            const data = await response.json();
            setCategories(data);
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

    // Chạy khi trang tải lần đầu
    useEffect(() => {
        fetchCategories();
    }, []); // Chỉ chạy 1 lần

    // --- Logic Tạo Danh mục Mới ---
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setError('');
        const token = getToken();
        if (!newCategoryName.trim()) {
            setError("Tên danh mục không được để trống.");
            return;
        }
        
        // 3. Thêm kiểm tra apiUrl
        if (!apiUrl) {
            setError("Lỗi cấu hình: API URL chưa được thiết lập.");
            return;
        }

        try {
            // 4. SỬA LỖI TẠI ĐÂY: Dùng ${apiUrl}
            const response = await fetch(`${apiUrl}/admin/categories/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newCategoryName,
                    display_order: 0 // Tạm thời để 0, sẽ làm chức năng sắp xếp sau
                }),
            });

            if (response.status === 401) throw new Error('Token hết hạn hoặc không hợp lệ.');
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.detail || 'Tạo danh mục thất bại');
            }

            setNewCategoryName(''); // Xóa ô nhập
            fetchCategories(); // Tải lại danh sách mới

        } catch (err) {
            setError(err.message);
            // (Xử lý lỗi token...)
        }
    };

    // --- Giao diện ---
    return (
        <div style={styles.container}>
            <Head><title>Quản lý Danh mục</title></Head>

            {/* Thêm liên kết quay về Dashboard chính */}
            <Link href="/dashboard" style={styles.backLink}>← Quay lại Dashboard</Link>

            <h1>📚 Quản lý Danh mục</h1>

            {/* Form tạo mới */}
            <form onSubmit={handleCreateCategory} style={styles.form}>
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Tên danh mục mới (Vd: Trà Sữa)"
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>Thêm Danh mục</button>
            </form>

            {error && <p style={styles.error}>{error}</p>}

            {/* Bảng hiển thị danh sách */}
            {isLoading ? (
                <p>Đang tải danh sách...</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Tên Danh mục</th>
                            {/* <th style={styles.th}>Hành động</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={styles.tdCenter}>Chưa có danh mục nào.</td>
                            </tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td style={styles.td}>{cat.id}</td>
                                    <td style={styles.td}>{cat.name}</td>
                                    {/* <td style={styles.td}>
                                        (Các nút Sửa/Xóa sẽ ở đây)
                                    </td> */}
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
    form: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' },
    input: { flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem' },
    button: { padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' },
    error: { color: 'red', marginBottom: '15px', fontSize: '0.9rem' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' },
    th: { background: '#f4f4f4', padding: '12px', border: '1px solid #ddd', textAlign: 'left' },
    td: { padding: '10px', border: '1px solid #ddd' },
    tdCenter: { padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#777' }
};