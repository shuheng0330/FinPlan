 import { SimpleGoalChart } from './SimpleGoalChart.js';

 document.addEventListener('DOMContentLoaded', function() {

  const realData = window.realGoalData;
  window.goalChart = new SimpleGoalChart(realData);

    // Set progress in the circular chart
    const progressCircle = document.getElementById("progressCircle");
    const svgElement = progressCircle.closest("svg");

    const percentage = parseFloat(svgElement.dataset.percentage);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = `${circumference}`;

    const offset = circumference * (1 - percentage / 100);
    progressCircle.style.strokeDashoffset = offset;
    
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
    
    
   // Add Transaction functionality 
const saveTransactionBtn = document.getElementById('saveTransactionBtn');

saveTransactionBtn.addEventListener('click', function () {
  const form = document.getElementById('addTransactionForm');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }


  const goalHeader = document.querySelector('.goal-header[data-goal-id]');
  if (!goalHeader) {
    alert('No goal ID found.');
    return;
  }
  const goalId = goalHeader.getAttribute('data-goal-id');

  // Get form values
  const description = document.getElementById('transactionDescription').value;
  const amount = parseFloat(document.getElementById('transactionAmount').value);
  const type = document.getElementById('transactionType').value;
  const date = document.getElementById('transactionDate').value;

  fetch('/goal-details/goalId', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goalId,
      description,
      amount,
      type,
      date
    })
  })
   .then(async response => {
    const data = await response.json(); // Read the response body in all cases

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save transaction.');
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    modal.hide();
    form.reset();
    location.reload(); 
  })
  .catch(error => {
    console.error(error);
    alert('An error occurred while saving the transaction:\n' + error.message);
  });

  });
      
      // // Update progress (in a real app, this would be calculated based on all transactions)
      // // This is just a simulation
      // const newAmount = type === 'deposit' 
      //   ? 1300 + parseFloat(amount) 
      //   : 1300 - parseFloat(amount);
      
      // const newPercentage = Math.min(Math.round((newAmount / 2500) * 100), 100);
      
      // // Update circular progress
      // progressCircle.style.strokeDashoffset = circumference * (1 - newPercentage / 100);
      
      // // Update the displayed amounts
      // document.querySelector('.progress-amount').textContent = `RM ${newAmount.toFixed(2)}`;
      // document.querySelector('.info-row:nth-child(3) .info-value').textContent = `RM ${(2500 - newAmount).toFixed(2)}`;
      
      // // Update chart data
      // const lastDataPoint = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
      // const newDataPoint = type === 'deposit' 
      //   ? lastDataPoint + parseFloat(amount) 
      //   : lastDataPoint - parseFloat(amount);
      
      // chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] = newDataPoint;
      // chart.update();
    
    // Set today's date as default in the transaction form
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;

  const deleteConfirmModal = document.getElementById('deleteConfirmModal');
  const transactionToDeleteElement = document.getElementById('transactionToDelete');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  let transactionIdToDelete = null;

  // When delete button is clicked, populate modal with transaction info
  deleteConfirmModal.addEventListener('show.bs.modal', function(event) {
    const button = event.relatedTarget;
    transactionIdToDelete = button.getAttribute('data-transaction-id');
    const transactionName = button.getAttribute('data-transaction-name');
    
    transactionToDeleteElement.textContent = transactionName;
  });

  
  // Handle actual deletion when confirm button is clicked
  confirmDeleteBtn.addEventListener('click', function () {
  if (transactionIdToDelete) {
    fetch(`/goal-details/transactions/${transactionIdToDelete}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete transaction');
        return response.json();
      })
      .then(data => {
        // Remove the transaction from UI
        const transactionElement = document.querySelector(`[data-transaction-id="${transactionIdToDelete}"]`);
        if (transactionElement) {
          transactionElement.remove();
        }

        // Close the modal
        const modal = bootstrap.Modal.getInstance(deleteConfirmModal);
        modal.hide();

        // Reset state
        transactionIdToDelete = null;

        location.reload();
        // Optional: show success feedback
        console.log('Transaction deleted successfully');
      })
      .catch(err => {
        console.error(err);
        alert('Error deleting transaction.');
      });
  }
});
});

