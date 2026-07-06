# FE Tasks: DIYPosts & Order Report (Customer, Admin, Staff)

## Mục lục
1. [DIYPosts Frontend](#1-diyposts-frontend)
2. [Order Report Frontend - Customer](#2-order-report-customer)
3. [Order Report Frontend - Admin](#3-order-report-admin)
4. [Order Report Frontend - Staff](#4-order-report-staff)

---

# 1. DIYPosts Frontend

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|------|
| GET | `/diy-posts` | Lấy danh sách posts (public) |
| GET | `/diy-posts/:id` | Chi tiết post (public) |
| POST | `/diy-posts` | Tạo post mới (auth + DIYPost create permission) |
| PUT | `/diy-posts/:id` | Cập nhật post (auth + DIYPost update permission) |
| DELETE | `/diy-posts/:id` | Xóa post (auth + DIYPost delete permission) |

## Request/Response Format

### POST / PUT: `multipart/form-data`

Body gửi lên là FormData với:
- `data`: JSON string chứa thông tin post
- `images`: file ảnh (có thể upload nhiều file cùng field name `images`)

Ví dụ:

```javascript
const formData = new FormData();
formData.append('data', JSON.stringify({
  title: "My DIY Project",
  description: "Hướng dẫn móc len...",
  tags: ["beginner", "scarf"],
  linkedProduct: [{ productId: "..." }],
  linkedCombo: [{ comboId: "..." }],
  price: 50000
}));
// Append multiple images
formData.append('images', file1);
formData.append('images', file2);
```

### Response (GET List)
```json
{
  "status": "success",
  "data": {
    "posts": [
      {
        "_id": "...",
        "creatorId": "ObjectId (chỉ ID)",
        "title": "...",
        "description": "...",
        "images": ["cloudinary_url_1", "cloudinary_url_2"],
        "tags": ["tag1"],
        "linkedProduct": [{ "productId": "ObjectId" }],
        "linkedCombo": [{ "comboId": "ObjectId" }],
        "likeCount": 0,
        "purchaseCount": 0,
        "price": 50000,
        "status": "pending",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## FE Work Required

### 1.1 DIY Types
Tạo/Cập nhật file: `FE/src/features/diy/types/diy.types.ts`

```typescript
export interface DIYPostFormData {
  title: string;
  description: string;
  images: File[];
  tags: string[];
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}

export interface CreateDIYPostDTO {
  title: string;
  description: string;
  tags?: string[];
  linkedProduct?: { productId: string }[];
  linkedCombo?: { comboId: string }[];
  price?: number;
}
```

### 1.2 DIY Service
Tạo file: `FE/src/features/diy/services/diy.service.ts`

Service gọi API với axios, POST/PUT dùng FormData:

```typescript
import axiosClient from "../../../lib/axiosClient";
import type { CreateDIYPostDTO } from "../types/diy.types";

export const diyService = {
  getAllPosts: (params?: { page?: number; limit?: number; status?: string }) =>
    axiosClient.get("/diy-posts", { params }),

  getPostById: (id: string) =>
    axiosClient.get(`/diy-posts/${id}`),

  createPost: (data: CreateDIYPostDTO, images: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    images.forEach((file) => formData.append("images", file));
    return axiosClient.post("/diy-posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updatePost: (id: string, data: Partial<CreateDIYPostDTO>, images?: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (images) {
      images.forEach((file) => formData.append("images", file));
    }
    return axiosClient.put(`/diy-posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deletePost: (id: string) =>
    axiosClient.delete(`/diy-posts/${id}`),
};
```

### 1.3 DIY Store
Cập nhật: `FE/src/features/diy/store/diy.store.ts`

Thêm các actions cho CRUD và state cho create/update/delete.

### 1.4 Components cần tạo/sửa

#### a) DIYCreatePage (`FE/src/app/pages/DIYCreatePage.tsx`)
- Form tạo post mới
- Upload nhiều ảnh (preview trước khi upload)
- Input: title, description, tags, price
- Select: linkedProduct (danh sách product), linkedCombo (danh sách kit)
- Submit: gọi `diyService.createPost()` với FormData
- Loading state khi upload ảnh
- Error handling: toast error

#### b) DIYEditModal
- Modal cập nhật post
- Pre-fill dữ liệu hiện tại
- Upload thêm ảnh mới (giữ ảnh cũ)
- Chỉ cho phép edit khi status = "pending"
- Button: Save, Cancel

#### c) DIYDetailPage (`FE/src/app/pages/DIYDetailPage.tsx`)
- Hiển thị chi tiết post
- Hiển thị ảnh (gallery)
- Hiển thị linked products/combos
- Like/purchase buttons (nếu có)
- Nút Edit/Delete (chỉ creator hoặc admin/staff)

#### d) DIYFeedPage (`FE/src/app/pages/DIYFeedPage.tsx`)
- Danh sách posts (card grid)
- Filter theo status (nếu admin)
- Search theo title/tags
- Pagination

### 1.5 Admin DIY Management
Thêm route `/admin/diy-posts` trong AdminPage.tsx

Bảng quản lý với:
- Danh sách tất cả posts (kể cả pending)
- Filter by status (pending/approved/rejected)
- Approve/Reject post (cập nhật status)
- Xóa post
- Search

---

# 2. Order Report - Customer

## API Endpoints (Customer)

| Method | Endpoint | Mô tả |
|--------|----------|------|
| POST | `/order-reports` | Tạo report mới |
| GET | `/order-reports/my` | DS report của tôi |
| GET | `/order-reports/:id` | Chi tiết report |
| PUT | `/order-reports/:id` | Sửa report (chỉ khi PENDING) |
| DELETE | `/order-reports/:id` | Xóa report (chỉ khi PENDING) |

## Request/Response

### POST `/order-reports`
```json
{
  "orderId": "order_object_id",
  "title": "Wrong Product",
  "description": "Sản phẩm nhận được khác với đơn hàng",
  "images": []
}
```

### Response
```json
{
  "status": "success",
  "message": "Report created successfully",
  "data": {
    "_id": "...",
    "orderId": "...",
    "reporterId": "...",
    "title": "...",
    "description": "...",
    "images": [],
    "status": "PENDING",
    "adminNote": "",
    "assignedStaff": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### GET `/order-reports/my?page=1&limit=10`
```json
{
  "status": "success",
  "data": {
    "reports": [...],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## FE Work Required (Customer)

### 2.1 Types
Tạo: `FE/src/features/orderReport/types/orderReport.types.ts`

```typescript
export interface OrderReport {
  _id: string;
  orderId: string;
  reporterId: string;
  title: string;
  description: string;
  images: string[];
  status: "PENDING" | "DONE" | "CANCELLED";
  adminNote?: string;
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderReportDTO {
  orderId: string;
  title: string;
  description: string;
  images?: string[];
}
```

### 2.2 Service
Tạo: `FE/src/features/orderReport/services/orderReport.service.ts`

```typescript
import axiosClient from "../../../lib/axiosClient";
import type { CreateOrderReportDTO } from "../types/orderReport.types";

export const orderReportService = {
  create: (data: CreateOrderReportDTO) =>
    axiosClient.post("/order-reports", data),

  getMyReports: (params?: { page?: number; limit?: number }) =>
    axiosClient.get("/order-reports/my", { params }),

  getById: (id: string) =>
    axiosClient.get(`/order-reports/${id}`),

  update: (id: string, data: Partial<CreateOrderReportDTO>) =>
    axiosClient.put(`/order-reports/${id}`, data),

  delete: (id: string) =>
    axiosClient.delete(`/order-reports/${id}`),
};
```

### 2.3 Components cần tạo

#### a) "Report Order" Button trong Order Detail
- Trong trang chi tiết đơn hàng, thêm nút **"Report Issue"**
- Click → mở modal tạo report
- Chỉ hiển thị nếu order thuộc về user hiện tại

#### b) CreateReportModal
- Select order (nếu ở trang orders/my thì tự động chọn)
- Input: title, description
- Upload images (nếu cần)
- Submit → gọi `orderReportService.create()`
- Success → toast + redirect đến danh sách reports

#### c) MyReportsPage (`FE/src/app/pages/MyReportsPage.tsx`)
- Route: `/orders/reports`
- Danh sách reports của user
- Card list (mobile-friendly)
- Mỗi card hiển thị: title, orderId (rút gọn), status badge, date
- Click → detail modal

#### d) ReportDetailModal
- Chi tiết report
- Hiển thị: title, description, images, status, adminNote, assignedStaff
- Nút Edit (nếu PENDING) → mở form sửa
- Nút Delete (nếu PENDING) → confirm + delete
- Nút Back

### 2.4 Navigation cho Customer
Thêm route:
```tsx
<Route path="orders/reports" element={<MyReportsPage />} />
```
Có thể thêm trong My Orders page hoặc Profile.

---

# 3. Order Report - Admin

## API Endpoints (Admin)

| Method | Endpoint | Mô tả |
|--------|----------|------|
| GET | `/order-reports` | DS tất cả reports (search, filter, pagination) |
| GET | `/order-reports/:id` | Chi tiết |
| PATCH | `/order-reports/:id/status` | Cập nhật status (DONE/CANCELLED) |
| PATCH | `/order-reports/:id/assign` | Gán staff |
| PATCH | `/order-reports/:id/note` | Thêm ghi chú |
| DELETE | `/order-reports/:id/admin` | Xóa report (admin) |

### GET `/order-reports?page=1&limit=10&search=&status=&sort=newest`
```json
{
  "status": "success",
  "data": {
    "reports": [
      {
        "_id": "...",
        "orderId": "...",
        "reporterId": "...",
        "title": "...",
        "description": "...",
        "images": [],
        "status": "PENDING",
        "adminNote": "",
        "assignedStaff": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

## FE Work Required (Admin)

### 3.1 Admin Service (bổ sung)
Thêm vào `orderReportService`:

```typescript
// Admin endpoints
getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; sort?: string }) =>
  axiosClient.get("/order-reports", { params }),

updateStatus: (id: string, status: string, adminNote?: string) =>
  axiosClient.patch(`/order-reports/${id}/status`, { status, adminNote }),

assignStaff: (id: string, assignedStaff: string) =>
  axiosClient.patch(`/order-reports/${id}/assign`, { assignedStaff }),

updateNote: (id: string, adminNote: string) =>
  axiosClient.patch(`/order-reports/${id}/note`, { adminNote }),

adminDelete: (id: string) =>
  axiosClient.delete(`/order-reports/${id}/admin`),
```

### 3.2 Admin Reports Page (đã có sẵn)
File: `FE/src/app/pages/admin/AdminReports.tsx` ✅ đã tạo

Các chức năng đã có:
- ✅ Danh sách tất cả reports (bảng desktop + card mobile)
- ✅ Search by ID or title (debounced)
- ✅ Filter by status (PENDING/DONE/CANCELLED)
- ✅ Pagination
- ✅ Detail modal (xem chi tiết)
- ✅ Cập nhật status (Mark Done / Cancel)
- ✅ Admin note editor
- ✅ Assign Staff modal (list staff users)
- ✅ Loading skeleton

Cần kiểm tra thêm:
- [ ] Gọi đúng API endpoint `/order-reports` thay vì `/reports`
- [ ] Permissions: OrderReport read/update/delete
- [ ] Responsive trên mobile

### 3.3 Admin Layout
Đã thêm "Order Reports" nav item trong `AdminLayout.tsx` ✅

Route: `/admin/reports` ✅

---

# 4. Order Report - Staff

## API Endpoints (Staff)

Staff cũng dùng chung API với Admin nhưng bị giới hạn bởi permission.

| Method | Endpoint | Mô tả |
|--------|----------|------|
| GET | `/order-reports` | DS reports (nếu có OrderReport read permission) |
| GET | `/order-reports/:id` | Chi tiết |
| PATCH | `/order-reports/:id/status` | Cập nhật status (nếu có OrderReport update permission) |
| PATCH | `/order-reports/:id/note` | Thêm ghi chú (nếu có permission) |

## FE Work Required (Staff)

### 4.1 Staff Reports Page
Tạo: `FE/src/app/pages/staff/StaffReports.tsx`

Tương tự Admin nhưng:
- Chỉ xem được reports được assigned cho mình (backend filter theo `assignedStaff`)
- Chỉ update status và ghi chú
- Không assign staff
- Không xóa

```tsx
// Gợi ý: Filter by assignedStaff = current user
const { data } = await axiosClient.get("/order-reports", {
  params: { assignedStaff: currentUserId, ... }
});
```

### 4.2 Staff Layout
Thêm nav item trong StaffLayout:
```tsx
{ path: "/staff/reports", label: "My Reports", icon: Flag }
```

Thêm route trong StaffPage:
```tsx
<Route path="reports" element={<StaffReports />} />
```

---

# Tổng kết Files cần tạo/sửa

## Files cần tạo mới
1. `FE/src/features/diy/services/diy.service.ts` - DIY API service
2. `FE/src/features/orderReport/types/orderReport.types.ts` - Types
3. `FE/src/features/orderReport/services/orderReport.service.ts` - API service
4. `FE/src/app/pages/MyReportsPage.tsx` - Customer reports page
5. `FE/src/app/pages/staff/StaffReports.tsx` - Staff reports page

## Files cần sửa
1. `FE/src/features/diy/store/diy.store.ts` - Thêm CRUD actions
2. `FE/src/features/diy/types/diy.types.ts` - Thêm types cho form
3. `FE/src/app/pages/DIYCreatePage.tsx` - Upload ảnh + FormData
4. `FE/src/app/pages/DIYDetailPage.tsx` - Edit/Delete buttons
5. `FE/src/app/pages/DIYFeedPage.tsx` - Show images
6. `FE/src/app/pages/admin/AdminPage.tsx` - Thêm route diy-posts
7. `FE/src/app/pages/admin/AdminReports.tsx` - Kiểm tra API endpoint
8. `FE/src/app/components/staff/StaffLayout.tsx` - Thêm nav item
9. `FE/src/app/pages/staff/StaffPage.tsx` - Thêm route reports
10. `FE/src/app/routes/AppRouter.tsx` - Thêm route My Reports cho customer

## Component Tree
```
AppRouter
├── /diy (Customer)
│   ├── DIYFeedPage (danh sách posts)
│   ├── DIYCreatePage (tạo post + upload ảnh)
│   └── DIYDetailPage (chi tiết + edit/delete)
│
├── /orders/reports (Customer)
│   └── MyReportsPage (danh sách reports)
│
├── /admin (Admin)
│   ├── /admin/reports (AdminReports) ← đã có
│   └── /admin/diy-posts (AdminDIYPosts)
│
└── /staff (Staff)
    └── /staff/reports (StaffReports)