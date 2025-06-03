function initializeAddGoalForm(showToastCallback){
    // --- Icon Selection Logic (Modified to store the selected icon) ---
    const iconOptions = document.querySelectorAll(".icon-option");
    let selectedIcon = ''; // Variable to store the selected icon's data-icon value

    // ADD THIS LINE: Define initiallySelectedIconOption here
    const initiallySelectedIconOption = document.querySelector('.icon-option.selected');

    iconOptions.forEach(option => {
        option.addEventListener("click", () => {
            iconOptions.forEach(o => o.classList.remove("selected"));
            option.classList.add("selected");
            selectedIcon = option.querySelector('img').dataset.icon;
        });
    });

    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', async function() {
            const addGoalForm = document.getElementById('addGoalForm');

            if (!addGoalForm.checkValidity()) {
                addGoalForm.reportValidity();
                return;
            }

            const goalName = document.getElementById('goalName').value.trim();
            const goalAmount = parseFloat(document.getElementById('goalAmount').value);
            const currentAmount = parseFloat(document.getElementById('currentAmount').value);
            const targetDate = document.getElementById('targetDate').value;
            const startDate = document.getElementById('startDate').value;
            const goalPriority = document.getElementById('goalPriority').value;

            if (goalName === '') {
                document.getElementById('goalName').focus();
                if (showToastCallback) showToastCallback('Goal name cannot be empty.', 'error');
                else alert('Goal name cannot be empty.');
                return;
            }
            if (isNaN(goalAmount) || goalAmount <= 0) {
                if (showToastCallback) showToastCallback('Please enter a valid positive Goal Amount.', 'error');
                else alert('Please enter a valid positive Goal Amount.');

                document.getElementById('goalAmount').focus();
                return;
            }
            if (isNaN(currentAmount) || currentAmount < 0) {
                if (showToastCallback) showToastCallback('Please enter a valid non-negative Current Amount.', 'error');
                else alert('Please enter a valid non-negative Current Amount.');

                document.getElementById('currentAmount').focus();
                return;
            }
            if (currentAmount > goalAmount) {
                if (showToastCallback) showToastCallback('Current amount cannot be greater than goal amount.', 'error');
                else alert('Current amount cannot be greater than goal amount.');

                document.getElementById('currentAmount').focus();
                return;
            }

            const parsedStartDate = new Date(startDate);
            const parsedTargetDate = new Date(targetDate);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedTargetDate.getTime())) {
                if (showToastCallback) showToastCallback('Please select a Start or target Date.', 'error');
                else alert('Please select a Start or target Date.');

                return;
            }
            if (parsedStartDate > parsedTargetDate) {
                if (showToastCallback) showToastCallback('Start Date must be before Target Date.', 'error');
                else alert('Start Date must be before Target Date.');

                document.getElementById('startDate').focus();
                return;
            }
            if (!selectedIcon) {
                if (showToastCallback) showToastCallback('Please select an icon for your goal.', 'error');
                else alert('Please select an icon for your goal.');
                
                return;
            }

            const goalData = {
                goalName,
                goalAmount,
                currentAmount,
                targetDate,
                startDate,
                goalPriority,
                icon: selectedIcon
            };

            console.log('Attempting to send goal data:', goalData);

            try {
                const response = await fetch('/goal-planning', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(goalData),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Goal saved successfully:', result);

                    const modalElement = document.getElementById('addGoalModal');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                        modal.hide();
                    }

                    showToast('Goal added successfully!',success);
                    window.location.reload(); // Reloads the page

                    addGoalForm.reset();
                    iconOptions.forEach(opt => opt.classList.remove('selected'));
                    // This block will now work correctly as initiallySelectedIconOption is defined
                    if (initiallySelectedIconOption) {
                        initiallySelectedIconOption.classList.add('selected');
                        selectedIcon = initiallySelectedIconOption.querySelector('img').dataset.icon;
                    } else {
                        selectedIcon = '';
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Error saving goal:', errorData);
                    alert('Error saving goal: ' + (errorData.errors || 'Something went wrong. Please check your inputs.'));
                }
            } catch (error) {
                console.error('Network error or unexpected issue:', error);
                alert('Failed to connect to the server. Please check your internet connection or try again later.');
            }
        });
    }
}


export { initializeAddGoalForm };