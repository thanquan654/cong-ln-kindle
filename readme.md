# CongLN to Kindle

Dự án "CongLN to Kindle" là một ứng dụng web self-hosted được xây dựng để cào (scrape) dữ liệu light novel từ website [docln.sbs](https://docln.sbs) và định dạng lại nội dung cho trải nghiệm đọc tốt hơn trên các thiết bị e-ink như Amazon Kindle.

Ứng dụng giải quyết vấn đề giao diện phức tạp, quảng cáo và các yếu tố không cần thiết trên website gốc, mang lại một giao diện đọc sạch sẽ, tối giản và thân thiện với màn hình e-ink.

## Tính năng chính

-   **Thêm truyện mới**: Dễ dàng thêm một truyện mới vào danh sách bằng cách dán URL của truyện từ `docln.sbs`.
-   **Giao diện đọc tối giản**: Giao diện đọc được thiết kế với font chữ serif, loại bỏ các thành phần không cần thiết để tập trung vào nội dung.
-   **Tối ưu hóa hình ảnh**: Tự động proxy và tối ưu hóa hình ảnh (thay đổi kích thước, nén) để giảm thời gian tải và phù hợp với màn hình Kindle.
-   **Quản lý danh sách truyện**: Xem danh sách các truyện đã thêm, xóa truyện, cập nhật danh sách chương.
-   **Theo dõi tiến độ đọc**: Ứng dụng tự động lưu lại chương bạn đọc gần nhất để có thể tiếp tục dễ dàng.
-   **Yêu thích**: Đánh dấu các truyện yêu thích để ưu tiên hiển thị.
-   **Tự động cập nhật**: Sử dụng GitHub Actions để tự động cập nhật danh sách chương cho tất cả các truyện mỗi ngày.

## Công nghệ sử dụng

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB (với Mongoose)
-   **View Engine**: Express Handlebars
-   **Web Scraping**: Axios & Cheerio
-   **Image Processing**: Sharp
-   **Deployment**: Có thể deploy trên các nền tảng như Render, Heroku.

## Hướng dẫn cài đặt và sử dụng

### Yêu cầu

-   [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
-   [MongoDB](https://www.mongodb.com/) (bạn có thể dùng bản local hoặc một dịch vụ cloud như MongoDB Atlas)

### Các bước cài đặt

1.  **Clone repository về máy của bạn:**

    ```bash
    git clone https://github.com/thanquan654/cong-ln-kindle.git
    cd cong-ln-kindle
    ```

2.  **Cài đặt các dependencies:**

    ```bash
    npm install
    ```

3.  **Thiết lập biến môi trường:**
    Tạo một file tên là `.env` ở thư mục gốc của dự án và thêm vào các biến cần thiết. Bạn có thể tham khảo file `.env` hiện tại:

    ```env
    MONGO_URI=<CHUOI_KET_NOI_MONGODB_CUA_BAN>
    PORT=3000
    ```

    -   `MONGO_URI`: Chuỗi kết nối đến cơ sở dữ liệu MongoDB của bạn.
    -   `PORT`: Cổng mà ứng dụng sẽ chạy (mặc định là 3000).

4.  **Chạy ứng dụng:**
    Sử dụng script `dev` để khởi động server với chế độ theo dõi thay đổi file (sử dụng `--watch` của Node.js).

    ```bash
    npm run dev
    ```

5.  **Truy cập ứng dụng:**
    Mở trình duyệt và truy cập vào địa chỉ `http://localhost:3000`.

Bây giờ bạn đã có thể bắt đầu thêm truyện và tận hưởng trải nghiệm đọc trên thiết bị của mình.
