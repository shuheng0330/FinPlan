// riskchart.js
const ctx = document
  .getElementById('RiskChart')
  .getContext('2d');

new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ['McDonald', 'Apple', 'Amazon', 'Google'],
    datasets: [
      {
        label: 'Risk (%)',
        data: [18, 29, 18, 15],
        fill: true,
        borderWidth: 1,
      },
      {
        label: 'Return (%)',
        data: [27, 42, 35, 32],
        fill: true,
        borderWidth: 1,
      },
      {
        label:'Volatility (Scale 0-100))',
        data: [35, 62, 15, 16],
        fill: true,
        borderWidth: 1,
      }
    ]
  },
  options: {
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: 100,
        ticks: {
          stepSize: 25
        }
      }
    },
    elements: {
      line: {
        tension: 0.3  // smooth the lines
      }
    }
  }
});
