
  document.addEventListener('DOMContentLoaded', function() {
    // Goal selection
    const goalCards = document.querySelectorAll('.goal-card');
    goalCards.forEach(card => {
      card.addEventListener('click', function() {
        // Remove selected class from all cards
        goalCards.forEach(c => c.classList.remove('selected'));
        
        // Add selected class to clicked card
        this.classList.add('selected');
      });
    });

     const iconOptions = document.querySelectorAll(".icon-option");
      iconOptions.forEach(option => {
        option.addEventListener("click", () => {
          // Remove .selected from all
          iconOptions.forEach(o => o.classList.remove("selected"));
          // Add .selected to clicked one
          option.classList.add("selected");
        });
      });
    
    // Goal pagination
    const goalPages = document.querySelectorAll('.goal-page');
    const prevGoalsBtn = document.getElementById('prevGoalsBtn');
    const nextGoalsBtn = document.getElementById('nextGoalsBtn');
    let currentPage = 1;
    const totalPages = goalPages.length;

    // Function to update page visibility
    function updateGoalPages() {
      // Hide all pages
      goalPages.forEach(page => {
        page.classList.remove('active');
      });

      // Show current page
      document.querySelector(`.goal-page[data-page="${currentPage}"]`).classList.add('active');

      // Update button states
      prevGoalsBtn.disabled = currentPage === 1;
      nextGoalsBtn.disabled = currentPage === totalPages;
    }

    // Previous button click handler
    prevGoalsBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        updateGoalPages();
      }
    });

    // Next button click handler
    nextGoalsBtn.addEventListener('click', function() {
      if (currentPage < totalPages) {
        currentPage++;
        updateGoalPages();
      }
    });

    // Initialize pagination
    updateGoalPages();
    
    // Initialize allocation chart
    const allocationCtx = document.getElementById('allocationChart').getContext('2d');
    const allocationChart = new Chart(allocationCtx, {
      type: 'pie',
      data: {
        labels: [
          'FTSE Bursa Malaysia KLCI ETF',
          'Malaysian Government Securities',
          'Malaysian REITs',
          'ASEAN Equity Funds',
          'Fixed Deposits'
        ],
        datasets: [{
          data: [25, 20, 15, 25, 15],
          backgroundColor: [
            '#4CAF50',
            '#2196F3',
            '#9C27B0',
            '#FF9800',
            '#607D8B'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.raw + '%';
              }
            }
          }
        }
      }
    });
    
    // Initialize risk-return chart in modal
    const riskReturnCtx = document.getElementById('riskReturnChart').getContext('2d');
    const riskReturnChart = new Chart(riskReturnCtx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Conservative',
            data: [{ x: 5, y: 3.5 }],
            backgroundColor: '#4CAF50',
            pointRadius: 10
          },
          {
            label: 'Moderate',
            data: [{ x: 10, y: 5.8 }],
            backgroundColor: '#FF9800',
            pointRadius: 10
          },
          {
            label: 'Aggressive',
            data: [{ x: 15, y: 7.5 }],
            backgroundColor: '#F44336',
            pointRadius: 10
          },
          {
            label: 'Your Strategy',
            data: [{ x: 10, y: 5.8 }],
            backgroundColor: '#6366f1',
            pointRadius: 12,
            pointStyle: 'star'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (Volatility)'
            },
            min: 0,
            max: 20
          },
          y: {
            title: {
              display: true,
              text: 'Expected Return (%)'
            },
            min: 0,
            max: 10
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + context.raw.y + '% return, ' + context.raw.x + ' risk';
              }
            }
          }
        }
      }
    });
    
    // Risk slider functionality
    const riskSlider = document.getElementById('riskSlider');
    riskSlider.addEventListener('input', function() {
      // This would update the recommendation in a real app
      // For this demo, we'll just log the value
      console.log('Risk level:', this.value);
    });
    
    // Generate strategy button
    const generateStrategyBtn = document.getElementById('generateStrategyBtn');
    generateStrategyBtn.addEventListener('click', function() {
      // In a real app, this would generate a new strategy based on the selected goal and risk level
      // For this demo, we'll just scroll to the recommendation section
      document.querySelector('.strategy-recommendation').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Download strategy button
    const downloadStrategyBtn = document.getElementById('downloadStrategyBtn');
    downloadStrategyBtn.addEventListener('click', function() {
      alert('Strategy PDF downloaded successfully!');
    });
    
    // Implement strategy button
    const implementStrategyBtn = document.getElementById('implementStrategyBtn');
    implementStrategyBtn.addEventListener('click', function() {
      alert('Strategy implementation initiated! You will be redirected to the investment platform to complete the process.');
    });
    
    // Regenerate button
    const regenerateBtn = document.getElementById('regenerateBtn');
    regenerateBtn.addEventListener('click', function() {
      alert('Generating alternative strategy...');
      // In a real app, this would generate a new strategy
    });
    
    // ROI Calculator
    const calculateRoiBtn = document.getElementById('calculateRoiBtn');
    calculateRoiBtn.addEventListener('click', function() {
      const initialInvestment = parseFloat(document.getElementById('initialInvestment').value);
      const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value);
      const annualReturn = parseFloat(document.getElementById('annualReturn').value) / 100;
      const investmentPeriod = parseInt(document.getElementById('investmentPeriod').value);
      
      // Calculate results
      const monthlyRate = annualReturn / 12;
      let balance = initialInvestment;
      
      for (let i = 0; i < investmentPeriod * 12; i++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }
      
      const totalInvestment = initialInvestment + (monthlyContribution * investmentPeriod * 12);
      const totalInterest = balance - totalInvestment;
      const roi = (totalInterest / totalInvestment) * 100;
      
      // Update results
      document.getElementById('totalInvestment').textContent = 'RM' + totalInvestment.toFixed(2);
      document.getElementById('totalInterest').textContent = 'RM' + totalInterest.toFixed(2);
      document.getElementById('finalBalance').textContent = 'RM' + balance.toFixed(2);
      document.getElementById('roiPercentage').textContent = roi.toFixed(2) + '%';
    });
    
    // Save goal button
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    saveGoalBtn.addEventListener('click', function() {
      // In a real app, this would save the goal to a database
      // For this demo, we'll just close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addGoalModal'));
      modal.hide();
      
      // Show success message
      alert('Goal added successfully!');
    });
  });