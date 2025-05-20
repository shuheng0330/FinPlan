document.addEventListener('DOMContentLoaded', function() {
    // Filter functionality
    const filterDropdowns = document.querySelectorAll('.filter-dropdown');
    const goalCards = document.querySelectorAll('[data-category], [data-progress], [data-priority]');
    
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
    
    // Icon selector functionality
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remove selected class from all options in the same selector
        const parentSelector = this.closest('.icon-selector');
        parentSelector.querySelectorAll('.icon-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
      });
    });
    
    // Add Goal functionality
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    saveGoalBtn.addEventListener('click', function() {
      // Here you would normally save the data to a database
      // For this demo, we'll just close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addGoalModal'));
      modal.hide();
      
      // Show success message
      alert('Goal added successfully!');
      
      // Reset form
      document.getElementById('addGoalForm').reset();
      
      // Reset icon selection
      document.querySelectorAll('.icon-selector .icon-option').forEach((opt, index) => {
        if (index === 0) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    });
    
    // Edit Goal functionality
    const editButtons = document.querySelectorAll('[data-bs-target="#editGoalModal"]');
    editButtons.forEach(button => {
      button.addEventListener('click', function() {
        const goalId = this.getAttribute('data-goal-id');
        document.getElementById('editGoalId').value = goalId;
        
        // In a real application, you would fetch the goal data and populate the form
        // For this demo, we'll pre-fill with sample data based on the goal ID
        let goalData = {};
        
        switch(goalId) {
          case '1': // Vacation
            goalData = {
              name: 'Vacation',
              amount: 2500,
              current: 1300,
              targetDate: '2025-12-31',
              startDate: '2023-01-15',
              priority: 'low',
              icon: 'vacation'
            };
            break;
          case '2': // Home Renovation
            goalData = {
              name: 'Home Renovation',
              amount: 35000,
              current: 15750,
              targetDate: '2025-12-31',
              startDate: '2023-03-10',
              priority: 'high',
              icon: 'house'
            };
            break;
          case '3': // Emergency Fund
            goalData = {
              name: 'Emergency Fund',
              amount: 50000,
              current: 50000,
              targetDate: '2025-12-31',
              startDate: '2022-02-05',
              priority: 'high',
              icon: 'emergency'
            };
            break;
          case '4': // New Car
            goalData = {
              name: 'New Car',
              amount: 25000,
              current: 6250,
              targetDate: '2025-12-31',
              startDate: '2023-05-20',
              priority: 'medium',
              icon: 'car'
            };
            break;
          case '5': // Education
            goalData = {
              name: 'Education',
              amount: 35000,
              current: 26250,
              targetDate: '2025-12-31',
              startDate: '2022-04-12',
              priority: 'high',
              icon: 'education'
            };
            break;
          case '6': // Investments
            goalData = {
              name: 'Investments',
              amount: 80000,
              current: 52000,
              targetDate: '2023-12-31',
              startDate: '2021-06-03',
              priority: 'medium',
              icon: 'investment'
            };
            break;
        }
        
        // Populate form with goal data
        document.getElementById('editGoalName').value = goalData.name;
        document.getElementById('editGoalAmount').value = goalData.amount;
        document.getElementById('editCurrentAmount').value = goalData.current;
        document.getElementById('editTargetDate').value = goalData.targetDate;
        document.getElementById('editStartDate').value = goalData.startDate;
        document.getElementById('editGoalPriority').value = goalData.priority;
        
        // Set selected icon
        const iconSelector = document.getElementById('editIconSelector');
        iconSelector.querySelectorAll('.icon-option').forEach(opt => {
          const iconType = opt.querySelector('img').getAttribute('data-icon');
          if (iconType === goalData.icon) {
            opt.classList.add('selected');
          } else {
            opt.classList.remove('selected');
          }
        });
      });
    });
    
    
    // Update Goal functionality
    const updateGoalBtn = document.getElementById('updateGoalBtn');
    updateGoalBtn.addEventListener('click', function() {
      // Here you would normally update the data in a database
      // For this demo, we'll just close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editGoalModal'));
      modal.hide();
      
      // Show success message
      alert('Goal updated successfully!');
    });
    
    // Delete Goal functionality
    const deleteButtons = document.querySelectorAll('[data-bs-target="#deleteGoalModal"]');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const goalId = this.getAttribute('data-goal-id');
        document.getElementById('deleteGoalId').value = goalId;
      });
    });
    
    // Confirm Delete functionality
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDeleteBtn.addEventListener('click', function() {
      const goalId = document.getElementById('deleteGoalId').value;
      
      // Here you would normally delete the data from a database
      // For this demo, we'll just close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteGoalModal'));
      modal.hide();
      
      // Show success message
      alert('Goal deleted successfully!');
    });

    // Make goal cards clickable
    const goalCards2 = document.querySelectorAll('.goal-card');
    goalCards2.forEach(card => {
      card.addEventListener('click', function(e) {
        // Don't navigate if clicking on the options menu or its children
        if (e.target.closest('.goal-options')) {
          return;
        }
        
        // Navigate to the goal details page
        window.location.href = '/goal-details';
      });
      
      // Add pointer cursor to indicate clickable
      card.style.cursor = 'pointer';
    });
  });