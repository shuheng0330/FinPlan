function initializeAddGoalForm(){
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
                alert('Goal Name cannot be empty.');
                document.getElementById('goalName').focus();
                return;
            }
            if (isNaN(goalAmount) || goalAmount <= 0) {
                alert('Target Amount must be a positive number.');
                document.getElementById('goalAmount').focus();
                return;
            }
            if (isNaN(currentAmount) || currentAmount < 0) {
                alert('Current Savings must be a non-negative number.');
                document.getElementById('currentAmount').focus();
                return;
            }
            if (currentAmount > goalAmount) {
                alert('Current Savings cannot be greater than Target Amount.');
                document.getElementById('currentAmount').focus();
                return;
            }

            const parsedStartDate = new Date(startDate);
            const parsedTargetDate = new Date(targetDate);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedTargetDate.getTime())) {
                alert('Please select valid Start and Target Dates.');
                return;
            }
            if (parsedStartDate > parsedTargetDate) {
                alert('Start Date cannot be after Target Date.');
                document.getElementById('startDate').focus();
                return;
            }
            if (!selectedIcon) {
                alert('Please select an icon for your goal.');
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

                    alert('Goal added successfully!');
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
                    alert('Error saving goal: ' + (errorData.message || 'Something went wrong. Please check your inputs.'));
                }
            } catch (error) {
                console.error('Network error or unexpected issue:', error);
                alert('Failed to connect to the server. Please check your internet connection or try again later.');
            }
        });
    }
}


export { initializeAddGoalForm };