export class SimpleGoalChart {
  constructor(goalData) {
    this.goalData = goalData;
    this.chart = null;
    this.currentPeriod = this.getSmartPeriod();
    
    this.init();
  }
  
  init() {
    this.setupTimePeriods();
    this.renderChart();
    this.updateStatus();
    this.showInsight();
  }
  
  // Automatically choose the best time period based on goal duration
  getSmartPeriod() {
    const durationMonths = this.getGoalDurationMonths();
    
    if (durationMonths <= 3) return 'week';
    if (durationMonths <= 12) return 'month';
    if (durationMonths <= 36) return 'quarter';
    return 'year';
  }
  
  getGoalDurationMonths() {
    const start = new Date(this.goalData.startDate);
    const end = new Date(this.goalData.targetDate);
    return (end - start) / (1000 * 60 * 60 * 24 * 30.44); // More accurate month calculation
  }
  
  setupTimePeriods() {
    const durationMonths = this.getGoalDurationMonths();
    const container = document.getElementById('timePeriods');
    
    let periods = [];
    
    // Only show relevant periods based on goal duration
    if (durationMonths <= 6) {
      periods = [
        { key: 'week', label: 'Weekly' },
        { key: 'month', label: 'Monthly' }
      ];
    } else if (durationMonths <= 24) {
      periods = [
        { key: 'month', label: 'Monthly' },
        { key: 'quarter', label: 'Quarterly' }
      ];
    } else {
      periods = [
        { key: 'quarter', label: 'Quarterly' },
        { key: 'year', label: 'Yearly' }
      ];
    }
    
    container.innerHTML = periods.map(period => 
      `<button class="${period.key === this.currentPeriod ? 'active' : ''}" 
               onclick="goalChart.changePeriod('${period.key}', this)">${period.label}</button>`
    ).join('');
  }
  
  changePeriod(period, buttonEl) {
    this.currentPeriod = period;

    // Remove existing active class
    document.querySelectorAll('#timePeriods button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active to clicked button
    if (buttonEl) {
      buttonEl.classList.add('active');
    }

    this.renderChart();
  }
  
  renderChart() {
    const ctx = document.getElementById('goalChart').getContext('2d');
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const data = this.getChartData();
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Your Progress',
            data: data.actual,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Target Path',
            data: data.target,
            borderColor: '#2196F3',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Projection',
            data: data.projection,
            borderColor: '#ff9800',
            backgroundColor: 'transparent',
            borderDash: [3, 3],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: this.goalData.goalAmount * 1.1,
            ticks: {
              callback: function(value) {
                return 'RM' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
  
  getChartData() {
    const periods = this.generatePeriods();
    const actual = this.generateActualData(periods);
    const target = this.generateTargetData(periods);
    const projection = this.generateProjectionData(periods, actual);
    
    return {
      labels: periods.labels,
      actual: actual,
      target: target,
      projection: projection
    };
  }
  
  generatePeriods() {
    const start = new Date(this.goalData.startDate);
    const end = new Date(this.goalData.targetDate);
    const now = new Date();
    
    const periods = [];
    const periodDates = [];
    let current = new Date(start);
    
    // Generate periods from start to end date
    while (current <= end) {
      const periodDate = new Date(current);
      periodDates.push(periodDate);
      
      if (this.currentPeriod === 'week') {
        periods.push(current.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' }));
        current.setDate(current.getDate() + 7);
      } else if (this.currentPeriod === 'month') {
        periods.push(current.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' }));
        current.setMonth(current.getMonth() + 1);
      } else if (this.currentPeriod === 'quarter') {
        periods.push(`Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}`);
        current.setMonth(current.getMonth() + 3);
      } else {
        periods.push(current.getFullYear().toString());
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    // Ensure we don't exceed reasonable chart limits
    const maxPeriods = 20;
    return {
      labels: periods.slice(0, maxPeriods),
      dates: periodDates.slice(0, maxPeriods)
    };
  }
  
  generateActualData(periods) {
    const now = new Date();
    const start = new Date(this.goalData.startDate);
    const currentAmount = this.goalData.currentAmount;
    
    const data = [];
    let currentPeriodIndex = -1;
    
    // Find which period we're currently in
    for (let i = 0; i < periods.dates.length; i++) {
      if (periods.dates[i] <= now) {
        currentPeriodIndex = i;
      } else {
        break;
      }
    }
    
    // Generate progress data up to current period
    for (let i = 0; i < periods.labels.length; i++) {
      if (i <= currentPeriodIndex) {
        // Calculate cumulative progress for past/current periods
        const progressRatio = (i + 1) / (currentPeriodIndex + 1);
        const amount = currentAmount * progressRatio;
        
        // Add some realistic variation for past periods (not the current one)
        if (i < currentPeriodIndex) {
          const variation = amount * 0.15 * (Math.random() - 0.5);
          data.push(Math.max(0, amount + variation));
        } else {
          // Current period shows exact current amount
          data.push(currentAmount);
        }
      } else {
        // Future periods are null
        data.push(null);
      }
    }
    
    return data;
  }
  
  generateTargetData(periods) {
    const start = new Date(this.goalData.startDate);
    const end = new Date(this.goalData.targetDate);
    const totalDuration = end - start;
    const goalAmount = this.goalData.goalAmount;
    
    return periods.dates.map(periodDate => {
      const timeElapsed = (periodDate - start) / totalDuration;
      return Math.min(goalAmount * Math.max(0, timeElapsed), goalAmount);
    });
  }
  
  generateProjectionData(periods, actualData) {
    const now = new Date();
    const start = new Date(this.goalData.startDate);
    const end = new Date(this.goalData.targetDate);
    const currentAmount = this.goalData.currentAmount;
    
    const data = Array(periods.labels.length).fill(null);
    
    // Find the current period index
    let currentPeriodIndex = -1;
    for (let i = 0; i < periods.dates.length; i++) {
      if (periods.dates[i] <= now) {
        currentPeriodIndex = i;
      } else {
        break;
      }
    }
    
    if (currentPeriodIndex >= 0 && currentPeriodIndex < periods.labels.length - 1) {
      // Calculate average savings rate based on time elapsed
      const timeElapsedMs = now - start;
      const timeElapsedMonths = timeElapsedMs / (1000 * 60 * 60 * 24 * 30.44);
      const monthlyRate = timeElapsedMonths > 0 ? currentAmount / timeElapsedMonths : 0;
      
      // Project from current period onwards
      for (let i = currentPeriodIndex; i < periods.labels.length; i++) {
        if (i === currentPeriodIndex) {
          // Current period shows current amount
          data[i] = currentAmount;
        } else {
          // Calculate months from current period to this future period
          const currentPeriodDate = periods.dates[currentPeriodIndex];
          const futurePeriodDate = periods.dates[i];
          const monthsFromNow = (futurePeriodDate - currentPeriodDate) / (1000 * 60 * 60 * 24 * 30.44);
          
          // Project based on current monthly rate
          const projectedAmount = currentAmount + (monthlyRate * monthsFromNow);
          data[i] = Math.max(currentAmount, projectedAmount);
        }
      }
    }
    
    return data;
  }
  
  updateStatus() {
    const progress = this.goalData.progress;
    const timeElapsed = this.getTimeElapsedPercentage();
    const statusElement = document.getElementById('progressStatus');
    
    if (progress > timeElapsed + 5) {
      statusElement.className = 'progress-status status-ahead';
      statusElement.innerHTML = '<i class="bi bi-arrow-up-circle"></i><span>Ahead</span>';
    } else if (progress < timeElapsed - 5) {
      statusElement.className = 'progress-status status-behind';
      statusElement.innerHTML = '<i class="bi bi-exclamation-circle"></i><span>Behind</span>';
    } else {
      statusElement.className = 'progress-status status-on-track';
      statusElement.innerHTML = '<i class="bi bi-check-circle"></i><span>On Track</span>';
    }
  }
  
  showInsight() {
    const progress = this.goalData.progress;
    const timeElapsed = this.getTimeElapsedPercentage();
    const remaining = this.goalData.goalAmount - this.goalData.currentAmount;
    const monthsLeft = this.getMonthsRemaining();
    const totalMonths = this.getGoalDurationMonths();
    const currentAmount = this.goalData.currentAmount;
    const goalAmount = this.goalData.goalAmount;
    
    // Calculate elapsed time more precisely
    const start = new Date(this.goalData.startDate);
    const now = new Date();
    const daysElapsed = Math.max(1, (now - start) / (1000 * 60 * 60 * 24)); // At least 1 day
    const monthsElapsed = Math.max(0.1, daysElapsed / 30.44); // At least 0.1 months
    
    // Calculate rates based on appropriate time units
    let currentRate, currentRateUnit, idealRate, idealRateUnit, neededRate, neededRateUnit;
    
    if (totalMonths <= 0.5) {
      // Less than 2 weeks - use daily rates
      currentRate = currentAmount / daysElapsed;
      currentRateUnit = 'day';
      idealRate = goalAmount / Math.max(1, (new Date(this.goalData.targetDate) - start) / (1000 * 60 * 60 * 24));
      idealRateUnit = 'day';
      neededRate = remaining / Math.max(1, monthsLeft * 30.44);
      neededRateUnit = 'day';
    } else if (totalMonths <= 2) {
      // Less than 2 months - use weekly rates
      const weeksElapsed = Math.max(0.1, daysElapsed / 7);
      const weeksLeft = Math.max(0.1, monthsLeft * 4.33);
      const totalWeeks = totalMonths * 4.33;
      
      currentRate = currentAmount / weeksElapsed;
      currentRateUnit = 'week';
      idealRate = goalAmount / totalWeeks;
      idealRateUnit = 'week';
      neededRate = remaining / weeksLeft;
      neededRateUnit = 'week';
    } else {
      // 2+ months - use monthly rates
      currentRate = currentAmount / monthsElapsed;
      currentRateUnit = 'month';
      idealRate = goalAmount / totalMonths;
      idealRateUnit = 'month';
      neededRate = remaining / monthsLeft;
      neededRateUnit = 'month';
    }
    
    // Calculate projection based on current rate
    const projectedFinalAmount = currentAmount + (currentRate * (currentRateUnit === 'day' ? monthsLeft * 30.44 : 
                                                                 currentRateUnit === 'week' ? monthsLeft * 4.33 : 
                                                                 monthsLeft));
    const projectedShortfall = Math.max(0, goalAmount - projectedFinalAmount);
    const projectedSurplus = Math.max(0, projectedFinalAmount - goalAmount);
    
    // Format time remaining more precisely
    const formatTimeRemaining = (months) => {
      if (months < 0.5) {
        const days = Math.round(months * 30.44);
        return `${days} day${days !== 1 ? 's' : ''}`;
      } else if (months < 2) {
        const weeks = Math.round(months * 4.33 * 10) / 10;
        return `${weeks} week${weeks !== 1 ? 's' : ''}`;
      } else {
        const formattedMonths = Math.round(months * 10) / 10;
        return `${formattedMonths} month${formattedMonths !== 1 ? 's' : ''}`;
      }
    };
    
    // Format time ahead/behind
    const formatTimeDifference = (percentageDiff) => {
      const daysDiff = Math.round((percentageDiff / 100) * (totalMonths * 30.44));
      if (Math.abs(daysDiff) < 7) {
        return `${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''}`;
      } else if (Math.abs(daysDiff) < 60) {
        const weeksDiff = Math.round(daysDiff / 7 * 10) / 10;
        return `${Math.abs(weeksDiff)} week${Math.abs(weeksDiff) !== 1 ? 's' : ''}`;
      } else {
        const monthsDiff = Math.round(daysDiff / 30.44 * 10) / 10;
        return `${Math.abs(monthsDiff)} month${Math.abs(monthsDiff) !== 1 ? 's' : ''}`;
      }
    };
    
    let insight = '';
    let icon = 'bi-lightbulb text-warning';
    
    if (progress > timeElapsed + 10) {
      // Significantly ahead
      const timeDiff = formatTimeDifference(progress - timeElapsed);
      const surplusAmount = Math.round(projectedSurplus);
      
      if (surplusAmount > 0) {
        insight = `🎉 Excellent progress! You're ${timeDiff} ahead of schedule. At your current rate of RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit}, you'll exceed your goal by RM${surplusAmount.toLocaleString()}. You could reduce to RM${Math.round(neededRate).toLocaleString()}/${neededRateUnit} and still reach your RM${goalAmount.toLocaleString()} target in ${formatTimeRemaining(monthsLeft)}.`;
      } else {
        insight = `🎉 Outstanding! You're ${timeDiff} ahead, saving RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit} vs the target pace of RM${Math.round(idealRate).toLocaleString()}/${idealRateUnit}. Keep up this momentum!`;
      }
      icon = 'bi-trophy text-success';
      
    } else if (progress < timeElapsed - 10) {
      // Significantly behind
      const timeDiff = formatTimeDifference(timeElapsed - progress);
      const shortfall = Math.round(projectedShortfall);
      const increaseNeeded = Math.round(neededRate - currentRate);
      
      insight = `⚠️ You're ${timeDiff} behind schedule. Current pace: RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit}, but you need RM${Math.round(neededRate).toLocaleString()}/${neededRateUnit} (${increaseNeeded > 0 ? '+RM' + increaseNeeded.toLocaleString() : 'RM' + Math.abs(increaseNeeded).toLocaleString() + ' reduction'}) for the remaining ${formatTimeRemaining(monthsLeft)}. Without changes, you'll be short by RM${shortfall.toLocaleString()}.`;
      icon = 'bi-exclamation-triangle text-danger';
      
    } else if (progress > timeElapsed + 5) {
      // Slightly ahead
      const timeDiff = formatTimeDifference(progress - timeElapsed);
      insight = `✅ You're ${timeDiff} ahead! Current rate: RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit}. Maintain RM${Math.round(neededRate).toLocaleString()}/${neededRateUnit} for the next ${formatTimeRemaining(monthsLeft)} to secure your RM${goalAmount.toLocaleString()} goal with room to spare.`;
      icon = 'bi-check-circle-fill text-success';
      
    } else if (progress < timeElapsed - 5) {
      // Slightly behind
      const timeDiff = formatTimeDifference(timeElapsed - progress);
      const increaseNeeded = Math.round(neededRate - currentRate);
      
      insight = `📈 You're ${timeDiff} behind, but easily recoverable! Boost from RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit} to RM${Math.round(neededRate).toLocaleString()}/${neededRateUnit} (+RM${increaseNeeded.toLocaleString()}) over the remaining ${formatTimeRemaining(monthsLeft)} to get back on track.`;
      icon = 'bi-arrow-up-circle text-warning';
      
    } else {
      // On track
      const performancePercentage = Math.round((currentRate / idealRate) * 100);
      
      insight = `🎯 Perfect timing! You're at ${performancePercentage}% of ideal pace (RM${Math.round(currentRate).toLocaleString()}/${currentRateUnit}). Continue with RM${Math.round(neededRate).toLocaleString()}/${neededRateUnit} for the next ${formatTimeRemaining(monthsLeft)} to hit your RM${goalAmount.toLocaleString()} target right on schedule.`;
      icon = 'bi-check-circle text-success';
    }
    
    document.getElementById('chartInsight').innerHTML = `
      <i class="${icon}"></i>
      <span>${insight}</span>
    `;
  }
  
  getTimeElapsedPercentage() {
    const start = new Date(this.goalData.startDate);
    const end = new Date(this.goalData.targetDate);
    const now = new Date();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }
  
  getMonthsRemaining() {
    const now = new Date();
    const end = new Date(this.goalData.targetDate);
    return Math.max(1, (end - now) / (1000 * 60 * 60 * 24 * 30.44));
  }
}