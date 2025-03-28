const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser'); // Import cookie-parser
const app = express();
const port = 3000;

// Sử dụng cookie-parser middleware để đọc cookie
app.use(cookieParser());

// API Key từ Football-Data.org
const apiKey = 'b548fc14d7b84e578424fb428b59ef10';

// Middleware để phục vụ file tĩnh
app.use(express.static('public'));
app.use(express.json());  // Để parse JSON body

// Khởi tạo số điểm người dùng (100,000 điểm) - có thể thay đổi tùy vào deviceId
let points = 100000;

// API lấy kết quả trận đấu dựa trên tên đội bóng
app.get('/api/match-result/:homeTeam/:awayTeam', async (req, res) => {
  const { homeTeam, awayTeam } = req.params;
  const deviceId = req.cookies.deviceId;  // Lấy deviceId từ cookie

  if (!deviceId) {
    return res.status(400).json({ message: 'Không tìm thấy deviceId trong cookie.' });
  }

  try {
    // Gọi Football-Data API để lấy thông tin trận đấu
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': apiKey },
    });

    const matches = response.data.matches;

    if (!matches || matches.length === 0) {
      return res.status(404).json({ message: 'Không có trận đấu nào trong danh sách.' });
    }

    // Tìm trận đấu khớp với tên đội
    const match = matches.find((m) =>
      (m.homeTeam.name.toLowerCase() === homeTeam.toLowerCase() &&
        m.awayTeam.name.toLowerCase() === awayTeam.toLowerCase()) ||
      (m.homeTeam.name.toLowerCase() === awayTeam.toLowerCase() &&
        m.awayTeam.name.toLowerCase() === homeTeam.toLowerCase())
    );

    if (match) {
      res.json({
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        utcDate: match.utcDate,
        score: match.score,
        status: match.status,
        deviceId,  // Gửi lại deviceId để xác nhận
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy trận đấu giữa hai đội.' });
    }

  } catch (error) {
    console.error('Lỗi khi gọi API Football-Data:', error.message);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin trận đấu.' });
  }
});

// API để đặt cược
app.post('/api/place-bet', (req, res) => {
  const { betAmount, homePrediction, awayPrediction, matchStatus } = req.body;
  const deviceId = req.cookies.deviceId;  // Lấy deviceId từ cookie

  if (!deviceId) {
    return res.status(400).json({ message: 'Không tìm thấy deviceId trong cookie.' });
  }

  // Kiểm tra xem người dùng có đủ điểm để đặt cược không
  if (betAmount > points) {
    return res.status(400).json({ message: 'Số điểm không đủ để đặt!' });
  }

  // Kiểm tra trạng thái trận đấu để quyết định có được phép đặt cược hay không
  if (matchStatus === 'IN_PLAY') {
    return res.status(400).json({ message: 'Không thể chơi khi trận đấu đang diễn ra!' });
  }

  // Giảm số điểm của người dùng theo số tiền cược
  points -= betAmount;

  res.json({
    message: 'Đặt cược thành công!',
    remainingPoints: points,
    deviceId,  // Gửi lại deviceId để xác nhận
  });
});

// API để lấy số điểm còn lại của người dùng
app.get('/api/points', (req, res) => {
  const deviceId = req.cookies.deviceId;  // Lấy deviceId từ cookie

  if (!deviceId) {
    return res.status(400).json({ message: 'Không tìm thấy deviceId trong cookie.' });
  }

  res.json({ points, deviceId });
});

// Lắng nghe server
app.listen(port, () => {
  console.log(`Server chạy tại: http://localhost:${port}`);
});
