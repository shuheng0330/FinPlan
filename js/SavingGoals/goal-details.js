 document.addEventListener('DOMContentLoaded', function() {
    // Set progress in the circular chart
    const progressCircle = document.getElementById('progressCircle');
    const progressPercentage = 52; // This would come from your data
    
    // Calculate the circumference of the circle
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    
    // Set the stroke-dasharray and stroke-dashoffset to create the progress effect
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference * (1 - progressPercentage / 100);
    
    // Toggle details view
    const toggleDetailsBtn = document.getElementById('toggleDetails');
    const goalDetailsSection = document.getElementById('goalDetailsSection');
    
    toggleDetailsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (goalDetailsSection.style.display === 'none') {
        goalDetailsSection.style.display = 'block';
        toggleDetailsBtn.textContent = 'View Less Details';
      } else {
        goalDetailsSection.style.display = 'none';
        toggleDetailsBtn.textContent = 'View More Details';
      }
    });
    
    // Initialize the transaction chart
    const ctx = document.getElementById('transactionChart').getContext('2d');

    // Create gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

    // Sample data for the chart
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Savings Progress',
        data: [300, 400, 500, 1000, 900, 1100, 1300],
        backgroundColor: gradient,
        borderWidth: 0,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7
      }]
    };

    const chart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return 'RM ' + context.raw;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return 'RM ' + value;
              }
            }
          }
        }
      }
    });
    
    // Time period toggle
    const timePeriodButtons = document.querySelectorAll('.time-period-toggle button');
    timePeriodButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        timePeriodButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get the selected period
        const period = this.getAttribute('data-period');
        
        // Update chart data based on the selected period
        // This is just a simulation - in a real app, you would fetch data for the selected period
        let newLabels, newData;
        switch(period) {
          case 'day':
            newLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            newData = [1250, 1260, 1270, 1280, 1290, 1295, 1300];
            break;
          case 'week':
            newLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            newData = [1200, 1240, 1270, 1300];
            break;
          case 'month':
            newLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
            newData = [300, 400, 500, 1000, 900, 1100, 1300];
            break;
          case 'year':
            newLabels = ['2023', '2024', '2025'];
            newData = [500, 1300, 2500];
            break;
        }
        
        // Update chart data
        chart.data.labels = newLabels;
        chart.data.datasets[0].data = newData;
        chart.update();
      });
    });
    
    // Add Transaction functionality
    const saveTransactionBtn = document.getElementById('saveTransactionBtn');
    saveTransactionBtn.addEventListener('click', function() {
      // Get form values
      const description = document.getElementById('transactionDescription').value;
      const amount = document.getElementById('transactionAmount').value;
      const type = document.getElementById('transactionType').value;
      const date = document.getElementById('transactionDate').value;
      
      // Format date for display
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create new transaction element
      const transactionItem = document.createElement('div');
      transactionItem.className = 'transaction-item';
      
      // Set transaction HTML
      transactionItem.innerHTML = `
        <div>
          <h6 class="mb-0">${description}</h6>
          <span class="transaction-date">${formattedDate}</span>
        </div>
        <span class="transaction-amount ${type === 'withdrawal' ? 'negative' : ''}">${type === 'withdrawal' ? '-' : '+'}RM ${parseFloat(amount).toFixed(2)}</span>
      `;
      
      // Add to the top of the transactions list
      const transactionsList = document.getElementById('transactions-list');
      transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
      modal.hide();
      
      // Reset form
      document.getElementById('addTransactionForm').reset();
      
      // Update progress (in a real app, this would be calculated based on all transactions)
      // This is just a simulation
      const newAmount = type === 'deposit' 
        ? 1300 + parseFloat(amount) 
        : 1300 - parseFloat(amount);
      
      const newPercentage = Math.min(Math.round((newAmount / 2500) * 100), 100);
      
      // Update circular progress
      progressCircle.style.strokeDashoffset = circumference * (1 - newPercentage / 100);
      
      // Update the displayed amounts
      document.querySelector('.progress-amount').textContent = `RM ${newAmount.toFixed(2)}`;
      document.querySelector('.info-row:nth-child(3) .info-value').textContent = `RM ${(2500 - newAmount).toFixed(2)}`;
      
      // Update chart data
      const lastDataPoint = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
      const newDataPoint = type === 'deposit' 
        ? lastDataPoint + parseFloat(amount) 
        : lastDataPoint - parseFloat(amount);
      
      chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] = newDataPoint;
      chart.update();
    });
    
    // Set today's date as default in the transaction form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
  });