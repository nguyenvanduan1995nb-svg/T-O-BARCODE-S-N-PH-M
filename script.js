document.addEventListener('DOMContentLoaded', function () {
    // Lấy các phần tử
    const barcodeInput = document.getElementById('barcode-input');
    const nameInput = document.getElementById('name-input');
    const priceInput = document.getElementById('price-input');
    const generateBtn = document.getElementById('generate-btn');
    const scanBtn = document.getElementById('scan-btn'); // Nút quét mới
    const stopScanBtn = document.getElementById('stop-scan-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const fileInput = document.getElementById('file-input');
    const resultContainer = document.getElementById('result-container');
    const scannerContainer = document.getElementById('scanner-container');

    let html5QrCode;

    // --- YÊU CẦU 1: CHỨC NĂNG QUÉT KHI NHẤN NÚT ---
    function onScanSuccess(decodedText, decodedResult) {
        barcodeInput.value = decodedText; // Điền kết quả vào ô input
        stopScanning(); // Tự động dừng quét
    }

    function onScanError(errorMessage) { /* Bỏ qua lỗi */ }

    function startScanning() {
        scannerContainer.style.display = 'block'; // Hiện giao diện quét
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 150 } },
            onScanSuccess,
            onScanError
        ).catch(err => {
            alert("Không thể khởi động camera. Vui lòng cấp quyền truy cập và thử lại.");
        });
    }

    function stopScanning() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                scannerContainer.style.display = 'none'; // Ẩn giao diện quét
            }).catch(err => console.error("Lỗi khi dừng quét.", err));
        }
    }
    
    scanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);


    // --- CHỨC NĂNG TẠO BARCODE ---
    function createBarcode(code, name, price) {
        if (!code) {
            alert('Vui lòng nhập mã vạch!');
            return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('barcode-item');

        // --- YÊU CẦU 3: THAY ĐỔI THỨ TỰ VÀ STYLE ---
        if (name) {
            const nameP = document.createElement('p');
            nameP.className = 'product-name'; // Thêm class để style
            nameP.textContent = name;
            itemDiv.appendChild(nameP);
        }
        if (price) {
            const priceP = document.createElement('p');
            priceP.className = 'product-price'; // Thêm class để style
            priceP.textContent = `Giá: ${price}`;
            itemDiv.appendChild(priceP);
        }
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const barcodeId = `barcode-${Date.now()}`;
        svg.id = barcodeId;
        itemDiv.appendChild(svg); // Barcode được thêm vào cuối cùng

        resultContainer.appendChild(itemDiv);

        try {
            JsBarcode(`#${barcodeId}`, code, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 60,
                displayValue: true
            });
        } catch (e) {
            alert('Mã vạch không hợp lệ. Vui lòng kiểm tra lại!');
            itemDiv.remove();
        }
    }

    generateBtn.addEventListener('click', () => {
        createBarcode(barcodeInput.value, nameInput.value, priceInput.value);
        barcodeInput.value = '';
        nameInput.value = '';
        priceInput.value = '';
    });


    // --- YÊU CẦU 2: SỬA LỖI XUẤT PDF (Cách làm ổn định nhất) ---
    exportPdfBtn.addEventListener('click', async () => {
        const barcodes = resultContainer.querySelectorAll('.barcode-item');
        if (barcodes.length === 0) {
            alert('Chưa có mã vạch nào để xuất!');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let y = margin;

        for (let i = 0; i < barcodes.length; i++) {
            const item = barcodes[i];
            const canvas = await html2canvas(item, { scale: 3 }); // Tăng scale để ảnh nét hơn
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 80;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (y + imgHeight + margin > pageHeight) {
                doc.addPage();
                y = margin;
            }

            doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        }
        
        doc.save('danh-sach-barcode.pdf');
    });


    // --- CHỨC NĂNG NHẬP TỪ TỆP CSV ---
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const rows = text.split('\n').filter(row => row.trim() !== '');
            rows.forEach(row => {
                const columns = row.split(',');
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
