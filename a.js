async function updateMatchResult() {
  try {
      const deviceId = getCookie('deviceId'); // Lấy deviceId từ cookie
      if (!deviceId) {
          resultMessage.textContent = 'Không tìm thấy deviceId trong cookie.';
          return;
      }

      const response = await fetch(`/api/match-result/${homeTeamName}/${awayTeamName}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'deviceId': deviceId, // Gửi deviceId trong header
          }
      });
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
          betStatusMessage.textContent = 'Trận đấu đang diễn ra, không thể đặt cược nữa!';
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
