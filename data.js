const appsData = [
  {
    "ten_phan_mem": "Google Earth",
    "hinh_anh": "./picture/googleearth.png",
    "thiet_bi": "Máy tính, điện thoại, máy chiếu",
    "cach_dung": "Xem bản đồ 3D, zoom địa hình",
    "dung_de": "Học vị trí địa lý, khí hậu",
    "dac_diem": "Bản đồ toàn cầu 3D",
    "uu_diem": "Trực quan, dễ dùng",
    "nhuoc_diem": "Cần internet mạnh",
    "link": "https://earth.google.com"
  },
  {
    "ten_phan_mem": "ArcGIS",
    "hinh_anh": "./picture/arcgis.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Phân tích dữ liệu bản đồ",
    "dung_de": "Học chuyên sâu địa lý",
    "dac_diem": "Hệ thống GIS chuyên nghiệp",
    "uu_diem": "Chính xác, mạnh",
    "nhuoc_diem": "Khó dùng cho người mới",
    "link": "https://www.arcgis.com"
  },
  {
    "ten_phan_mem": "BioDigital Human",
    "hinh_anh": "./picture/biodigitalhuman.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Xem cơ thể người 3D",
    "dung_de": "Học giải phẫu",
    "dac_diem": "Mô hình 3D chi tiết",
    "uu_diem": "Rất trực quan",
    "nhuoc_diem": "Cần mạng",
    "link": "https://www.biodigital.com"
  },
  {
    "ten_phan_mem": "PhET Interactive Simulations",
    "hinh_anh": "./picture/phetinteractivesim.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Làm thí nghiệm ảo",
    "dung_de": "Hiểu cơ chế sinh học",
    "dac_diem": "Mô phỏng khoa học",
    "uu_diem": "Miễn phí",
    "nhuoc_diem": "Giao diện tiếng Anh",
    "link": "https://phet.colorado.edu"
  },
  {
    "ten_phan_mem": "Kahoot!",
    "hinh_anh": "./picture/kahoot.png",
    "thiet_bi": "Điện thoại",
    "cach_dung": "Làm quiz",
    "dung_de": "Học qua trò chơi",
    "dac_diem": "Học dạng game",
    "uu_diem": "Vui, dễ nhớ",
    "nhuoc_diem": "Cần internet",
    "link": "https://kahoot.com"
  },
  {
    "ten_phan_mem": "Quizizz",
    "hinh_anh": "./picture/quizizz.png",
    "thiet_bi": "Máy tính/điện thoại",
    "cach_dung": "Làm bài trắc nghiệm",
    "dung_de": "Ôn tập",
    "dac_diem": "Thi online",
    "uu_diem": "Dễ dùng",
    "nhuoc_diem": "Phụ thuộc mạng",
    "link": "https://quizizz.com"
  },
  {
    "ten_phan_mem": "Meta Quest 2",
    "hinh_anh": "./picture/metaquest.png",
    "thiet_bi": "Kính VR",
    "cach_dung": "Mô phỏng huấn luyện",
    "dung_de": "Trải nghiệm thực tế",
    "dac_diem": "Thực tế ảo",
    "uu_diem": "Sinh động",
    "nhuoc_diem": "Giá cao",
    "link": "https://www.meta.com/quest"
  },
  {
    "ten_phan_mem": "Duolingo",
    "hinh_anh": "./picture/duolingo.png",
    "thiet_bi": "Điện thoại",
    "cach_dung": "Học từ vựng",
    "dung_de": "Tự học",
    "dac_diem": "Học như game",
    "uu_diem": "Miễn phí",
    "nhuoc_diem": "Nội dung cơ bản",
    "link": "https://www.duolingo.com"
  },
  {
    "ten_phan_mem": "ELSA Speak",
    "hinh_anh": "./picture/elsaspeak.png",
    "thiet_bi": "Điện thoại + tai nghe",
    "cach_dung": "Luyện phát âm",
    "dung_de": "Nói chuẩn",
    "dac_diem": "AI chấm phát âm",
    "uu_diem": "Chính xác",
    "nhuoc_diem": "Có phí",
    "link": "https://elsaspeak.com"
  },
  {
    "ten_phan_mem": "Scratch",
    "hinh_anh": "./picture/scratch.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Kéo thả lập trình",
    "dung_de": "Học code",
    "dac_diem": "Lập trình trực quan",
    "uu_diem": "Dễ học",
    "nhuoc_diem": "Không nâng cao",
    "link": "https://scratch.mit.edu"
  },
  {
    "ten_phan_mem": "Visual Studio Code",
    "hinh_anh": "./picture/visualstudiocode.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Viết code (Python, C++, HTML…)",
    "dung_de": "Học lập trình nâng cao",
    "dac_diem": "Trình soạn thảo code chuyên nghiệp",
    "uu_diem": "Nhẹ, miễn phí, Hỗ trợ nhiều ngôn ngữ",
    "nhuoc_diem": "Khó với người mới",
    "link": "https://code.visualstudio.com"
  },
  {
    "ten_phan_mem": "Google Classroom",
    "hinh_anh": "./picture/googleclassroom.png",
    "thiet_bi": "Điện thoại, máy tính",
    "cach_dung": "Nộp bài, nhận bài, học online",
    "dung_de": "Quản lý lớp học",
    "dac_diem": "Lớp học trực tuyến",
    "uu_diem": "Dễ sử dụng, Miễn phí",
    "nhuoc_diem": "Phụ thuộc internet",
    "link": "https://classroom.google.com"
  },
  {
    "ten_phan_mem": "ViettelStudy",
    "hinh_anh": "./picture/Viettelstudy.png",
    "thiet_bi": "Điện thoại, máy tính",
    "cach_dung": "Học bài giảng online",
    "dung_de": "Học lại kiến thức, Ôn thi",
    "dac_diem": "Nền tảng học trực tuyến",
    "uu_diem": "Có lộ trình",
    "nhuoc_diem": "Một số nội dung mất phí",
    "link": "https://viettelstudy.vn"
  },
  {
    "ten_phan_mem": "MindMeister",
    "hinh_anh": "./picture/mindmeister.png",
    "thiet_bi": "Máy tính, điện thoại",
    "cach_dung": "Tạo sơ đồ tư duy phân tích tác phẩm",
    "dung_de": "Hệ thống ý khi làm văn, Ghi nhớ nội dung",
    "dac_diem": "Vẽ mindmap online",
    "uu_diem": "Dễ nhìn, dễ nhớ, Học nhanh hơn",
    "nhuoc_diem": "Bản miễn phí hạn chế",
    "link": "https://www.mindmeister.com"
  },
  {
    "ten_phan_mem": "Crocodile chemistry 1.5",
    "hinh_anh": "./picture/crocodilechemistry.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Mô phỏng các phương trình hóa học, ghi nhớ nội dung, đưa ra gợi ý và cảnh báo",
    "dung_de": "Tạo các phản ứng hóa học, hỗ trợ học tập",
    "dac_diem": "Tạo phòng hóa học ảo",
    "uu_diem": "Giao diện đơn giản trực quan, thiết kế kéo thả, thư viện đối tượng đa dạng, dụng cụ linh hoạt, tương tác và kiểm soát cao (có dừng và tua nhanh)",
    "nhuoc_diem": "Đồ họa cũ, giới hạn số lượng phản ứng",
    "link": "https://youtu.be/EF_OBNxvU0I?si=krDkrwMfQb2fKeh4"
  },
  {
    "ten_phan_mem": "Chem collective",
    "hinh_anh": "./picture/chemcollective.png",
    "thiet_bi": "Máy tính, điện thoại",
    "cach_dung": "Mô phỏng các phương trình hóa học, quản lý nội dung, tạo không gian riêng cho bài học",
    "dung_de": "Tạo các phương trình hóa học phức tạp, hỗ trợ sinh viên - giáo viên - học sinh",
    "dac_diem": "Mô phỏng thí nghiệm",
    "uu_diem": "Độ chính xác cao, cập nhật trên mọi trình duyệt web",
    "nhuoc_diem": "Độ phức tạp cao, ngôn ngữ chủ yếu là tiếng Anh",
    "link": "https://download.com.vn/download/chemlab-2-5-22726"
  },
  {
    "ten_phan_mem": "Crocodile Physis",
    "hinh_anh": "./picture/crocodilepysis.png",
    "thiet_bi": "Máy tính",
    "cach_dung": "Tùy chỉnh thông số vật lý trong việc mô phỏng thí nghiệm.",
    "dung_de": "quan sát kết quả qua các thiết bị đo hoặc đồ thị.",
    "dac_diem": "Mô phỏng thí nghiệm",
    "uu_diem": "Giao diện trực quan, an toàn và tiết kiệm",
    "nhuoc_diem": "Đồ họa cũ, độ chính xác còn hạn chế",
    "link": "https://www.mediafire.com/file/m0ko330lmjs2bkr/Crocodile_Physics_v6.05_%2528full%2529.rar/file"
  }
];

const subjectsData = {
  "Toán học": ["Quizizz", "Kahoot!"],
  "Vật lí": ["PhET Interactive Simulations", "Crocodile Physis", "Quizizz", "Kahoot!", "Google Classroom"],
  "Hóa học": ["Crocodile chemistry 1.5", "Chem collective", "PhET Interactive Simulations", "Quizizz", "Kahoot!", "Google Classroom"],
  "Sinh học": ["BioDigital Human", "PhET Interactive Simulations", "Quizizz", "Kahoot!", "Google Classroom"],
  "Ngữ văn": ["MindMeister", "Google Classroom", "Quizizz", "Kahoot!"],
  "Lịch sử": ["Kahoot!", "Quizizz", "ViettelStudy", "Google Classroom"],
  "Địa lí": ["Google Earth", "ArcGIS", "Quizizz", "Kahoot!", "Google Classroom"],
  "Ngoại ngữ (Tiếng Anh)": ["Duolingo", "ELSA Speak", "Kahoot!", "Quizizz", "Google Classroom"],
  "Giáo dục Quốc phòng và An ninh": ["Meta Quest 2", "Quizizz", "Kahoot!", "Google Classroom"],
  "Công nghệ": ["Quizizz", "Kahoot!"],
  "Tin học": ["Scratch", "Visual Studio Code", "Google Classroom", "Quizizz", "Kahoot!"]
};

function loadNavbar() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if(dropdownMenu) {
        dropdownMenu.innerHTML = ''; // Xóa menu cũ
        for (const subject in subjectsData) {
            dropdownMenu.innerHTML += `<a class="text-black dropdown-item display-4" href="page2.html?subject=${encodeURIComponent(subject)}">${subject}</a>`;
        }
    }
}