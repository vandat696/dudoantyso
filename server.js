const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// API Key từ Football-Data.org
const apiKey = 'b548fc14d7b84e578424fb428b59ef10'; // Thay bằng API Key hợp lệ

// Middleware để phục vụ file tĩnh
app.use(express.static('public'));

// API lấy kết quả trận đấu dựa trên tên đội bóng
app.get('/api/match-result/:homeTeam/:awayTeam', async (req, res) => {
  const { homeTeam, awayTeam } = req.params;

  try {
    // Gọi Football-Data API
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': apiKey },
    });

    const matches = response.data.matches;

    // Kiểm tra xem danh sách trận đấu có tồn tại
    if (!matches || matches.length === 0) {
      res.status(404).json({ message: 'Không có trận đấu nào trong danh sách.' });
      return;
    }

    // Tìm trận đấu khớp tên đội bóng
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
        score: match.score.fullTime,
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy trận đấu giữa hai đội.' });
    }
  } catch (error) {
    console.error('Lỗi khi gọi API Football-Data:', error.message);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin trận đấu.' });
  }
});

// Lắng nghe server
app.listen(port, () => {
  console.log(`Server chạy tại: http://localhost:${port}`);
});
