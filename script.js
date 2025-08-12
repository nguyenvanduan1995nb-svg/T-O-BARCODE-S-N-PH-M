document.addEventListener('DOMContentLoaded', function () {
    const barcodeInput = document.getElementById('barcode-input');
    const nameInput = document.getElementById('name-input');
    const priceInput = document.getElementById('price-input');
    const generateBtn = document.getElementById('generate-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const fileInput = document.getElementById('file-input');
    const resultContainer = document.getElementById('result-container');
    const stopScanBtn = document.getElementById('stop-scan-btn');
    const qrReaderDiv = document.getElementById('qr-reader');

    let html5QrCode;

    // --- Chức năng quét Barcode bằng Camera ---
    function onScanSuccess(decodedText, decodedResult) {
        // Điền barcode quét được vào ô input
        console.log(`Scan result: ${decodedText}`, decodedResult);
        barcodeInput.value = decodedText;
        // Tự động dừng quét sau khi thành công
        stopScanning();
    }

    function onScanError(errorMessage) {
        // Bỏ qua lỗi không tìm thấy QR code
    }

    function startScanning() {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }
        
        qrReaderDiv.style.display = 'block';
        stopScanBtn.style.display = 'inline-block';

        // Sử dụng camera sau của điện thoại
        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 150 } // Kích thước khung quét
            },
            onScanSuccess,
            onScanError
        ).catch(err => {
            console.error("Không thể khởi động camera.", err);
            alert("Không thể khởi động camera. Vui lòng cấp quyền truy cập.");
        });
    }

    function stopScanning() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log("Dừng quét.");
                qrReaderDiv.style.display = 'none';
                stopScanBtn.style.display = 'none';
            }).catch(err => {
                console.error("Lỗi khi dừng quét.", err);
            });
        }
    }

    // Khởi động quét khi người dùng nhấn vào ô input
    barcodeInput.addEventListener('focus', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);


    // --- Chức năng tạo Barcode ---
    function createBarcode(code, name, price) {
        if (!code) {
            alert('Vui lòng nhập mã vạch!');
            return;
        }

        const barcodeId = `barcode-${Date.now()}`;
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('barcode-item');

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = barcodeId;
        
        itemDiv.appendChild(svg);
        if (name) {
            const nameP = document.createElement('p');
            nameP.textContent = name;
            itemDiv.appendChild(nameP);
        }
        if (price) {
            const priceP = document.createElement('p');
            priceP.textContent = `Giá: ${price}`;
            itemDiv.appendChild(priceP);
        }

        resultContainer.appendChild(itemDiv);

        // Tạo barcode bằng JsBarcode
        try {
            JsBarcode(`#${barcodeId}`, code, {
                format: "CODE128", // Loại barcode phổ biến
                lineColor: "#000",
                width: 2,
                height: 60,
                displayValue: true // Hiển thị giá trị mã vạch bên dưới
            });
        } catch (e) {
            alert('Mã vạch không hợp lệ. Vui lòng kiểm tra lại!');
            itemDiv.remove();
        }
    }

    generateBtn.addEventListener('click', () => {
        createBarcode(barcodeInput.value, nameInput.value, priceInput.value);
        // Xóa trống các ô input sau khi tạo
        barcodeInput.value = '';
        nameInput.value = '';
        priceInput.value = '';
    });


    // --- Chức năng xuất PDF ---
    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const barcodes = resultContainer.querySelectorAll('.barcode-item');

        if (barcodes.length === 0) {
            alert('Chưa có mã vạch nào để xuất!');
            return;
        }

        let y = 15; // Vị trí bắt đầu trên trang PDF
        barcodes.forEach((item, index) => {
            const svgElement = item.querySelector('svg');
            const name = item.querySelector('p:nth-of-type(1)')?.textContent || '';
            const price = item.querySelector('p:nth-of-type(2)')?.textContent || '';

            // Chuyển SVG thành ảnh Data URL
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            const imgData = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));

            doc.addImage(imgData, 'SVG', 15, y, 80, 30); // Thêm ảnh barcode
            doc.text(`${name}\n${price}`, 100, y + 15); // Thêm tên và giá
            
            y += 40; // Tăng vị trí cho barcode tiếp theo
            if (y > 250) { // Nếu hết trang, tạo trang mới
                doc.addPage();
                y = 15;
            }
        });
        
        doc.save('danh-sach-barcode.pdf');
    });

    // --- Chức năng nhập từ tệp CSV ---
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            
            rows.forEach(row => {
                const columns = row.split(','); // Giả định CSV phân tách bằng dấu phẩy
                const code = columns[0]?.trim();
                const name = columns[1]?.trim();
                const price = columns[2]?.trim();
                if (code) {
                    createBarcode(code, name, price);
                }
            });
        };
        reader.readAsText(file);
    });

});
