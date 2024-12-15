document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const homeTeamElement = document.getElementById('home-team');
  const awayTeamElement = document.getElementById('away-team');
  const scoreElement = document.getElementById('score');
  const homePredictionInput = document.getElementById('home-prediction');
  const awayPredictionInput = document.getElementById('away-prediction');
  const placeBetButton = document.getElementById('place-bet');
  const resultMessage = document.getElementById('result-message');
  const betStatusMessage = document.getElementById('bet-status-message');
  const matchTimeElement = document.getElementById('match-time');

  let isMatchEnded = false; // Trạng thái trận đấu đã kết thúc
  let isMatchStarted = false; // Trạng thái trận đấu đã diễn ra

  const homeTeamName = 'Manchester City FC'; // Tên đội nhà
  const awayTeamName = 'Manchester United FC'; // Tên đội khách

  // Hàm chuyển giờ UTC sang giờ Việt Nam
  function convertUTCToVietnamTime(utcDate) {
    const matchDate = new Date(utcDate); // Tạo Date từ UTC
    matchDate.setHours(matchDate.getHours()); // Cộng 7 tiếng
    return matchDate;
  }

  // Hàm cập nhật kết quả trận đấu
  async function updateMatchResult() {
    try {
      const response = await fetch(`/api/match-result/${homeTeamName}/${awayTeamName}`);
      const data = await response.json();

      if (!data || !data.utcDate || !data.homeTeam || !data.awayTeam) {
        resultMessage.textContent = 'Không tìm thấy thông tin trận đấu.';
        return;
      }

      // Hiển thị tên đội bóng
      homeTeamElement.textContent = data.homeTeam;
      awayTeamElement.textContent = data.awayTeam;

      // Chuyển đổi giờ UTC sang giờ Việt Nam
      const matchDateInVietnam = convertUTCToVietnamTime(data.utcDate);
      const currentDate = new Date();

      // Logic trạng thái trận đấu
      if (matchDateInVietnam > currentDate) {
        // Trận đấu chưa diễn ra
        scoreElement.textContent = 'Chưa có tỉ số';
        betStatusMessage.textContent = `Trận đấu sẽ diễn ra vào lúc ${matchDateInVietnam.toLocaleString('vi-VN')}`;
        matchTimeElement.textContent = `Giờ Việt Nam: ${matchDateInVietnam.toLocaleString('vi-VN')}`;
      } else if (data.score && data.score.homeTeam === null && data.score.awayTeam === null) {
        // Trận đấu đang diễn ra
        scoreElement.textContent = 'Đang chờ kết quả...';
        betStatusMessage.textContent = 'Trận đấu đang diễn ra...';
      } else if (data.score && data.score.homeTeam !== null && data.score.awayTeam !== null) {
        // Trận đấu đã kết thúc
        scoreElement.textContent = `${data.score.homeTeam} - ${data.score.awayTeam}`;
        betStatusMessage.textContent = 'Trận đấu đã kết thúc!';
      } else {
        resultMessage.textContent = 'Không xác định được trạng thái trận đấu.';
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ backend:', error);
      resultMessage.textContent = 'Lỗi khi tải kết quả trận đấu.';
    }
  }

  // Gọi hàm để tải thông tin trận đấu khi trang web load
  updateMatchResult();

  // Sử dụng Polling để cập nhật kết quả trận đấu mỗi 10 giây
  setInterval(updateMatchResult, 10000);  // Cập nhật mỗi 10 giây
});
