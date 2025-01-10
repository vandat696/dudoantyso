document.addEventListener('DOMContentLoaded', function () {
  const homeTeamElement = document.getElementById('home-team');
  const awayTeamElement = document.getElementById('away-team');
  const scoreElement = document.getElementById('score');
  const betStatusMessage = document.getElementById('bet-status-message');
  const matchTimeElement = document.getElementById('match-time');
  const resultMessage = document.getElementById('result-message');
  const pointsElement = document.getElementById('points');
  const betAmountInput = document.getElementById('bet-amount');
  const homePredictionInput = document.getElementById('home-prediction');
  const awayPredictionInput = document.getElementById('away-prediction');
  const placeBetButton = document.getElementById('place-bet');

  let homeTeamName = 'Borussia Dortmund'; 
  let awayTeamName = 'Bayer 04 Leverkusen';
  let matchStatus = 'TIMED'; 
  let points = 100000; 
  let userId = localStorage.getItem('userId');

  // Nếu không có userId trong localStorage, tạo một userId ngẫu nhiên
  if (!userId) {
    userId = 'user_' + Math.floor(Math.random() * 1000000);  // Tạo userId ngẫu nhiên
    localStorage.setItem('userId', userId);  // Lưu trữ userId vào localStorage
  }

  function convertUTCToVietnamTime(utcDate) {
    const matchDate = new Date(utcDate);
    matchDate.setHours(matchDate.getHours());  // UTC +7 cho giờ Việt Nam
    return matchDate;
  }

  async function updateMatchResult() {
    try {
      const response = await fetch(`/api/match-result/${homeTeamName}/${awayTeamName}`);
      const data = await response.json();

      if (!data || !data.homeTeam || !data.awayTeam) {
        resultMessage.textContent = 'Không tìm thấy thông tin trận đấu.';
        return;
      }

      homeTeamElement.textContent = data.homeTeam;
      awayTeamElement.textContent = data.awayTeam;

      if (data.score && data.score.fullTime.home !== undefined && data.score.fullTime.away !== undefined) {
        scoreElement.textContent = `${data.score.fullTime.home} - ${data.score.fullTime.away}`;
      } else {
        scoreElement.textContent = 'Chưa có tỉ số';
      }

      const matchDateInVietnam = convertUTCToVietnamTime(data.utcDate);
      matchTimeElement.textContent = `Giờ Việt Nam: ${matchDateInVietnam.toLocaleString('vi-VN')}`;

      matchStatus = data.status;

      if (matchStatus === 'IN_PLAY') {
        betStatusMessage.textContent = 'Trận đấu đang diễn ra, không thể đặt được nữa!';
        placeBetButton.disabled = true;
      } else if (matchStatus === 'TIMED') {
        betStatusMessage.textContent = 'Trận đấu chưa bắt đầu.';
        placeBetButton.disabled = false;
      } else if (matchStatus === 'FINISHED') {
        betStatusMessage.textContent = 'Trận đấu đã kết thúc.';
        placeBetButton.disabled = true;
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ backend:', error);
      resultMessage.textContent = 'Lỗi khi tải kết quả trận đấu.';
    }
  }

  async function loadPoints() {
    try {
      const response = await fetch(`/api/points/${userId}`);
      const data = await response.json();
      points = data.points;
      pointsElement.textContent = points;
    } catch (error) {
      console.error('Lỗi khi lấy điểm người dùng:', error);
      pointsElement.textContent = 'Lỗi khi lấy điểm.';
    }
  }

  async function placeBet() {
    const betAmount = parseInt(betAmountInput.value);
    const homePrediction = parseInt(homePredictionInput.value);
    const awayPrediction = parseInt(awayPredictionInput.value);
  
    if (betAmount == null || homePrediction == null || awayPrediction == null || homePrediction === "" || awayPrediction === "") {
      resultMessage.textContent = 'Vui lòng nhập đúng thông tin.';
      return;
    }
  
    try {
      const response = await fetch('/api/place-bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,  // Gửi userId vào body
          betAmount,
          homePrediction,
          awayPrediction,
          matchStatus,
          score,
        }),
      });
      const data = await response.json();
      points = data.remainingPoints;
      pointsElement.textContent = points;
  
      resultMessage.textContent = data.message;
    } catch (error) {
      console.error('Lỗi khi đặt:', error);
      resultMessage.textContent = 'Lỗi khi đặt.';
    }
  }
  

  placeBetButton.addEventListener('click', placeBet);

  // Cập nhật điểm người dùng khi load trang
  loadPoints();

  // Cập nhật thông tin trận đấu
  updateMatchResult();
});