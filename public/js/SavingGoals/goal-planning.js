import { initializeAddGoalForm } from '/js/common-add-goal-logic.js'; // Adjust path if needed

document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    const goalCards = document.querySelectorAll('[data-category], [data-progress], [data-priority]');

    // Toast elements
    const successToast = document.getElementById('successToast');
    const successToastBody = document.getElementById('successToastBody');
    const errorToast = document.getElementById('errorToast');
    const errorToastBody = document.getElementById('errorToastBody');

    // Bootstrap Toast instances
    const bsSuccessToast = new bootstrap.Toast(successToast, { autohide: true, delay: 5000 });
    const bsErrorToast = new bootstrap.Toast(errorToast, { autohide: true, delay: 7000 });
    
    // --- Helper function to show toast messages ---
    function showToast(message, type = 'success') {
        if (type === 'success') {
            successToastBody.textContent = message;
            bsSuccessToast.show();
        } else {
            errorToastBody.textContent = message;
            bsErrorToast.show();
        }
    }

    // Current active filters
    let activeFilters = {
      category: [],
      progress: [],
      priority: []
    };
    
    // Apply filters function
    function applyFilters() {
      goalCards.forEach(card => {
        const categoryMatch = activeFilters.category.length === 0 || 
                             activeFilters.category.includes(card.getAttribute('data-category'));
        const progressMatch = activeFilters.progress.length === 0 || 
                             activeFilters.progress.includes(card.getAttribute('data-progress'));
        const priorityMatch = activeFilters.priority.length === 0 || 
                             activeFilters.priority.includes(card.getAttribute('data-priority'));
        
        if (categoryMatch && progressMatch && priorityMatch) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
    
    // Initialize dropdowns
    filterDropdowns.forEach(dropdown => {
      const input = dropdown.querySelector('.filter-input');
      const options = dropdown.querySelector('.filter-dropdown-content');
      const tags = dropdown.querySelector('.filter-tags');
      const filterType = dropdown.id.replace('Dropdown', '');
      
      // Toggle dropdown
      input.addEventListener('click', function() {
        options.classList.toggle('show');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target)) {
          options.classList.remove('show');
        }
      });
      
      // Handle option selection
      const optionElements = options.querySelectorAll('.filter-option');
      optionElements.forEach(option => {
        option.addEventListener('click', function() {
          const value = this.getAttribute('data-value');
          const text = this.textContent.trim();
          const icon = this.querySelector('img')?.outerHTML || '';
          
          // Check if already selected
          if (!activeFilters[filterType].includes(value)) {
            // Add to active filters
            activeFilters[filterType].push(value);
            
            // Create tag
            const icon2 = `<img src="../../svgs/${text}-svgrepo-com.svg" alt="Vacation" class="filter-icon">`;
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            tag.setAttribute('data-value', value);
            if (icon !==  ''){
            tag.innerHTML = `${icon2} ${text} <span class="filter-tag-close">✕</span>`;
            tags.appendChild(tag);}
            else{
              tag.innerHTML = `${text} <span class="filter-tag-close">✕</span>`;
              tags.appendChild(tag);
            }
            // Add click event to remove tag
            tag.querySelector('.filter-tag-close').addEventListener('click', function() {
              // Remove from active filters
              activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
              // Remove tag
              tag.remove();
              // Apply filters
              applyFilters();
            });
            
            // Apply filters
            applyFilters();
          }
          
          // Close dropdown
          options.classList.remove('show');
        });
      });
    });
    
    // Reset all filters
    document.getElementById('resetAllFilters').addEventListener('click', function(e) {
      e.preventDefault();
      
      // Clear all active filters
      activeFilters = {
        category: [],
        progress: [],
        priority: []
      };
      
      // Clear all tags
      document.querySelectorAll('.filter-tags').forEach(tagContainer => {
        tagContainer.innerHTML = '';
      });
      
      // Show all cards
      goalCards.forEach(card => {
        card.style.display = 'block';
      });
    });


    initializeAddGoalForm(showToast);
    
    // Edit Goal functionality
    const editButtons = document.querySelectorAll('[data-bs-target="#editGoalModal"]');
    editButtons.forEach(button => {
      button.addEventListener('click', async function () {
      const goalId = this.getAttribute('data-goal-id');  // set its id when the modal is opened
      console.log(goalId)
      document.getElementById('editGoalId').value = goalId;

    try {
      const response = await fetch(`/goal-planning/${goalId}`);
      if (!response.ok) {
        throw new Error('Goal not found');
      }

      const result = await response.json();
      const goalData = result.data.goal; // Adjust based on your API's response structure

      // Populate form fields
      document.getElementById('editGoalName').value = goalData.goalName;
      document.getElementById('editGoalAmount').value = goalData.goalAmount;
      document.getElementById('editCurrentAmount').value = goalData.currentAmount;
      document.getElementById('editTargetDate').value = goalData.targetDate?.substring(0, 10); // Format as YYYY-MM-DD
      document.getElementById('editStartDate').value = goalData.startDate?.substring(0, 10);
      document.getElementById('editGoalPriority').value = goalData.goalPriority;
      // Highlight selected icon
      const iconSelector = document.querySelector('.edit-icon-selector');
      iconSelector.querySelectorAll('.icon-option').forEach(opt => {
        const iconType = opt.querySelector('img').getAttribute('data-icon');
        if (iconType === goalData.icon) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    } catch (err) {
      console.error('Failed to fetch goal data:', err);
    }
  });
});
       
    // Update Goal functionality
   const updateGoalBtn = document.getElementById('updateGoalBtn');
    if (updateGoalBtn) {
    updateGoalBtn.addEventListener('click', async function () {
        const editGoalId = document.getElementById('editGoalId').value;
        const name = document.getElementById('editGoalName').value.trim();
        const amount = parseFloat(document.getElementById('editGoalAmount').value);
        const current = parseFloat(document.getElementById('editCurrentAmount').value);
        const targetDate = document.getElementById('editTargetDate').value;
        const startDate = document.getElementById('editStartDate').value;
        const priority = document.getElementById('editGoalPriority').value;
        const icon = document.querySelector('.edit-icon-selector .icon-option.selected img').dataset.icon;
        console.log(priority);

        if (name === '' || isNaN(amount) || isNaN(current) || !targetDate || !startDate || !icon) {
            alert('Please fill in all required fields correctly.');
            return;
        }

        const updatedGoal = {
            goalName: name,
            goalAmount: amount,
            currentAmount: current,
            targetDate,
            startDate,
            goalPriority: priority,
            icon
        };

        try {
            const response = await fetch(`/goal-planning/${editGoalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatedGoal)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Goal updated:', result);

                const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
                modal.hide();

                alert('Goal updated successfully!');
                window.location.reload(); // Optional: Refresh to see changes
            } else {
                const errorData = await response.json();
                console.error('Error updating goal:', errorData);
                alert('Update failed: ' + (errorData.message || 'Something went wrong.'));
            }
        } catch (error) {
            console.error('Error during update:', error);
            alert('Failed to update goal. Please try again later.');
        }
    });
}
    const deleteButtons = document.querySelectorAll('[data-bs-target="#deleteGoalModal"]');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const goalId = this.getAttribute('data-goal-id');
        document.getElementById('deleteGoalId').value = goalId;
      });
    });
        

    // Confirm Delete functionality
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDeleteBtn.addEventListener('click', async function() {
      const goalId = document.getElementById('deleteGoalId').value;
      console.log(goalId);
       try {
        const response = await fetch(`/goal-planning/${goalId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Goal deleted successfully:', result);
            alert('Goal deleted successfully!');
            window.location.reload(); // Refresh page to reflect deletion
        } else {
            const errorData = await response.json();
            console.error('Error deleting goal:', errorData);
            alert('Error deleting goal: ' + (errorData.message || 'Something went wrong.'));
        }
    } catch (error) {
        console.error('Network error or unexpected issue:', error);
        alert('Failed to delete goal. Please check your connection and try again.');
    }
    });

    // Make goal cards clickable
    const goalCards2 = document.querySelectorAll('.goal-card');

goalCards2.forEach(card => {
  card.addEventListener('click', function(e) {
    // Don't navigate if clicking on the options menu or its children
    if (e.target.closest('.goal-options')) {
      return;
    }

    const goalId = card.getAttribute('data-goal-id');
    if (goalId) {
      window.location.href = `/goal-details/${goalId}`;
    }
  });

  // Add pointer cursor to indicate clickable
  card.style.cursor = 'pointer';
});
  });