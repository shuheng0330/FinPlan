const ctx = document.getElementById('ReturnChart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['McDonald', 'Apple', 'Amazon','Google'],
      datasets: [{
        label: 'Return(%)', // Changed label to 'Risk(%)'
        
        data: [4, 7.5, 14.3, 3.8],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });