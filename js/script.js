const slider = document.getElementById("investmentPeriodRange");
const input = document.getElementById("sliderValue");

slider.addEventListener("input", () => {
  input.value = slider.value;
});

input.addEventListener("input", () => {
  let val = parseInt(input.value);
  if (val >= 1 && val <= 50) {
    slider.value = val;
  }
});
