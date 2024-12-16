// backend/server.js
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// API Key từ Football-Data.org
const apiKey = 'b548fc14d7b84e578424fb428b59ef10';

// Middleware để phục vụ file tĩnh
app.use(express.static('public'));
app.use(express.json());  // Để parse JSON body

// Lưu trữ điểm người dùng tạm thời (sử dụng session)
const session = {}; // Giả sử sử dụng một object để lưu trữ tạm thời điểm của người dùng

// API lấy kết quả trận đấu dựa trên tên đội bóng
app.get('/api/match-result/:homeTeam/:awayTeam', async (req, res) => {
  const { homeTeam, awayTeam } = req.params;

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
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy trận đấu giữa hai đội.' });
    }

  } catch (error) {
    console.error('Lỗi khi gọi API Football-Data:', error.message);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin trận đấu.' });
  }
});

// API để lấy số điểm còn lại của người dùng
app.get('/api/points/:userId', (req, res) => {
  const { userId } = req.params;

  // Nếu người dùng chưa tồn tại, tạo người dùng mới
  if (!session[userId]) {
    session[userId] = { points: 100000 };  // Gán điểm mặc định cho người dùng mới
  }

  res.json({ points: session[userId].points });
});

// API để đặt cược
app.post('/api/place-bet', (req, res) => {
  const { userId, betAmount, homePrediction, awayPrediction, matchStatus, score } = req.body;

  // Kiểm tra nếu người dùng chưa tồn tại, tạo người dùng mới
  if (!session[userId]) {
    session[userId] = { points: 100000 };  // Gán điểm mặc định cho người dùng mới
  }

  let points = session[userId].points;

  // Kiểm tra xem người dùng có đủ điểm để đặt cược không
  if (betAmount > points) {
    return res.status(400).json({ message: 'Số điểm không đủ để đặt!' });
  }

  // Kiểm tra trạng thái trận đấu để quyết định có được phép đặt cược hay không
  if (matchStatus === 'IN_PLAY') {
    return res.status(400).json({ message: 'Không thể đặt khi trận đấu đang diễn ra!' });
  } else if (matchStatus === 'FINISHED') {
    return res.status(400).json({ message: 'Không thể đặt khi trận đấu đã kết thúc!' });
  }

  // Nếu trận đấu chưa diễn ra, cho phép người dùng đặt cược
  // Giảm số điểm của người dùng theo số tiền cược
  session[userId].points -= betAmount;

  // Cập nhật dữ liệu cược vào session
  session[userId].bet = {
    betAmount,
    homePrediction,
    awayPrediction,
    matchStatus,
  };

  res.json({
    message: 'Dự đoán thành công! Chờ kết quả trận đấu.',
    remainingPoints: session[userId].points,
  });
});

app.post('/api/update-match-result', (req, res) => {
  const { userId, score, homeTeam, awayTeam } = req.body;

  // Kiểm tra xem người dùng có đặt cược không
  if (!session[userId] || !session[userId].bet) {
    return res.status(400).json({ message: 'Người dùng chưa đặt hoặc không tồn tại!' });
  }

  const bet = session[userId].bet;
  const { betAmount, homePrediction, awayPrediction } = bet;

  // Kiểm tra nếu có tỉ số trận đấu và trạng thái là đã kết thúc
  if (!score || !score.fullTime.home || !score.fullTime.away) {
    return res.status(400).json({ message: 'Tỉ số không hợp lệ hoặc trận đấu chưa kết thúc!' });
  }

  const homeScore = score.fullTime.home;
  const awayScore = score.fullTime.away;

  let pointsWon = 0;

  // Tính điểm nếu dự đoán chính xác
  if (homePrediction === homeScore && awayPrediction === awayScore) {
    pointsWon = betAmount * 2; // Đúng hoàn toàn
  }
  // Tính điểm nếu dự đoán gần đúng (sai lệch không quá 1 bàn thắng)
  else if (Math.abs(homePrediction - homeScore) <= 1 && Math.abs(awayPrediction - awayScore) <= 1) {
    pointsWon = betAmount; // Dự đoán gần đúng
  }

  // Cập nhật điểm sau khi trận đấu kết thúc
  session[userId].points += pointsWon;

  res.json({
    message: `Trận đấu đã kết thúc! Bạn nhận được ${pointsWon} điểm.`,
    remainingPoints: session[userId].points,
  });
});


// Lắng nghe server
app.listen(port, () => {
  console.log(`Server chạy tại: http://localhost:${port}`);
});
