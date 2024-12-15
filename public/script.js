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
  const balanceElement = document.getElementById('balance');
  const betAmountInput = document.getElementById('bet-amount');

  let balance = 100000;  // Số tiền ban đầu
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

        // Cập nhật số tiền dựa trên kết quả cược
        const homePrediction = parseInt(homePredictionInput.value, 10);
        const awayPrediction = parseInt(awayPredictionInput.value, 10);
        const betAmount = parseInt(betAmountInput.value, 10);

        if (isNaN(homePrediction) || isNaN(awayPrediction) || isNaN(betAmount)) {
          resultMessage.textContent = 'Vui lòng nhập đầy đủ thông tin cược.';
          return;
        }

        if (betAmount > balance) {
          resultMessage.textContent = 'Số tiền cược vượt quá số dư của bạn!';
          return;
        }

        // Tính toán kết quả cược
        if (homePrediction === data.score.homeTeam && awayPrediction === data.score.awayTeam) {
          balance += betAmount * 2;  // Nếu đúng, người chơi thắng gấp đôi số tiền cược
          resultMessage.textContent = `Chúc mừng! Bạn đã dự đoán đúng. Bạn đã thắng ${betAmount * 2} đồng.`;
        } else {
          balance -= betAmount;  // Nếu sai, người chơi mất số tiền cược
          resultMessage.textContent = `Rất tiếc, bạn đã dự đoán sai. Bạn đã mất ${betAmount} đồng.`;
        }

        updateBalance();  // Cập nhật số tiền
      } else {
        resultMessage.textContent = 'Không xác định được trạng thái trận đấu.';
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ backend:', error);
      resultMessage.textContent = 'Lỗi khi tải kết quả trận đấu.';
    }
  }

  // Cập nhật số tiền
  function updateBalance() {
    balanceElement.textContent = `Số tiền hiện tại: ${balance.toLocaleString()} đồng`;
  }

  // Gọi hàm để tải thông tin trận đấu khi trang web load
  updateMatchResult();

  // Sử dụng Polling để cập nhật kết quả trận đấu mỗi 10 giây
  setInterval(updateMatchResult, 10000);  // Cập nhật mỗi 10 giây

  // Sự kiện khi người chơi đặt cược
  placeBetButton.addEventListener('click', function () {
    const homePrediction = parseInt(homePredictionInput.value, 10);
    const awayPrediction = parseInt(awayPredictionInput.value, 10);
    const betAmount = parseInt(betAmountInput.value, 10);

    if (isNaN(homePrediction) || isNaN(awayPrediction) || isNaN(betAmount)) {
      resultMessage.textContent = 'Vui lòng nhập đầy đủ thông tin cược.';
      return;
    }

    if (betAmount > balance) {
      resultMessage.textContent = 'Số tiền cược vượt quá số dư của bạn!';
      return;
    }

    balance -= betAmount; // Trừ số tiền cược
    updateBalance(); // Cập nhật số tiền

    resultMessage.textContent = 'Đang chờ kết quả trận đấu...';
  });
});
